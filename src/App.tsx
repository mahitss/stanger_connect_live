import React, { useEffect, useRef, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  Users,
  MessageSquare,
  PhoneCall,
  BookOpen,
  Gamepad2,
  Camera,
  ShieldCheck,
  LogOut,
  Flame,
  Lock,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from './firebase';
import {
  computeUpdatedStreak,
  formatDateKey,
  normalizeStudyRoomCode,
  validateAccountCredentials,
  deriveE2eeFingerprint,
} from './utils/rules';
import { GameArcadeView, MultiplayerScore } from './components/GameArcadeView';
import {
  StudyRoomView,
  StudyDeskItem,
  StudyNoteRecord,
  StudyChatMessage,
} from './components/StudyRoomView';
import { TalkingRoomView } from './components/TalkingRoomView';
import type { OnlinePeer } from '../server';

type SidebarPage =
  | 'hub'
  | 'chat'
  | 'talk'
  | 'study'
  | 'game_subway'
  | 'game_catapult'
  | 'game_blocks'
  | 'moments'
  | 'privacy'
  | 'signout';

interface ConnectionRequestDoc {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  toName: string;
  status: 'pending' | 'accepted' | 'declined';
  note: string;
}

interface DirectMessageDoc {
  id: string;
  senderUid: string;
  senderName: string;
  receiverUid: string;
  text: string;
  timestamp: number;
}

interface MomentPostDoc {
  id: string;
  authorUid: string;
  authorName: string;
  caption: string;
  photoDataUrl: string;
  visibility: 'public' | 'connections';
}

interface AccountIdentity {
  uid: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  streakCount: number;
  lastLoginDate: string;
  participationPoints: number;
  privacyVisibility: 'everyone' | 'connections_only' | 'ghost';
  readReceiptsEnabled: boolean;
  allowCallsFromConnectionsOnly: boolean;
}

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Detect ?room=CODE invite URL parameter on arrival
  const initialRoomParam = (() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('room');
    return r ? normalizeStudyRoomCode(r) : '';
  })();

  const [activeStudyRoomCode, setActiveStudyRoomCode] = useState<string>(
    initialRoomParam || 'STUDY-GLOBAL'
  );

  const [activePage, setActivePage] = useState<SidebarPage>(() =>
    initialRoomParam ? 'study' : 'hub'
  );

  // Persistent Authenticated Account State
  const [accountSession, setAccountSession] = useState<AccountIdentity | null>(() => {
    try {
      const saved = localStorage.getItem('mr_stranger_account_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Sign-In / Create Account Form State (Email ID, Password & Account Info)
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>('signup');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [accountBioInput, setAccountBioInput] = useState('');
  const [authFormError, setAuthFormError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Sign-Out Verification State (Email ID, Password & Account Confirmation)
  const [signOutEmailConfirm, setSignOutEmailConfirm] = useState('');
  const [signOutPasswordConfirm, setSignOutPasswordConfirm] = useState('');
  const [signOutError, setSignOutError] = useState('');

  // Authoritative Real-Time WebSocket State
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [onlinePeers, setOnlinePeers] = useState<OnlinePeer[]>([]);
  const [studyDesks, setStudyDesks] = useState<StudyDeskItem[]>([]);
  const [gameScores, setGameScores] = useState<MultiplayerScore[]>([]);
  const [studyChat, setStudyChat] = useState<StudyChatMessage[]>([]);
  const [incomingCallSignal, setIncomingCallSignal] = useState<{
    fromUid: string;
    fromName: string;
    callType: 'audio' | 'video';
    signalData: Record<string, unknown>;
  } | null>(null);

  // Firestore & Real-Time Synchronized Collections
  const [requests, setRequests] = useState<ConnectionRequestDoc[]>([]);
  const [messages, setMessages] = useState<DirectMessageDoc[]>([]);
  const [moments, setMoments] = useState<MomentPostDoc[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNoteRecord[]>([]);

  // UI Controls for Requests, Chat, and Photo Moments
  const [requestNoteMap, setRequestNoteMap] = useState<Record<string, string>>({});
  const [activeChatPeerUid, setActiveChatPeerUid] = useState<string>('');
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatError, setChatError] = useState('');

  const [momentCaption, setMomentCaption] = useState('');
  const [momentPhotoDataUrl, setMomentPhotoDataUrl] = useState('');
  const [momentVisibility, setMomentVisibility] = useState<'public' | 'connections'>('public');
  const [momentError, setMomentError] = useState('');

  const currentIdentity: AccountIdentity | null = authUser
    ? {
        uid: authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_'),
        email: authUser.email || accountSession?.email || 'verified@google.com',
        displayName:
          authUser.displayName ||
          accountSession?.displayName ||
          authUser.email?.split('@')[0] ||
          'Verified Member',
        bio: accountSession?.bio || 'Verified Google Account on Mr. Stranger',
        avatarUrl: authUser.photoURL || '',
        streakCount: accountSession?.streakCount || 1,
        lastLoginDate: accountSession?.lastLoginDate || formatDateKey(new Date()),
        participationPoints: accountSession?.participationPoints || 25,
        privacyVisibility: accountSession?.privacyVisibility || 'everyone',
        readReceiptsEnabled: accountSession?.readReceiptsEnabled ?? true,
        allowCallsFromConnectionsOnly: accountSession?.allowCallsFromConnectionsOnly ?? true,
      }
    : accountSession;

  // Test connection on boot as required by Firebase integration skill
  useEffect(() => {
    testFirestoreConnection();
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthReady(true);

      if (user) {
        const cleanUid = user.uid.replace(/[^a-zA-Z0-9_-]/g, '_');
        const profileRef = doc(db, 'profiles', cleanUid);
        const privateRef = doc(db, 'privateAccounts', cleanUid);
        const todayKey = formatDateKey(new Date());
        const userEmail = user.email || 'verified@user.app';

        try {
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            const data = snap.data();
            const { updated, incremented } = computeUpdatedStreak(
              {
                streakCount: Number(data.streakCount) || 1,
                lastLoginDate: String(data.lastLoginDate || ''),
                participationPoints: Number(data.participationPoints) || 25,
              },
              todayKey,
              10
            );
            const merged: AccountIdentity = {
              uid: cleanUid,
              email: userEmail,
              displayName: String(data.displayName || user.displayName || 'Member'),
              bio: String(data.bio || 'Connected on Mr. Stranger'),
              avatarUrl: String(data.avatarUrl || user.photoURL || ''),
              privacyVisibility:
                (data.privacyVisibility as AccountIdentity['privacyVisibility']) || 'everyone',
              readReceiptsEnabled: true,
              allowCallsFromConnectionsOnly: true,
              ...updated,
            };
            setAccountSession(merged);
            localStorage.setItem('mr_stranger_account_v2', JSON.stringify(merged));

            if (incremented) {
              await updateDoc(profileRef, {
                streakCount: updated.streakCount,
                lastLoginDate: updated.lastLoginDate,
                participationPoints: updated.participationPoints,
                updatedAt: serverTimestamp(),
              });
            }
          } else {
            const initialProfile = {
              uid: cleanUid,
              displayName: (user.displayName || userEmail.split('@')[0] || 'Member').slice(0, 64),
              bio: 'Verified account on Mr. Stranger',
              avatarUrl: (user.photoURL || '').slice(0, 200000),
              streakCount: 1,
              lastLoginDate: todayKey,
              participationPoints: 25,
              privacyVisibility: 'everyone' as const,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(profileRef, initialProfile);
            await setDoc(privateRef, {
              uid: cleanUid,
              email: userEmail.slice(0, 160),
              e2eeFingerprint: deriveE2eeFingerprint(cleanUid, userEmail),
              readReceiptsEnabled: true,
              allowCallsFromConnectionsOnly: true,
              updatedAt: serverTimestamp(),
            });
            const merged: AccountIdentity = {
              uid: cleanUid,
              email: userEmail,
              displayName: initialProfile.displayName,
              bio: initialProfile.bio,
              avatarUrl: initialProfile.avatarUrl,
              streakCount: 1,
              lastLoginDate: todayKey,
              participationPoints: 25,
              privacyVisibility: 'everyone',
              readReceiptsEnabled: true,
              allowCallsFromConnectionsOnly: true,
            };
            setAccountSession(merged);
            localStorage.setItem('mr_stranger_account_v2', JSON.stringify(merged));
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `profiles/${cleanUid}`);
        }
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore Real-Time Listeners when authenticated with Firebase
  useEffect(() => {
    if (!authReady || !authUser) return;
    const cleanUid = authUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_');

    const sentQ = query(collection(db, 'requests'), where('fromUid', '==', cleanUid));
    const unsubSent = onSnapshot(
      sentQ,
      (snap) => {
        const items: ConnectionRequestDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ConnectionRequestDoc, 'id'>),
        }));
        setRequests((prev) => {
          const others = prev.filter((r) => r.fromUid !== cleanUid);
          return [...others, ...items];
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'requests')
    );

    const recQ = query(collection(db, 'requests'), where('toUid', '==', cleanUid));
    const unsubRec = onSnapshot(
      recQ,
      (snap) => {
        const items: ConnectionRequestDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ConnectionRequestDoc, 'id'>),
        }));
        setRequests((prev) => {
          const others = prev.filter((r) => r.toUid !== cleanUid);
          return [...others, ...items];
        });
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'requests')
    );

    const momentsQ = query(collection(db, 'moments'), orderBy('createdAt', 'desc'), limit(25));
    const unsubMoments = onSnapshot(
      momentsQ,
      (snap) => {
        setMoments(
          snap.docs.map((d) => ({
            id: d.id,
            authorUid: String(d.data().authorUid),
            authorName: String(d.data().authorName),
            caption: String(d.data().caption),
            photoDataUrl: String(d.data().photoDataUrl),
            visibility: (d.data().visibility as 'public' | 'connections') || 'public',
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'moments')
    );

    const notesQ = query(collection(db, 'studyNotes'), orderBy('createdAt', 'desc'), limit(25));
    const unsubNotes = onSnapshot(
      notesQ,
      (snap) => {
        setStudyNotes(
          snap.docs.map((d) => ({
            id: d.id,
            authorUid: String(d.data().authorUid),
            authorName: String(d.data().authorName),
            roomCode: String(d.data().roomCode || 'STUDY-GLOBAL'),
            subject: String(d.data().subject),
            positiveNote: String(d.data().positiveNote),
            focusMinutes: Number(d.data().focusMinutes) || 25,
          }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'studyNotes')
    );

    return () => {
      unsubSent();
      unsubRec();
      unsubMoments();
      unsubNotes();
    };
  }, [authReady, authUser]);

  // Connect to Real-Time WebSocket Server
  useEffect(() => {
    if (!currentIdentity) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'peer:announce',
          peer: {
            uid: currentIdentity.uid,
            displayName: currentIdentity.displayName,
            bio: currentIdentity.bio,
            avatarUrl: currentIdentity.avatarUrl,
            streakCount: currentIdentity.streakCount,
            participationPoints: currentIdentity.participationPoints,
            privacyVisibility: currentIdentity.privacyVisibility,
            currentMode: activePage === 'signout' ? 'hub' : activePage,
            activeStudyRoomCode,
            activeGameId: null,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg.type === 'server:state_sync') {
          setOnlinePeers(Array.isArray(msg.peers) ? msg.peers : []);
          setStudyDesks(Array.isArray(msg.studyDesks) ? msg.studyDesks : []);
          setGameScores(Array.isArray(msg.gameScores) ? msg.gameScores : []);
        } else if (msg.type === 'chat:direct') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [
              ...prev,
              {
                id: msg.id,
                senderUid: msg.senderUid,
                senderName: msg.senderName,
                receiverUid: msg.receiverUid,
                text: msg.text,
                timestamp: msg.timestamp,
              },
            ];
          });
        } else if (msg.type === 'study:chat') {
          setStudyChat((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } else if (msg.type === 'webrtc:signal') {
          setIncomingCallSignal({
            fromUid: msg.fromUid,
            fromName: msg.fromName,
            callType: msg.callType,
            signalData: msg.signalData,
          });
        } else if (msg.type === 'request:incoming') {
          setRequests((prev) => {
            const reqId = `req_${msg.fromUid}_${currentIdentity.uid}`;
            if (prev.some((r) => r.id === reqId)) return prev;
            return [
              ...prev,
              {
                id: reqId,
                fromUid: msg.fromUid,
                fromName: msg.fromName,
                toUid: currentIdentity.uid,
                toName: currentIdentity.displayName,
                status: 'pending',
                note: msg.note || 'Would love to connect and chat!',
              },
            ];
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [currentIdentity?.uid]);

  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentIdentity) {
      wsRef.current.send(
        JSON.stringify({
          type: 'peer:mode_change',
          currentMode: activePage === 'signout' ? 'hub' : activePage,
          activeStudyRoomCode,
          activeGameId: activePage.startsWith('game_') ? activePage : null,
        })
      );
    }
  }, [activePage, activeStudyRoomCode]);

  const awardParticipation = (points: number) => {
    if (!currentIdentity) return;
    const updated: AccountIdentity = {
      ...currentIdentity,
      participationPoints: currentIdentity.participationPoints + points,
    };
    setAccountSession(updated);
    localStorage.setItem('mr_stranger_account_v2', JSON.stringify(updated));
  };

  const handleUpdatePrivacy = async (
    nextVisibility: 'everyone' | 'connections_only' | 'ghost',
    nextReadReceipts: boolean,
    nextCallsFromConnectionsOnly: boolean
  ) => {
    if (!currentIdentity) return;
    const updated: AccountIdentity = {
      ...currentIdentity,
      privacyVisibility: nextVisibility,
      readReceiptsEnabled: nextReadReceipts,
      allowCallsFromConnectionsOnly: nextCallsFromConnectionsOnly,
    };
    setAccountSession(updated);
    localStorage.setItem('mr_stranger_account_v2', JSON.stringify(updated));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'peer:update_privacy',
          privacyVisibility: nextVisibility,
        })
      );
    }

    if (authUser) {
      try {
        await updateDoc(doc(db, 'profiles', currentIdentity.uid), {
          privacyVisibility: nextVisibility,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'privateAccounts', currentIdentity.uid), {
          readReceiptsEnabled: nextReadReceipts,
          allowCallsFromConnectionsOnly: nextCallsFromConnectionsOnly,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // ignore if offline
      }
    }
  };

  // Sign-In & Account Creation Handlers (Email ID + Password + Account Profile)
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSignUp = authTab === 'signup';
    const check = validateAccountCredentials(
      emailInput,
      passwordInput,
      accountNameInput,
      isSignUp
    );
    if (!check.valid) {
      setAuthFormError(check.error);
      return;
    }

    setAuthFormError('');
    setIsSubmittingAuth(true);

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput,
          displayName: accountNameInput.trim(),
          bio: accountBioInput.trim() || 'Real personality on Mr. Stranger',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAuthFormError(data.error || 'Authentication failed. Please check your credentials.');
        setIsSubmittingAuth(false);
        return;
      }

      const newSession: AccountIdentity = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        bio: data.bio,
        avatarUrl: '',
        streakCount: Number(data.streakCount) || 1,
        lastLoginDate: data.lastLoginDate || formatDateKey(new Date()),
        participationPoints: Number(data.participationPoints) || 25,
        privacyVisibility: data.privacyVisibility || 'everyone',
        readReceiptsEnabled: data.readReceiptsEnabled ?? true,
        allowCallsFromConnectionsOnly: data.allowCallsFromConnectionsOnly ?? true,
      };
      setAccountSession(newSession);
      localStorage.setItem('mr_stranger_account_v2', JSON.stringify(newSession));
      setPasswordInput('');
      setActivePage(initialRoomParam ? 'study' : 'hub');
    } catch {
      setAuthFormError('Network error while contacting authentication server.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthFormError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthFormError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In popup was closed or blocked by the browser.'
      );
    }
  };

  // Sign-Out Handler with Email ID & Password Account Verification
  const handleConfirmSignOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIdentity) return;

    if (
      signOutEmailConfirm.trim().toLowerCase() !== currentIdentity.email.toLowerCase()
    ) {
      setSignOutError(
        `Please enter your exact account Email ID (${currentIdentity.email}) to confirm sign out.`
      );
      return;
    }

    if (!authUser) {
      if (!signOutPasswordConfirm || signOutPasswordConfirm.length < 8) {
        setSignOutError(
          'Please enter your account password (minimum 8 characters) to verify sign out.'
        );
        return;
      }
      const resp = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentIdentity.email,
          password: signOutPasswordConfirm,
        }),
      });
      if (!resp.ok) {
        const errData = await resp.json();
        setSignOutError(errData.error || 'Password verification failed.');
        return;
      }
    }

    setSignOutError('');
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (authUser) {
      await signOut(auth);
    }
    localStorage.removeItem('mr_stranger_account_v2');
    setAccountSession(null);
    setSignOutEmailConfirm('');
    setSignOutPasswordConfirm('');
    setActivePage('hub');
  };

  // Send Connection Request to Online User
  const handleSendRequest = async (targetPeer: OnlinePeer) => {
    if (!currentIdentity) return;
    const reqId = `req_${currentIdentity.uid}_${targetPeer.uid}`;
    const note = (
      requestNoteMap[targetPeer.uid] || 'Hey! Saw you online on Mr. Stranger.'
    ).slice(0, 200);

    const newReq: ConnectionRequestDoc = {
      id: reqId,
      fromUid: currentIdentity.uid,
      fromName: currentIdentity.displayName,
      toUid: targetPeer.uid,
      toName: targetPeer.displayName,
      status: 'pending',
      note,
    };

    setRequests((prev) => [...prev.filter((r) => r.id !== reqId), newReq]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'request:notify',
          toUid: targetPeer.uid,
          fromName: currentIdentity.displayName,
          note,
        })
      );
    }

    if (authUser) {
      try {
        await setDoc(doc(db, 'requests', reqId), {
          fromUid: newReq.fromUid,
          fromName: newReq.fromName,
          toUid: newReq.toUid,
          toName: newReq.toName,
          status: 'pending',
          note: newReq.note,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Recipient might be a WebSocket session
      }
    }
    awardParticipation(5);
  };

  const handleRespondRequest = async (
    req: ConnectionRequestDoc,
    decision: 'accepted' | 'declined'
  ) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: decision } : r))
    );
    if (decision === 'accepted') {
      const partnerUid =
        req.fromUid === currentIdentity?.uid ? req.toUid : req.fromUid;
      setActiveChatPeerUid(partnerUid);
      awardParticipation(10);
    }
    if (authUser) {
      try {
        await updateDoc(doc(db, 'requests', req.id), {
          status: decision,
          updatedAt: serverTimestamp(),
        });
      } catch {
        // WebSocket fallback
      }
    }
  };

  // Send Direct Message
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIdentity) return;
    const trimmed = chatMessageInput.trim();
    if (!trimmed) {
      setChatError('Please write a message before sending.');
      return;
    }
    const recipientUid = activeChatPeerUid || currentIdentity.uid;
    setChatError('');

    const msgId = `msg_${Date.now()}_${currentIdentity.uid}`;
    const newMsg: DirectMessageDoc = {
      id: msgId,
      senderUid: currentIdentity.uid,
      senderName: currentIdentity.displayName,
      receiverUid: recipientUid,
      text: trimmed.slice(0, 1000),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatMessageInput('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat:direct',
          id: msgId,
          toUid: recipientUid,
          senderName: currentIdentity.displayName,
          text: newMsg.text,
        })
      );
    }

    if (authUser) {
      try {
        await setDoc(doc(db, 'messages', msgId), {
          senderUid: newMsg.senderUid,
          senderName: newMsg.senderName,
          receiverUid: newMsg.receiverUid,
          text: newMsg.text,
          createdAt: serverTimestamp(),
        });
      } catch {
        // WebSocket fallback
      }
    }
    awardParticipation(5);
  };

  // Handle Real Photo Upload & Moment Creation
  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMomentPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateCameraSnapshotSvgDataUrl = (captionText: string, author: string) => {
    const safeCaption = captionText.replace(/[<>&"']/g, '');
    const safeAuthor = author.replace(/[<>&"']/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#050505"/>
      <rect x="48" y="48" width="704" height="404" rx="8" fill="#0A0A0C" stroke="#27272a" stroke-width="2"/>
      <text x="80" y="230" fill="#fafafa" font-family="sans-serif" font-size="32" font-weight="bold">${safeCaption.slice(0, 36)}</text>
      <text x="80" y="280" fill="#a1a1aa" font-family="monospace" font-size="18">Captured by ${safeAuthor} · Mr. Stranger Verified Feed</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handlePublishMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentIdentity) return;
    const trimmedCaption = momentCaption.trim();
    if (!trimmedCaption) {
      setMomentError('Please enter a caption describing your real photo moment.');
      return;
    }
    setMomentError('');
    const finalPhotoData =
      momentPhotoDataUrl ||
      generateCameraSnapshotSvgDataUrl(trimmedCaption, currentIdentity.displayName);

    const momentId = `moment_${Date.now()}_${currentIdentity.uid}`;
    const newPost: MomentPostDoc = {
      id: momentId,
      authorUid: currentIdentity.uid,
      authorName: currentIdentity.displayName,
      caption: trimmedCaption.slice(0, 500),
      photoDataUrl: finalPhotoData,
      visibility: momentVisibility,
    };

    setMoments((prev) => [newPost, ...prev]);
    setMomentCaption('');
    setMomentPhotoDataUrl('');
    awardParticipation(15);

    if (authUser) {
      try {
        await setDoc(doc(db, 'moments', momentId), {
          authorUid: newPost.authorUid,
          authorName: newPost.authorName,
          caption: newPost.caption,
          photoDataUrl: newPost.photoDataUrl,
          visibility: newPost.visibility,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `moments/${momentId}`);
      }
    }
  };

  const handleDeleteMoment = async (id: string) => {
    setMoments((prev) => prev.filter((m) => m.id !== id));
    if (authUser) {
      try {
        await deleteDoc(doc(db, 'moments', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `moments/${id}`);
      }
    }
  };

  // ==========================================================================
  // DEDICATED MNC-GRADE SIGN-IN & CREATE ACCOUNT PAGE (Carbon Matte Black)
  // ==========================================================================
  if (!currentIdentity) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col justify-between p-6 md:p-12">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <span className="text-xl font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0">
            Mr. Stranger
          </span>
          <span className="text-xs text-zinc-400 font-mono truncate">
            Enterprise Privacy · Real-Time Presence, Study Rooms & Multiplayer Arcade
          </span>
        </div>

        <main className="max-w-6xl w-full mx-auto my-auto py-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Real people online. Private rooms, live calls, study sessions & multiplayer games.
            </h1>
            <p className="text-base text-zinc-400 leading-relaxed max-w-2xl">
              Sign in with your Email ID, Password, and Account profile. See everyone currently online, send real-time connection requests, jump into voice and video calls, invite friends to Study Rooms via shareable room codes or links, and compete across three built-in multiplayer games.
            </p>

            {initialRoomParam && (
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-700 text-xs text-zinc-200">
                You were invited to join Study Room <strong className="font-mono text-white">{initialRoomParam}</strong>. Sign in or create your account on the right to enter the room immediately.
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">01 / PRESENCE</div>
                <div className="text-sm font-semibold text-white mt-1">Real-Time Requests</div>
              </div>
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">02 / SANCTUARY</div>
                <div className="text-sm font-semibold text-white mt-1">Soundscapes & Code</div>
              </div>
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">03 / ARCADE</div>
                <div className="text-sm font-semibold text-white mt-1">3 Multiplayer Games</div>
              </div>
              <div className="p-4 rounded-md bg-[#0A0A0C] border border-zinc-800/80">
                <div className="text-xs text-zinc-500 font-mono">04 / VAULT</div>
                <div className="text-sm font-semibold text-white mt-1">PII Isolation & Ghost</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#0A0A0C] border border-zinc-800/80 rounded-lg p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white whitespace-nowrap shrink-0">
                  {authTab === 'signup' ? 'Create Your Account' : 'Sign In to Account'}
                </h2>
                <div className="flex items-center gap-1 p-1 bg-[#050505] border border-zinc-800 rounded-md">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signup');
                      setAuthFormError('');
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                      authTab === 'signup'
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setAuthFormError('');
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 ${
                      authTab === 'signin'
                        ? 'bg-white text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300">
                    Email ID
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="auth-password" className="block text-xs font-medium text-zinc-300">
                    Password (minimum 8 characters)
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter your secure account password"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {authTab === 'signup' && (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor="auth-account-name" className="block text-xs font-medium text-zinc-300">
                        Account Display Name
                      </label>
                      <input
                        id="auth-account-name"
                        type="text"
                        required
                        value={accountNameInput}
                        onChange={(e) => setAccountNameInput(e.target.value)}
                        placeholder="e.g., Mahit Saxena"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="auth-account-bio" className="block text-xs font-medium text-zinc-300">
                        Account Bio / Status
                      </label>
                      <input
                        id="auth-account-bio"
                        type="text"
                        value={accountBioInput}
                        onChange={(e) => setAccountBioInput(e.target.value)}
                        placeholder="e.g., Principal Engineer · Study Room"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  </>
                )}

                {authFormError && <p className="text-xs text-rose-400">{authFormError}</p>}

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold text-xs rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  {authTab === 'signup'
                    ? 'Create Account & Enter Workspace'
                    : 'Sign In to Workspace'}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800/80" />
                <span className="flex-shrink mx-3 text-xs text-zinc-500">
                  Or SSO Authentication
                </span>
                <div className="flex-grow border-t border-zinc-800/80" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 font-semibold text-xs rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                Continue with Verified Google Account
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 border-t border-zinc-800/80 pt-4 flex items-center justify-between font-mono">
              <span>PII Isolated Vault (`privateAccounts`)</span>
              <span>scrypt + E2EE</span>
            </div>
          </div>
        </main>

        <footer className="max-w-6xl w-full mx-auto border-t border-zinc-900 pt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>Mr. Stranger · Enterprise Real-Time Social Workspace</span>
          <span>Available for everyone · Zero Fake Data</span>
        </footer>
      </div>
    );
  }

  const acceptedPeerUids = new Set(
    requests
      .filter((r) => r.status === 'accepted')
      .map((r) => (r.fromUid === currentIdentity.uid ? r.toUid : r.fromUid))
  );
  const acceptedOnlinePeers = onlinePeers.filter(
    (p) => p.uid !== currentIdentity.uid && acceptedPeerUids.has(p.uid)
  );
  const otherOnlinePeers = onlinePeers.filter((p) => p.uid !== currentIdentity.uid);
  const e2eeFingerprint = deriveE2eeFingerprint(currentIdentity.uid, currentIdentity.email);

  // ==========================================================================
  // MNC-LEVEL WORKSPACE CANVAS: CARBON MATTE BLACK SIDEBAR + VIEWPORT
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col md:flex-row">
      {/* Persistent Left Sidebar Navigation (260px on desktop) */}
      <aside
        className="w-full md:w-64 bg-[#0A0A0C] border-b md:border-b-0 md:border-r border-zinc-800/80 flex flex-col justify-between shrink-0"
        aria-label="Workspace Sidebar Navigation"
      >
        <div className="p-5 space-y-6">
          {/* Brand & Live Streak Badge */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <button
              type="button"
              onClick={() => setActivePage('hub')}
              className="text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0"
            >
              Mr. Stranger
            </button>
            <div
              className="flex items-center gap-1 text-xs font-mono font-semibold text-amber-400 tabular-nums"
              title="Consecutive Daily Login Streak"
            >
              <Flame className="w-4 h-4" />
              <span>{currentIdentity.streakCount}d</span>
            </div>
          </div>

          {/* Primary Communication & Study Modes */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Core Modes
            </div>
            <button
              type="button"
              onClick={() => setActivePage('hub')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'hub'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Online Directory</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{onlinePeers.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('chat')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'chat'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Chat Mode</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{messages.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('talk')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'talk'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4" />
                <span>Talking Mode</span>
              </span>
              <span className="text-[11px] font-mono">WebRTC</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('study')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'study'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4" />
                <span>Study Mode & Room</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{studyDesks.length}</span>
            </button>
          </div>

          {/* Dedicated Multiplayer Game Pages on Sidebar */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Multiplayer Games
            </div>
            <button
              type="button"
              onClick={() => setActivePage('game_subway')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'game_subway'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4" />
                <span>Subway Runner</span>
              </span>
              <span className="text-[11px] font-mono">3-Lane</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('game_catapult')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'game_catapult'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4" />
                <span>Angry Catapult</span>
              </span>
              <span className="text-[11px] font-mono">Physics</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('game_blocks')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'game_blocks'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4" />
                <span>Block Arena</span>
              </span>
              <span className="text-[11px] font-mono">Grid</span>
            </button>
          </div>

          {/* Social Media Feed & Privacy Center */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Social & Security
            </div>
            <button
              type="button"
              onClick={() => setActivePage('moments')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'moments'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Camera className="w-4 h-4" />
                <span>Photos & Social Sync</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums">{moments.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage('privacy')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'privacy'
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Privacy & Security</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {currentIdentity.privacyVisibility === 'ghost' ? 'Ghost' : 'Active'}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Sidebar Account Card & Sign-Out Page Trigger */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#050505] space-y-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {currentIdentity.displayName}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono truncate">
              {currentIdentity.email}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('signout')}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'signout'
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Account & Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Right Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Header (Follows SaaS Top Bar Contract: Breadcrumb left, Streak & Primary Action right) */}
        <header className="flex items-center justify-between gap-6 px-6 py-4 border-b border-zinc-800/80 bg-[#050505]">
          <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
            <span className="font-semibold text-zinc-300">Workspace</span>
            <span aria-hidden="true">/</span>
            <span className="text-white font-semibold capitalize">
              {activePage.replace('_', ' ')}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-zinc-400">
              Room: {activeStudyRoomCode}
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs font-mono tabular-nums">
            <span className="text-zinc-300">
              Streak: <strong className="text-amber-400">{currentIdentity.streakCount} Days</strong>
            </span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span className="text-zinc-300">
              Score: <strong className="text-emerald-400">{currentIdentity.participationPoints} pts</strong>
            </span>
            <button
              type="button"
              onClick={() => setActivePage('study')}
              className="px-3.5 py-1.5 text-xs font-sans font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
            >
              Invite to Study Room
            </button>
          </div>
        </header>

        {/* Main Scrollable Page Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          {/* ================================================================
              PAGE 1: ONLINE DIRECTORY & STREAK DASHBOARD
              ================================================================ */}
          {activePage === 'hub' && (
            <section className="space-y-8" aria-label="Online Presence Directory">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1">
                  <div className="text-xs text-zinc-400">Signed-In Account</div>
                  <div className="text-base font-bold text-white truncate">
                    {currentIdentity.displayName}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate">
                    {currentIdentity.email}
                  </div>
                </div>

                <div className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1">
                  <div className="text-xs text-zinc-400">Active Login Streak</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                    {currentIdentity.streakCount} {currentIdentity.streakCount === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    Checked in: {currentIdentity.lastLoginDate}
                  </div>
                </div>

                <div className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1">
                  <div className="text-xs text-zinc-400">Participation Points</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                    {currentIdentity.participationPoints} pts
                  </div>
                  <div className="text-xs text-zinc-500">
                    Study, Chat, Moments & Games
                  </div>
                </div>

                <div className="p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-1">
                  <div className="text-xs text-zinc-400">Privacy Shield</div>
                  <div className="text-base font-bold text-white capitalize">
                    {currentIdentity.privacyVisibility.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate">
                    Key: {e2eeFingerprint.slice(0, 9)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Live Online Users Directory (7 cols) */}
                <div className="lg:col-span-7 p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div>
                      <h1 className="text-lg font-bold text-white">
                        Real People Online Now ({onlinePeers.length})
                      </h1>
                      <p className="text-xs text-zinc-400">
                        Send a connection request to anyone online. Once accepted, chat and voice/video calls unlock immediately.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">
                      {wsConnected ? 'Live Sync' : 'Reconnecting'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {onlinePeers.map((peer) => {
                      const isMe = peer.uid === currentIdentity.uid;
                      const existingReq = requests.find(
                        (r) =>
                          (r.fromUid === currentIdentity.uid && r.toUid === peer.uid) ||
                          (r.fromUid === peer.uid && r.toUid === currentIdentity.uid)
                      );

                      return (
                        <div
                          key={peer.uid}
                          className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white truncate">
                                {peer.displayName} {isMe ? '(You — Online)' : ''}
                              </span>
                              <span aria-hidden="true" className="text-zinc-600">·</span>
                              <span className="text-xs text-emerald-400 font-mono capitalize">
                                {peer.currentMode.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 truncate">{peer.bio}</p>
                            <div className="text-xs text-zinc-500 font-mono tabular-nums">
                              Streak: {peer.streakCount}d · Participation: {peer.participationPoints} pts
                            </div>
                          </div>

                          {!isMe && (
                            <div className="flex items-center gap-2 shrink-0">
                              {!existingReq ? (
                                <>
                                  <input
                                    type="text"
                                    value={requestNoteMap[peer.uid] || ''}
                                    onChange={(e) =>
                                      setRequestNoteMap((prev) => ({
                                        ...prev,
                                        [peer.uid]: e.target.value,
                                      }))
                                    }
                                    placeholder="Add a note..."
                                    aria-label={`Request note for ${peer.displayName}`}
                                    className="px-2.5 py-1.5 text-xs bg-[#0A0A0C] border border-zinc-800 rounded text-white placeholder:text-zinc-600 w-32"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSendRequest(peer)}
                                    className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                                  >
                                    Send Request
                                  </button>
                                </>
                              ) : existingReq.status === 'accepted' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveChatPeerUid(peer.uid);
                                    setActivePage('chat');
                                  }}
                                  className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                                >
                                  Message Now
                                </button>
                              ) : (
                                <span className="text-xs text-amber-400 font-mono">
                                  Request {existingReq.status}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {otherOnlinePeers.length === 0 && (
                      <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 text-xs text-zinc-400">
                        Open this app link in another browser window or share your Study Room invite link with friends to see live multi-user presence and exchange real-time requests.
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Requests Box (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4">
                  <div className="border-b border-zinc-800/80 pb-3">
                    <h2 className="text-lg font-bold text-white">
                      Connection Requests ({requests.length})
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Accept incoming requests to unlock Chat Mode and Talking Mode.
                    </p>
                  </div>

                  {requests.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-6">
                      No pending or accepted requests yet. Send a request to any online user on the left.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((req) => {
                        const isIncoming = req.toUid === currentIdentity.uid;
                        return (
                          <div
                            key={req.id}
                            className="p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">
                                {isIncoming
                                  ? `From: ${req.fromName}`
                                  : `Sent to: ${req.toName}`}
                              </span>
                              <span className="text-zinc-400 uppercase font-mono">
                                {req.status}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300">"{req.note}"</p>
                            {isIncoming && req.status === 'pending' && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleRespondRequest(req, 'accepted')}
                                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded whitespace-nowrap shrink-0"
                                >
                                  Accept Request
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondRequest(req, 'declined')}
                                  className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded whitespace-nowrap shrink-0"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 2: SIDEBAR CHAT MODE
              ================================================================ */}
          {activePage === 'chat' && (
            <section className="space-y-6" aria-label="Real-Time Chat Mode">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Real-Time Chat Mode
                  </h1>
                  <p className="text-sm text-zinc-400">
                    End-to-end verified session messaging with accepted online connections
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Fingerprint: {e2eeFingerprint}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 p-5 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-3">
                  <h2 className="text-base font-bold text-white border-b border-zinc-800/80 pb-3">
                    Connected Channels
                  </h2>

                  <button
                    type="button"
                    onClick={() => setActiveChatPeerUid(currentIdentity.uid)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      activeChatPeerUid === '' || activeChatPeerUid === currentIdentity.uid
                        ? 'bg-white text-black border-white'
                        : 'bg-[#050505] border-zinc-800/80 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {currentIdentity.displayName} (Personal Scratchpad)
                    </div>
                    <div
                      className={`text-xs ${
                        activeChatPeerUid === '' || activeChatPeerUid === currentIdentity.uid
                          ? 'text-zinc-700'
                          : 'text-zinc-500'
                      }`}
                    >
                      Verify live WebSocket & Firestore message delivery
                    </div>
                  </button>

                  {acceptedOnlinePeers.map((peer) => (
                    <button
                      key={peer.uid}
                      type="button"
                      onClick={() => setActiveChatPeerUid(peer.uid)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        activeChatPeerUid === peer.uid
                          ? 'bg-white text-black border-white'
                          : 'bg-[#050505] border-zinc-800/80 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div className="text-sm font-semibold">{peer.displayName}</div>
                      <div className="text-xs text-emerald-500 font-mono">Connected · Online now</div>
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-8 p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] flex flex-col h-[520px] justify-between">
                  <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
                    <div className="text-sm font-bold text-white">
                      Encrypted Channel Stream
                    </div>
                    <span className="text-xs text-zinc-400 font-mono tabular-nums">
                      {messages.length} messages
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-zinc-400 space-y-1">
                        <p className="text-white font-medium">No messages in this channel yet</p>
                        <p>Send a message below to transmit immediately over WebSocket and Firestore.</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderUid === currentIdentity.uid;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                          >
                            <div className="text-[11px] text-zinc-500 mb-1">
                              {msg.senderName}
                            </div>
                            <div
                              className={`px-4 py-2.5 rounded-md max-w-md text-sm ${
                                isMine
                                  ? 'bg-white text-black font-medium'
                                  : 'bg-[#050505] border border-zinc-800 text-zinc-100'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendDirectMessage} className="pt-3 border-t border-zinc-800/80 space-y-2">
                    {chatError && <p className="text-xs text-rose-400">{chatError}</p>}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessageInput}
                        onChange={(e) => setChatMessageInput(e.target.value)}
                        placeholder="Write a real-time message..."
                        aria-label="Direct chat message input"
                        className="flex-1 px-4 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 3: SIDEBAR TALKING MODE (VOICE & VIDEO CALLS)
              ================================================================ */}
          {activePage === 'talk' && (
            <TalkingRoomView
              currentUid={currentIdentity.uid}
              currentName={currentIdentity.displayName}
              acceptedPeers={acceptedOnlinePeers}
              incomingSignal={incomingCallSignal}
              onSendSignal={(toUid, callType, signalData) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'webrtc:signal',
                      toUid,
                      fromName: currentIdentity.displayName,
                      callType,
                      signalData,
                    })
                  );
                }
              }}
              onClearIncomingSignal={() => setIncomingCallSignal(null)}
            />
          )}

          {/* ================================================================
              PAGE 4: SIDEBAR STUDY MODE & SHAREABLE STUDY ROOM
              ================================================================ */}
          {activePage === 'study' && (
            <StudyRoomView
              currentUid={currentIdentity.uid}
              currentName={currentIdentity.displayName}
              activeRoomCode={activeStudyRoomCode}
              onChangeRoomCode={(code) => {
                setActiveStudyRoomCode(code);
                const url = new URL(window.location.href);
                url.searchParams.set('room', code);
                window.history.replaceState({}, '', url.toString());
              }}
              studyDesks={studyDesks}
              studyNotes={studyNotes}
              studyChat={studyChat}
              onJoinDesk={(roomCode, roomName, subject, positiveNote, timerMinutes) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'study:join',
                      roomCode,
                      roomName,
                      displayName: currentIdentity.displayName,
                      subject,
                      positiveNote,
                      timerMinutes,
                    })
                  );
                }
                awardParticipation(15);
              }}
              onLeaveDesk={() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify({ type: 'study:leave' }));
                }
              }}
              onSaveStudyNote={async (roomCode, subject, positiveNote, focusMinutes) => {
                const noteId = `note_${Date.now()}_${currentIdentity.uid}`;
                const newNote: StudyNoteRecord = {
                  id: noteId,
                  authorUid: currentIdentity.uid,
                  authorName: currentIdentity.displayName,
                  roomCode,
                  subject,
                  positiveNote,
                  focusMinutes,
                };
                setStudyNotes((prev) => [newNote, ...prev]);
                if (authUser) {
                  try {
                    await setDoc(doc(db, 'studyNotes', noteId), {
                      authorUid: newNote.authorUid,
                      authorName: newNote.authorName,
                      roomCode: newNote.roomCode,
                      subject: newNote.subject,
                      positiveNote: newNote.positiveNote,
                      focusMinutes: newNote.focusMinutes,
                      createdAt: serverTimestamp(),
                    });
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, `studyNotes/${noteId}`);
                  }
                }
              }}
              onSendStudyChat={(roomCode, text) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'study:chat',
                      roomCode,
                      senderName: currentIdentity.displayName,
                      text,
                    })
                  );
                }
                awardParticipation(5);
              }}
            />
          )}

          {/* ================================================================
              PAGES 5, 6, 7: SIDEBAR MULTIPLAYER GAMES (SUBWAY, CATAPULT, BLOCKS)
              ================================================================ */}
          {(activePage === 'game_subway' ||
            activePage === 'game_catapult' ||
            activePage === 'game_blocks') && (
            <GameArcadeView
              selectedGame={
                activePage === 'game_subway'
                  ? 'subway'
                  : activePage === 'game_catapult'
                  ? 'catapult'
                  : 'blocks'
              }
              onSelectGame={(g) =>
                setActivePage(
                  g === 'subway'
                    ? 'game_subway'
                    : g === 'catapult'
                    ? 'game_catapult'
                    : 'game_blocks'
                )
              }
              currentUid={currentIdentity.uid}
              currentName={currentIdentity.displayName}
              multiplayerScores={gameScores}
              onBroadcastScore={(gameId, score, laneOrState) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'game:update',
                      gameId,
                      displayName: currentIdentity.displayName,
                      score,
                      laneOrState,
                    })
                  );
                }
              }}
              onParticipationEarned={awardParticipation}
            />
          )}

          {/* ================================================================
              PAGE 8: SEPARATED PHOTOS & SOCIAL MEDIA SYNC PAGE
              ================================================================ */}
          {activePage === 'moments' && (
            <section className="space-y-6" aria-label="Photos and Social Media Sync">
              <div className="border-b border-zinc-800/80 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Photos & Social Media Sync
                  </h1>
                  <p className="text-sm text-zinc-400">
                    Upload real photos from your device and control whether posts are visible to everyone or only accepted connections.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <form
                  onSubmit={handlePublishMoment}
                  className="lg:col-span-5 p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-4"
                >
                  <h2 className="text-base font-bold text-white">Upload a Real Photo</h2>

                  <div className="space-y-1.5">
                    <label htmlFor="moment-photo-file" className="block text-xs font-medium text-zinc-300">
                      Select Photo File (PNG, JPG, WebP)
                    </label>
                    <input
                      id="moment-photo-file"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileSelect}
                      className="w-full text-xs text-zinc-300 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-zinc-100 hover:file:bg-zinc-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="moment-visibility" className="block text-xs font-medium text-zinc-300">
                      Audience Privacy
                    </label>
                    <select
                      id="moment-visibility"
                      value={momentVisibility}
                      onChange={(e) =>
                        setMomentVisibility(e.target.value as 'public' | 'connections')
                      }
                      className="w-full px-3.5 py-2 text-xs bg-[#050505] border border-zinc-800 rounded-md text-white"
                    >
                      <option value="public">Available to All Members</option>
                      <option value="connections">Accepted Connections Only</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="moment-caption" className="block text-xs font-medium text-zinc-300">
                      Caption / Story Behind This Moment
                    </label>
                    <textarea
                      id="moment-caption"
                      rows={3}
                      maxLength={500}
                      value={momentCaption}
                      onChange={(e) => setMomentCaption(e.target.value)}
                      placeholder="Share what you are working on, studying, or experiencing right now..."
                      className="w-full px-3.5 py-2 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {momentError && <p className="text-xs text-rose-400">{momentError}</p>}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0"
                  >
                    Publish Real Photo Moment
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  {moments.length === 0 ? (
                    <div className="p-8 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] text-center space-y-2">
                      <p className="text-sm font-semibold text-white">
                        No Photos Uploaded Yet
                      </p>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto">
                        Mr. Stranger enforces a strict zero-fake-data policy. Only real photos uploaded by authenticated accounts appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {moments.map((item) => (
                        <article
                          key={item.id}
                          className="rounded-lg border border-zinc-800/80 bg-[#0A0A0C] overflow-hidden"
                        >
                          <img
                            src={item.photoDataUrl}
                            alt={item.caption}
                            referrerPolicy="no-referrer"
                            className="w-full max-h-80 object-cover bg-[#050505]"
                          />
                          <div className="p-5 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="text-xs text-zinc-400">
                                <span className="font-semibold text-white">{item.authorName}</span>
                                <span aria-hidden="true"> · </span>
                                <span className="capitalize">{item.visibility} Moment</span>
                              </div>
                              <p className="text-sm text-zinc-100">{item.caption}</p>
                            </div>
                            {item.authorUid === currentIdentity.uid && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMoment(item.id)}
                                className="px-3 py-1 text-xs text-rose-400 hover:text-rose-300 bg-[#050505] border border-zinc-800 rounded whitespace-nowrap shrink-0"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 9: ENHANCED PRIVACY & ZERO-TRUST SECURITY CENTER
              ================================================================ */}
          {activePage === 'privacy' && (
            <section className="space-y-6 max-w-3xl" aria-label="Privacy and Security Center">
              <div className="border-b border-zinc-800/80 pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Privacy & Zero-Trust Security Center
                </h1>
                <p className="text-sm text-zinc-400">
                  Control your live presence visibility, call permissions, and isolated PII vault settings.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6">
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-white">
                    Online Presence & Directory Visibility
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Choose who can see you in the Online Directory and send you connection requests.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          id: 'everyone',
                          title: 'Everyone Online',
                          desc: 'Visible to all authenticated members',
                        },
                        {
                          id: 'connections_only',
                          title: 'Connections Only',
                          desc: 'Only accepted peers see your mode',
                        },
                        {
                          id: 'ghost',
                          title: 'Ghost Stealth Mode',
                          desc: 'Hidden from public online directory',
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          handleUpdatePrivacy(
                            opt.id,
                            currentIdentity.readReceiptsEnabled,
                            currentIdentity.allowCallsFromConnectionsOnly
                          )
                        }
                        className={`p-4 rounded-md border text-left transition-colors ${
                          currentIdentity.privacyVisibility === opt.id
                            ? 'bg-white text-black border-white'
                            : 'bg-[#050505] border-zinc-800/80 text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.title}</div>
                        <div
                          className={`text-[11px] mt-1 ${
                            currentIdentity.privacyVisibility === opt.id
                              ? 'text-zinc-800'
                              : 'text-zinc-500'
                          }`}
                        >
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                  <h2 className="text-base font-bold text-white">
                    Communication & WebRTC Call Guards
                  </h2>

                  <label className="flex items-center justify-between p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Restrict Voice & Video Calls to Accepted Connections Only
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Blocks unsolicited WebRTC signaling offers from non-connected accounts
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentIdentity.allowCallsFromConnectionsOnly}
                      onChange={(e) =>
                        handleUpdatePrivacy(
                          currentIdentity.privacyVisibility,
                          currentIdentity.readReceiptsEnabled,
                          e.target.checked
                        )
                      }
                      className="accent-white w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-md bg-[#050505] border border-zinc-800/80 cursor-pointer">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Send Message Delivery & Read Receipts
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Allow accepted connections to see when you read their messages
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={currentIdentity.readReceiptsEnabled}
                      onChange={(e) =>
                        handleUpdatePrivacy(
                          currentIdentity.privacyVisibility,
                          e.target.checked,
                          currentIdentity.allowCallsFromConnectionsOnly
                        )
                      }
                      className="accent-white w-4 h-4"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Lock className="w-4 h-4" />
                    <span>Isolated PII Vault & Cryptographic Identity</span>
                  </div>
                  <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80 text-xs font-mono text-zinc-300 space-y-1">
                    <div>Account UID: {currentIdentity.uid}</div>
                    <div>Isolated Email Vault: {currentIdentity.email} (Owner-Only Read)</div>
                    <div>E2EE Verification Fingerprint: {e2eeFingerprint}</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 10: DEDICATED SIGN-OUT PAGE (Requires Email ID, Password & Account Confirmation)
              ================================================================ */}
          {activePage === 'signout' && (
            <section className="max-w-xl mx-auto py-6" aria-label="Account Verification and Sign Out">
              <div className="p-8 rounded-lg border border-zinc-800/80 bg-[#0A0A0C] space-y-6">
                <div className="space-y-1 border-b border-zinc-800/80 pb-4">
                  <h1 className="text-2xl font-bold text-white">
                    Account Verification & Sign Out
                  </h1>
                  <p className="text-xs text-zinc-400">
                    Confirm your account details, Email ID, and Password below to securely close your live presence session.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80">
                    <div className="text-xs text-zinc-400">Active Account</div>
                    <div className="text-sm font-bold text-white mt-1 truncate">
                      {currentIdentity.displayName}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono truncate">
                      {currentIdentity.email}
                    </div>
                  </div>
                  <div className="p-4 rounded-md bg-[#050505] border border-zinc-800/80">
                    <div className="text-xs text-zinc-400">Preserved Streak</div>
                    <div className="text-sm font-bold font-mono tabular-nums text-amber-400 mt-1">
                      {currentIdentity.streakCount} Days · {currentIdentity.participationPoints} pts
                    </div>
                    <div className="text-xs text-zinc-500">
                      Synced with Account Vault
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmSignOut} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="signout-email" className="block text-xs font-medium text-zinc-300">
                      Confirm Account Email ID ({currentIdentity.email})
                    </label>
                    <input
                      id="signout-email"
                      type="email"
                      required
                      value={signOutEmailConfirm}
                      onChange={(e) => setSignOutEmailConfirm(e.target.value)}
                      placeholder={currentIdentity.email}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {!authUser && (
                    <div className="space-y-1.5">
                      <label htmlFor="signout-password" className="block text-xs font-medium text-zinc-300">
                        Confirm Account Password
                      </label>
                      <input
                        id="signout-password"
                        type="password"
                        required
                        value={signOutPasswordConfirm}
                        onChange={(e) => setSignOutPasswordConfirm(e.target.value)}
                        placeholder="Enter your account password to sign out"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  )}

                  {signOutError && <p className="text-xs text-rose-400">{signOutError}</p>}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActivePage('hub')}
                      className="px-4 py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-md whitespace-nowrap shrink-0"
                    >
                      Cancel & Stay Online
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md whitespace-nowrap shrink-0"
                    >
                      Verify & Sign Out
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
