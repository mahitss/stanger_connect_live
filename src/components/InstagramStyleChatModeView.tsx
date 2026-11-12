import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  UserCheck,
  UserPlus,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Lock,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
} from 'lucide-react';
import {
  ConnectionRequestDoc,
  DirectMessageDoc,
  UiSoundEffectPreferences,
  evaluateInstagramStyleChatModeState,
  formatInstagramStyleHandle,
  deriveAvatarInitials,
  formatTimerMMSS,
} from '../utils/rules';
import type { OnlinePeer } from '../../server';

export interface IncomingWebRtcCallSignal {
  fromUid: string;
  fromName: string;
  callType: 'audio' | 'video';
  signalData: Record<string, unknown>;
}

export interface InstagramStyleChatModeViewProps {
  currentUid: string;
  currentDisplayName: string;
  e2eeFingerprint: string;
  uiSoundPrefs: UiSoundEffectPreferences;
  onToggleUiSoundEffects: () => void;
  requests: ConnectionRequestDoc[];
  otherOnlinePeers: OnlinePeer[];
  messages: DirectMessageDoc[];
  activeChatPeerUid: string;
  onSelectChatProfileUid: (peerUid: string) => void;
  onSendRequest: (peer: OnlinePeer) => void;
  onRespondRequest: (
    req: ConnectionRequestDoc,
    decision: 'accepted' | 'declined'
  ) => void;
  chatMessageInput: string;
  onChangeChatMessageInput: (val: string) => void;
  chatError: string;
  onClearChatError: () => void;
  onSendDirectMessage: (e: React.FormEvent) => void;
  onNavigateToHub: () => void;
  incomingSignal?: IncomingWebRtcCallSignal | null;
  onSendSignal?: (
    toUid: string,
    callType: 'audio' | 'video',
    signalData: Record<string, unknown>
  ) => void;
  onClearIncomingSignal?: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export const InstagramStyleChatModeView: React.FC<
  InstagramStyleChatModeViewProps
> = ({
  currentUid,
  currentDisplayName,
  e2eeFingerprint,
  uiSoundPrefs,
  onToggleUiSoundEffects,
  requests,
  otherOnlinePeers,
  messages,
  activeChatPeerUid,
  onSelectChatProfileUid,
  onSendRequest,
  onRespondRequest,
  chatMessageInput,
  onChangeChatMessageInput,
  chatError,
  onClearChatError,
  onSendDirectMessage,
  onNavigateToHub,
  incomingSignal = null,
  onSendSignal,
  onClearIncomingSignal,
}) => {
  const [inboxTab, setInboxTab] = useState<'profiles' | 'requests'>('profiles');
  const [recentAcceptanceNotice, setRecentAcceptanceNotice] =
    useState<string>('');

  // In-Chat Voice & Video Call State (Instagram Direct Call inside Chat)
  const [callStatus, setCallStatus] = useState<
    'idle' | 'ringing' | 'calling' | 'connected'
  >('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callPartnerUid, setCallPartnerUid] = useState<string>('');
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [camOff, setCamOff] = useState<boolean>(false);
  const [mediaNotice, setMediaNotice] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const evaluation = evaluateInstagramStyleChatModeState({
    currentUid,
    selectedProfileUid: activeChatPeerUid,
    requests,
    onlinePeers: otherOnlinePeers,
    messages,
  });

  const {
    incomingPendingRequests,
    outgoingPendingRequests,
    acceptedProfiles,
    isChatBoxOpen,
    activeOpenChatProfile,
    activeConversationMessages,
  } = evaluation;

  const acceptedUidSet = new Set(acceptedProfiles.map((p) => p.uid));

  const cleanupCall = () => {
    if (peerConnRef.current) {
      try {
        peerConnRef.current.close();
      } catch {
        // ignore
      }
      peerConnRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallStatus('idle');
    setCallPartnerUid('');
    setCallSeconds(0);
    setMicMuted(false);
    setCamOff(false);
    setMediaNotice('');
  };

  useEffect(() => {
    return () => cleanupCall();
  }, []);

  // Tick call duration timer while calling or connected
  useEffect(() => {
    if (callStatus !== 'calling' && callStatus !== 'connected') {
      setCallSeconds(0);
      return;
    }
    const id = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [callStatus]);

  const acquireLocalMedia = async (
    mode: 'audio' | 'video'
  ): Promise<MediaStream | null> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setMediaNotice(
        mode === 'video'
          ? 'Video Call active (Signaling connected · Camera standby)'
          : 'Voice Call active (Signaling connected · Mic standby)'
      );
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current && mode === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      setMediaNotice(
        mode === 'video'
          ? 'Camera & Microphone live for encrypted video call'
          : 'Microphone live for encrypted voice call'
      );
      return stream;
    } catch {
      setMediaNotice(
        mode === 'video'
          ? 'Encrypted Video Call active (Camera/Mic in standby on this device)'
          : 'Encrypted Voice Call active (Microphone in standby on this device)'
      );
      return null;
    }
  };

  const createPeerConnection = (targetUid: string, mode: 'audio' | 'video') => {
    if (typeof RTCPeerConnection === 'undefined') return null;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.onicecandidate = (event) => {
      if (event.candidate && onSendSignal) {
        onSendSignal(targetUid, mode, {
          type: 'candidate',
          candidate: event.candidate,
        });
      }
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    peerConnRef.current = pc;
    return pc;
  };

  const handleStartInChatCall = async (
    targetUid: string,
    mode: 'audio' | 'video'
  ) => {
    if (!targetUid || !acceptedUidSet.has(targetUid)) return;
    setCallPartnerUid(targetUid);
    setCallType(mode);
    setCallStatus('calling');
    setCamOff(mode === 'audio');

    const stream = await acquireLocalMedia(mode);
    const pc = createPeerConnection(targetUid, mode);
    if (pc) {
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (onSendSignal) {
          onSendSignal(targetUid, mode, { type: 'offer', sdp: offer });
        }
      } catch {
        // Ignore SDP error in offline/local preview
      }
    }
  };

  const handleAcceptIncomingCall = async () => {
    if (!incomingSignal) return;
    const { fromUid, callType: incomingMode, signalData } = incomingSignal;
    onSelectChatProfileUid(fromUid);
    setCallPartnerUid(fromUid);
    setCallType(incomingMode);
    setCallStatus('connected');
    setCamOff(incomingMode === 'audio');

    const stream = await acquireLocalMedia(incomingMode);
    const pc = createPeerConnection(fromUid, incomingMode);
    if (pc && signalData.sdp) {
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }
      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(signalData.sdp as RTCSessionDescriptionInit)
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (onSendSignal) {
          onSendSignal(fromUid, incomingMode, { type: 'answer', sdp: answer });
        }
      } catch {
        // Ignore SDP error
      }
    }
    if (onClearIncomingSignal) {
      onClearIncomingSignal();
    }
  };

  useEffect(() => {
    if (!incomingSignal) return;
    const { signalData } = incomingSignal;

    const handleSignal = async () => {
      if (signalData.type === 'offer') {
        setCallStatus('ringing');
      } else if (signalData.type === 'answer' && peerConnRef.current) {
        await peerConnRef.current.setRemoteDescription(
          new RTCSessionDescription(signalData.sdp as RTCSessionDescriptionInit)
        );
        setCallStatus('connected');
        onClearIncomingSignal?.();
      } else if (signalData.type === 'candidate' && peerConnRef.current) {
        await peerConnRef.current.addIceCandidate(
          new RTCIceCandidate(signalData.candidate as RTCIceCandidateInit)
        );
        onClearIncomingSignal?.();
      } else if (signalData.type === 'hangup') {
        cleanupCall();
        onClearIncomingSignal?.();
      }
    };

    handleSignal().catch(() => {
      // ignore WebRTC signal error
    });
  }, [incomingSignal]);

  const handleToggleMuteMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setMicMuted((prev) => !prev);
  };

  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !t.enabled;
      });
    }
    setCamOff((prev) => !prev);
  };

  const handleHangupCall = () => {
    if (callPartnerUid && onSendSignal) {
      onSendSignal(callPartnerUid, callType, { type: 'hangup' });
    }
    cleanupCall();
  };

  const handleAcceptIncomingRequest = (reqItem: {
    requestId: string;
    uid: string;
    displayName: string;
  }) => {
    const rawReq = requests.find((r) => r.id === reqItem.requestId);
    if (!rawReq) return;
    onRespondRequest(rawReq, 'accepted');
    onSelectChatProfileUid('');
    setInboxTab('profiles');
    setRecentAcceptanceNotice(
      `You accepted ${reqItem.displayName}'s request. Click on their profile card to open your chat, voice call, or video call.`
    );
  };

  const handleDeclineIncomingRequest = (reqItem: {
    requestId: string;
    uid: string;
  }) => {
    const rawReq = requests.find((r) => r.id === reqItem.requestId);
    if (!rawReq) return;
    onRespondRequest(rawReq, 'declined');
    if (activeChatPeerUid === reqItem.uid) {
      onSelectChatProfileUid('');
    }
  };

  const handleOpenProfileChat = (profileUid: string) => {
    setRecentAcceptanceNotice('');
    onClearChatError();
    onSelectChatProfileUid(profileUid);
  };

  const isCurrentProfileInCall =
    Boolean(activeOpenChatProfile) &&
    (callStatus === 'calling' || callStatus === 'connected') &&
    callPartnerUid === activeOpenChatProfile?.uid;

  return (
    <section
      className="space-y-6"
      aria-label="Real-Time Chat Mode"
      data-testid="instagram-style-chat-mode"
      data-chat-box-open={isChatBoxOpen ? 'true' : 'false'}
      data-in-chat-call-status={callStatus}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Real-Time Chat &amp; Calling
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Request · Accept · Click Profile for Chat, Voice &amp; Video Call
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Accept a connection request first, then click on the person&apos;s
            profile to open direct messages, voice calls, or video calls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onToggleUiSoundEffects}
            aria-pressed={uiSoundPrefs.enabled}
            data-testid="chat-ui-sound-toggle"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              uiSoundPrefs.enabled
                ? 'bg-[#0A0A0C] border-zinc-700 text-emerald-400 hover:border-zinc-500'
                : 'bg-[#050505] border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {uiSoundPrefs.enabled ? (
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>
              {uiSoundPrefs.enabled
                ? 'Incoming Message Chime: On'
                : 'Incoming Message Chime: Muted'}
            </span>
          </button>
          <span className="text-xs font-mono text-zinc-400">
            Fingerprint: {e2eeFingerprint}
          </span>
        </div>
      </div>

      {/* Incoming Voice / Video Call Ringing Banner inside Chat Mode */}
      {incomingSignal && callStatus === 'ringing' && (
        <div
          data-testid="chat-incoming-call-banner"
          className="p-4 rounded-xl bg-[#0A0A0C] border border-emerald-500/60 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
              {incomingSignal.callType === 'video' ? (
                <Video className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                Incoming{' '}
                {incomingSignal.callType === 'video' ? 'Video' : 'Voice'} Call
                from {incomingSignal.fromName}
              </div>
              <p className="text-xs text-zinc-400">
                Accept to open their chat and join the encrypted WebRTC{' '}
                {incomingSignal.callType} call.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptIncomingCall}
              data-testid="chat-accept-incoming-call-btn"
              className="px-4 py-2 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md cursor-pointer"
            >
              Accept {incomingSignal.callType === 'video' ? 'Video' : 'Voice'}{' '}
              Call
            </button>
            <button
              type="button"
              onClick={() => {
                onSendSignal?.(
                  incomingSignal.fromUid,
                  incomingSignal.callType,
                  { type: 'hangup' }
                );
                onClearIncomingSignal?.();
                setCallStatus('idle');
              }}
              data-testid="chat-decline-incoming-call-btn"
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-md cursor-pointer"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Notice After Accepting a Request */}
      {recentAcceptanceNotice && (
        <div
          data-testid="chat-request-accepted-banner"
          className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{recentAcceptanceNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRecentAcceptanceNotice('')}
            className="text-emerald-300 hover:text-white font-mono text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 12-Col Layout: Left 5 Cols = Profiles & Requests Inbox, Right 7 Cols = Profile-Gated Chat & Call Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACCEPTED PROFILES & MESSAGE REQUESTS INBOX */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] space-y-5">
          {/* Instagram Direct Style Inbox Tabs */}
          <div
            role="tablist"
            aria-label="Chat Mode Inbox Tabs"
            className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#050507] border border-zinc-800/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={inboxTab === 'profiles'}
              data-testid="chat-inbox-tab-profiles"
              onClick={() => setInboxTab('profiles')}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                inboxTab === 'profiles'
                  ? 'bg-white text-black'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>Accepted Profiles</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                  inboxTab === 'profiles'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {acceptedProfiles.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={inboxTab === 'requests'}
              data-testid="chat-inbox-tab-requests"
              onClick={() => setInboxTab('requests')}
              className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                inboxTab === 'requests'
                  ? 'bg-white text-black'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              <span>Requests</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                  incomingPendingRequests.length > 0
                    ? 'bg-amber-400 text-zinc-950 font-bold'
                    : inboxTab === 'requests'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {incomingPendingRequests.length}
              </span>
            </button>
          </div>

          {/* Incoming Requests Quick Alert Strip when viewing Accepted Profiles */}
          {inboxTab === 'profiles' && incomingPendingRequests.length > 0 && (
            <div
              data-testid="chat-incoming-requests-alert"
              className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-amber-300">
                  {incomingPendingRequests.length} Incoming Chat Request
                  {incomingPendingRequests.length === 1 ? '' : 's'}
                </div>
                <div className="text-[11px] text-zinc-300">
                  Accept their request first to unlock their profile for chat
                  &amp; calling.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInboxTab('requests')}
                data-testid="chat-view-requests-btn"
                className="px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
              >
                View Requests ({incomingPendingRequests.length})
              </button>
            </div>
          )}

          {/* TAB 1: ACCEPTED PROFILES LIST (CLICK PROFILE TO OPEN CHAT & CALLS) */}
          {inboxTab === 'profiles' && (
            <div className="space-y-3" data-testid="chat-accepted-profiles-list">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-0.5">
                <span className="font-semibold text-zinc-200">
                  Your Accepted Profiles ({acceptedProfiles.length})
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  Click profile to chat or call
                </span>
              </div>

              {acceptedProfiles.length === 0 ? (
                <div
                  data-testid="chat-no-accepted-profiles-empty"
                  className="p-5 rounded-lg bg-[#050507] border border-zinc-800/80 space-y-3 text-xs text-zinc-400"
                >
                  <div className="font-bold text-white text-sm">
                    No Accepted Profiles Yet
                  </div>
                  <p className="leading-relaxed">
                    Just like Instagram, direct messages, voice calls, and video
                    calls unlock after someone sends a request, you accept it,
                    and you click on their profile.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {incomingPendingRequests.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setInboxTab('requests')}
                        className="px-3 py-2 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md cursor-pointer"
                      >
                        Review {incomingPendingRequests.length} Pending Request
                        {incomingPendingRequests.length === 1 ? '' : 's'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onNavigateToHub}
                      className="px-3 py-2 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md cursor-pointer"
                    >
                      Find Online Profiles &amp; Send Request
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {acceptedProfiles.map((profile) => {
                    const isSelected =
                      isChatBoxOpen &&
                      activeOpenChatProfile?.uid === profile.uid;
                    return (
                      <button
                        key={profile.uid}
                        type="button"
                        onClick={() => handleOpenProfileChat(profile.uid)}
                        data-testid={`chat-accepted-profile-${profile.uid}`}
                        aria-pressed={isSelected}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/70 ring-1 ring-emerald-500/30'
                            : 'bg-[#050507] border-zinc-800/90 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {profile.avatarInitials}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050507] ${
                                profile.isOnline
                                  ? 'bg-emerald-400'
                                  : 'bg-zinc-600'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white truncate">
                                {profile.displayName}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-400 truncate">
                                {profile.handle}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-400 truncate mt-0.5">
                              {profile.lastMessagePreview}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold ${
                              isSelected
                                ? 'bg-emerald-400 text-zinc-950'
                                : 'bg-zinc-900 text-emerald-300 border border-zinc-800'
                            }`}
                          >
                            <MessageSquare className="w-3 h-3 shrink-0" />
                            <span>{isSelected ? 'Chat Open' : 'Open Chat'}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MESSAGE & CONNECTION REQUESTS (ACCEPT / DECLINE) */}
          {inboxTab === 'requests' && (
            <div className="space-y-4" data-testid="chat-requests-inbox-panel">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    Incoming Requests ({incomingPendingRequests.length})
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    Accept to unlock profile
                  </span>
                </div>

                {incomingPendingRequests.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[#050507] border border-zinc-800/80 text-xs text-zinc-400">
                    No incoming requests waiting for your approval right now.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {incomingPendingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        data-testid={`chat-incoming-request-card-${req.uid}`}
                        className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800/90 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {req.avatarInitials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white truncate">
                                {req.displayName}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-400 truncate">
                                {req.handle}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                              &ldquo;{req.note}&rdquo;
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAcceptIncomingRequest(req)}
                            data-testid={`chat-accept-request-${req.uid}`}
                            className="flex-1 py-2 px-3 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>Accept Request</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineIncomingRequest(req)}
                            data-testid={`chat-decline-request-${req.uid}`}
                            className="py-2 px-3 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-md flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 shrink-0" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent / Outgoing Pending Requests */}
              {outgoingPendingRequests.length > 0 && (
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <div className="text-xs font-semibold text-zinc-300">
                    Sent Requests Waiting for Acceptance (
                    {outgoingPendingRequests.length})
                  </div>
                  {outgoingPendingRequests.map((req) => (
                    <div
                      key={req.requestId}
                      className="p-3 rounded-lg bg-[#050507] border border-zinc-800/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-200 shrink-0">
                          {req.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-zinc-200 font-semibold truncate">
                            {req.displayName}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 truncate">
                            {req.handle}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300 shrink-0">
                        Requested
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discover Online Users Who Are Not Yet Connected */}
          {otherOnlinePeers.filter((p) => !acceptedUidSet.has(p.uid)).length >
            0 && (
            <div className="pt-4 border-t border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">
                  Online Profiles (Send Request to Connect)
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  Invite-first
                </span>
              </div>
              {otherOnlinePeers
                .filter((p) => !acceptedUidSet.has(p.uid))
                .map((peer) => {
                  const existingReq = requests.find(
                    (r) =>
                      (r.fromUid === currentUid && r.toUid === peer.uid) ||
                      (r.fromUid === peer.uid && r.toUid === currentUid)
                  );
                  const isIncomingPending =
                    existingReq &&
                    existingReq.toUid === currentUid &&
                    existingReq.status === 'pending';

                  return (
                    <div
                      key={peer.uid}
                      data-testid={`chat-discover-peer-${peer.uid}`}
                      className="p-3 rounded-lg bg-[#050507] border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                          {deriveAvatarInitials(peer.displayName)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-zinc-100 font-semibold truncate">
                            {peer.displayName}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate">
                            {formatInstagramStyleHandle(
                              peer.displayName,
                              peer.uid
                            )}
                          </div>
                        </div>
                      </div>

                      {isIncomingPending ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleAcceptIncomingRequest({
                              requestId: existingReq.id,
                              uid: peer.uid,
                              displayName: peer.displayName,
                            })
                          }
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Accept Request
                        </button>
                      ) : existingReq ? (
                        <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-amber-300 shrink-0">
                          {existingReq.status === 'pending'
                            ? 'Request Sent'
                            : existingReq.status}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSendRequest(peer)}
                          data-testid={`chat-send-request-${peer.uid}`}
                          className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5 shrink-0" />
                          <span>Send Request</span>
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STRICT INSTAGRAM-STYLE PROFILE-GATED STAGE */}
        <div className="lg:col-span-7">
          {!isChatBoxOpen || !activeOpenChatProfile ? (
            /* NO CHAT BOX IS RENDERED UNTIL REQUEST IS ACCEPTED AND PROFILE IS CLICKED */
            <div
              data-testid="chat-mode-locked-gate"
              className="p-8 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] min-h-[460px] flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-14 h-14 rounded-full bg-[#050507] border border-zinc-800 flex items-center justify-center text-emerald-400">
                {acceptedProfiles.length > 0 ? (
                  <MessageSquare className="w-6 h-6" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>

              {acceptedProfiles.length > 0 ? (
                <div className="space-y-4 max-w-lg w-full">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-white">
                      Click on an Accepted Profile to Chat or Call
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Your connection request is accepted. Select a person&apos;s
                      profile below to open your private chat, voice call, or
                      video call with them.
                    </p>
                  </div>

                  <div
                    className={`grid grid-cols-1 ${
                      acceptedProfiles.length > 1
                        ? 'sm:grid-cols-2'
                        : 'max-w-xs mx-auto'
                    } gap-3 pt-2 text-left`}
                  >
                    {acceptedProfiles.map((profile) => (
                      <button
                        key={profile.uid}
                        type="button"
                        onClick={() => handleOpenProfileChat(profile.uid)}
                        data-testid={`chat-stage-open-profile-${profile.uid}`}
                        className="p-4 rounded-lg bg-[#050507] border border-zinc-800 hover:border-emerald-500/60 transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {profile.avatarInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white truncate group-hover:text-emerald-300">
                            {profile.displayName}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate">
                            {profile.handle}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-400 mt-1 whitespace-nowrap">
                            View Profile &amp; Open Chat →
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : incomingPendingRequests.length > 0 ? (
                <div className="space-y-4 max-w-lg w-full">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-white">
                      Accept Incoming Request First to Unlock Chat &amp; Calls
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      You have {incomingPendingRequests.length} pending
                      connection request
                      {incomingPendingRequests.length === 1 ? '' : 's'}. Accept
                      them below, then click on their profile to open the chat
                      box, voice call, or video call.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-left">
                    {incomingPendingRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="p-4 rounded-lg bg-[#050507] border border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {req.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {req.displayName}
                            </div>
                            <div className="text-xs text-zinc-400 truncate">
                              {req.handle} · &ldquo;{req.note}&rdquo;
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAcceptIncomingRequest(req)}
                            data-testid={`chat-stage-accept-request-${req.uid}`}
                            className="px-3.5 py-2 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-zinc-950 rounded-md cursor-pointer"
                          >
                            Accept Request
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineIncomingRequest(req)}
                            className="px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-md cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5 max-w-md">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">
                      Direct Messages, Voice &amp; Video Calls Are Request-Gated
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Chat boxes never open on their own. When someone sends you
                      a request, accept them in your Requests inbox and click on
                      their profile to message, voice call, or video call them.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left text-xs">
                    <div className="p-3 rounded-lg bg-[#050507] border border-zinc-800/90 space-y-1">
                      <div className="font-mono text-[10px] text-emerald-400">
                        STEP 01
                      </div>
                      <div className="font-bold text-white">
                        Send or Receive Request
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Connect with scholars from the Online Directory.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#050507] border border-zinc-800/90 space-y-1">
                      <div className="font-mono text-[10px] text-emerald-400">
                        STEP 02
                      </div>
                      <div className="font-bold text-white">
                        Accept Request
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Approve incoming requests in your Requests tab.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#050507] border border-zinc-800/90 space-y-1">
                      <div className="font-mono text-[10px] text-emerald-400">
                        STEP 03
                      </div>
                      <div className="font-bold text-white">
                        Chat, Voice or Video Call
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Tap their accepted profile to chat or start a call.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onNavigateToHub}
                      data-testid="chat-browse-directory-btn"
                      className="px-5 py-2.5 text-xs font-bold bg-white hover:bg-zinc-200 text-black rounded-md inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Browse Online Directory &amp; Send Request</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE PROFILE DIRECT CHAT & CALL WINDOW (OPENED ONLY AFTER CLICKING AN ACCEPTED PROFILE) */
            <div
              data-testid="chat-mode-active-conversation"
              className="p-6 rounded-xl border border-zinc-800/90 bg-[#0A0A0C] flex flex-col min-h-[560px] justify-between space-y-4"
            >
              {/* Top Clicked Profile Header Bar with Instagram-Style Voice Call & Video Call Actions */}
              <div className="border-b border-zinc-800/80 pb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {activeOpenChatProfile.avatarInitials}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0C] ${
                        activeOpenChatProfile.isOnline
                          ? 'bg-emerald-400'
                          : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        data-testid="chat-active-profile-name"
                        className="text-base font-bold text-white truncate"
                      >
                        {activeOpenChatProfile.displayName}
                      </span>
                      <span className="text-xs font-mono text-zinc-400 truncate">
                        {activeOpenChatProfile.handle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span
                        className={
                          activeOpenChatProfile.isOnline
                            ? 'text-emerald-400 font-medium'
                            : 'text-zinc-500'
                        }
                      >
                        {activeOpenChatProfile.isOnline
                          ? 'Online now'
                          : 'Accepted Connection'}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        Invite-Verified Chat &amp; Call
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instagram-Style In-Chat Voice Call & Video Call Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleStartInChatCall(activeOpenChatProfile.uid, 'audio')
                    }
                    data-testid="chat-header-voice-call-btn"
                    title={`Start voice call with ${activeOpenChatProfile.displayName}`}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isCurrentProfileInCall && callType === 'audio'
                        ? 'bg-emerald-400 text-zinc-950 border-emerald-400 font-bold'
                        : 'bg-[#050507] hover:bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Voice Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStartInChatCall(activeOpenChatProfile.uid, 'video')
                    }
                    data-testid="chat-header-video-call-btn"
                    title={`Start video call with ${activeOpenChatProfile.displayName}`}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isCurrentProfileInCall && callType === 'video'
                        ? 'bg-emerald-400 text-zinc-950 border-emerald-400 font-bold'
                        : 'bg-[#050507] hover:bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Video Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isCurrentProfileInCall) {
                        handleHangupCall();
                      }
                      onSelectChatProfileUid('');
                    }}
                    data-testid="chat-close-profile-btn"
                    className="px-3 py-1.5 text-xs font-semibold bg-[#050507] hover:bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-md inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span>Back to Profiles</span>
                  </button>
                </div>
              </div>

              {/* IN-CHAT LIVE VOICE / VIDEO CALL DRAWER (INSTAGRAM DIRECT CALL VIEW) */}
              {isCurrentProfileInCall && (
                <div
                  data-testid="chat-active-call-drawer"
                  data-call-type={callType}
                  className="p-4 rounded-xl bg-[#050507] border border-emerald-500/40 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span
                        data-testid="chat-active-call-mode-label"
                        className="font-bold text-white"
                      >
                        {callType === 'video'
                          ? 'In-Chat Live Video Call'
                          : 'In-Chat Live Voice Call'}{' '}
                        with {activeOpenChatProfile.displayName}
                      </span>
                      <span className="text-zinc-500">·</span>
                      <span
                        data-testid="chat-active-call-timer"
                        className="font-mono text-emerald-400 font-semibold tabular-nums"
                      >
                        {formatTimerMMSS(callSeconds)}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {mediaNotice || 'Encrypted WebRTC P2P Stream'}
                    </span>
                  </div>

                  {callType === 'video' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="relative aspect-video rounded-lg bg-[#0A0A0C] border border-zinc-800 overflow-hidden flex flex-col items-center justify-center">
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="w-11 h-11 rounded-full bg-zinc-900/90 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                            {deriveAvatarInitials(currentDisplayName)}
                          </div>
                        </div>
                        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 border border-zinc-800 text-[11px] font-mono text-zinc-200">
                          You ({camOff ? 'Camera Off' : 'Video Ready'})
                        </div>
                      </div>

                      <div className="relative aspect-video rounded-lg bg-[#0A0A0C] border border-zinc-800 overflow-hidden flex flex-col items-center justify-center">
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-1.5">
                          <div className="w-12 h-12 rounded-full bg-zinc-900/90 border border-emerald-500/50 flex items-center justify-center text-sm font-bold text-white">
                            {activeOpenChatProfile.avatarInitials}
                          </div>
                          <span className="text-xs font-semibold text-zinc-200">
                            {activeOpenChatProfile.displayName}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400">
                            {callStatus === 'connected'
                              ? 'Connected'
                              : 'Ringing on Chat...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 px-4 rounded-lg bg-[#0A0A0C] border border-zinc-800/90 flex items-center justify-around gap-4">
                      <div className="flex flex-col items-center space-y-1.5">
                        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                          {deriveAvatarInitials(currentDisplayName)}
                        </div>
                        <span className="text-xs font-semibold text-white">
                          You
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {micMuted ? 'Mic Muted' : 'Mic Active'}
                        </span>
                      </div>

                      <div className="flex flex-col items-center space-y-1">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
                          Voice Call · {formatTimerMMSS(callSeconds)}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {callStatus === 'connected'
                            ? 'Audio Connected'
                            : 'Calling...'}
                        </span>
                      </div>

                      <div className="flex flex-col items-center space-y-1.5">
                        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-emerald-500/50 flex items-center justify-center text-sm font-bold text-white">
                          {activeOpenChatProfile.avatarInitials}
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {activeOpenChatProfile.displayName}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {activeOpenChatProfile.handle}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* In-Call Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleToggleMuteMic}
                      data-testid="chat-call-mute-mic-btn"
                      className={`px-3.5 py-2 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 cursor-pointer ${
                        micMuted
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                      }`}
                    >
                      {micMuted ? (
                        <MicOff className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{micMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                    </button>

                    {callType === 'video' && (
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        data-testid="chat-call-toggle-cam-btn"
                        className={`px-3.5 py-2 text-xs font-semibold rounded-md border inline-flex items-center gap-1.5 cursor-pointer ${
                          camOff
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                        }`}
                      >
                        {camOff ? (
                          <VideoOff className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Video className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{camOff ? 'Turn Camera On' : 'Turn Camera Off'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleHangupCall}
                      data-testid="chat-call-hangup-btn"
                      className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-md inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <PhoneOff className="w-3.5 h-3.5 shrink-0" />
                      <span>End Call</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Conversation Thread + Instagram-Style Top Profile Summary */}
              <div className="flex-1 overflow-y-auto py-3 space-y-4 max-h-[340px]">
                <div className="p-4 rounded-lg bg-[#050507] border border-zinc-900 flex flex-col items-center text-center space-y-1.5">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                    {activeOpenChatProfile.avatarInitials}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {activeOpenChatProfile.displayName}
                  </div>
                  <div className="text-xs font-mono text-zinc-400">
                    {activeOpenChatProfile.handle}
                  </div>
                  <p className="text-xs text-zinc-400 max-w-md">
                    {activeOpenChatProfile.bio}
                  </p>
                </div>

                {activeConversationMessages.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400 space-y-1">
                    <p className="text-white font-semibold">
                      Direct Chat &amp; Calling Unlocked with{' '}
                      {activeOpenChatProfile.displayName}
                    </p>
                    <p>
                      Send a message below or use Voice Call / Video Call in the
                      top bar.
                    </p>
                  </div>
                ) : (
                  activeConversationMessages.map((msg) => {
                    const isMine = msg.senderUid === currentUid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
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

              {/* Direct Message Input Form (Only rendered when an accepted profile is clicked) */}
              <form
                onSubmit={onSendDirectMessage}
                data-testid="chat-active-message-form"
                className="pt-3 border-t border-zinc-800/80 space-y-2"
              >
                {chatError && (
                  <p className="text-xs text-rose-400">{chatError}</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessageInput}
                    onChange={(e) => onChangeChatMessageInput(e.target.value)}
                    placeholder={`Message ${activeOpenChatProfile.displayName} (${activeOpenChatProfile.handle})...`}
                    aria-label="Direct chat message input"
                    data-testid="chat-direct-message-input"
                    className="flex-1 px-4 py-2.5 text-sm bg-[#050505] border border-zinc-800 rounded-md text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="submit"
                    data-testid="chat-send-message-btn"
                    className="px-5 py-2.5 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
