import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface OnlinePeer {
  uid: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  streakCount: number;
  participationPoints: number;
  privacyVisibility: 'everyone' | 'connections_only' | 'ghost';
  currentMode: 'hub' | 'chat' | 'talk' | 'study' | 'game_subway' | 'game_catapult' | 'game_blocks' | 'moments' | 'privacy';
  activeStudyRoomCode: string | null;
  activeGameId: string | null;
  connectedAt: number;
}

export interface StudyDesk {
  uid: string;
  displayName: string;
  roomCode: string;
  roomName: string;
  subject: string;
  positiveNote: string;
  timerMinutes: number;
  startedAt: number;
}

export interface GameScoreEntry {
  uid: string;
  displayName: string;
  gameId: 'subway' | 'catapult' | 'blocks';
  score: number;
  laneOrState?: string;
  updatedAt: number;
}

interface StoredAccount {
  uid: string;
  email: string;
  displayName: string;
  bio: string;
  salt: string;
  passwordHash: string;
  streakCount: number;
  lastLoginDate: string;
  participationPoints: number;
  privacyVisibility: 'everyone' | 'connections_only' | 'ghost';
  readReceiptsEnabled: boolean;
  allowCallsFromConnectionsOnly: boolean;
  createdAt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Authoritative server-side real-time state (Zero fake or mock records)
  const accountsByEmail = new Map<string, StoredAccount>();
  const clients = new Map<string, { ws: WebSocket; peer: OnlinePeer }>();
  const studyDesks = new Map<string, StudyDesk>();
  const liveGameState = new Map<string, GameScoreEntry>();

  function broadcastPresence() {
    const peers = Array.from(clients.values())
      .map((c) => c.peer)
      .filter((p) => p.privacyVisibility !== 'ghost');
    const desks = Array.from(studyDesks.values());
    const scores = Array.from(liveGameState.values());
    const payload = JSON.stringify({
      type: 'server:state_sync',
      peers,
      studyDesks: desks,
      gameScores: scores,
      serverTimestamp: Date.now(),
    });
    for (const { ws } of clients.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  function sendToUid(targetUid: string, message: Record<string, unknown>) {
    const target = clients.get(targetUid);
    if (target && target.ws.readyState === WebSocket.OPEN) {
      target.ws.send(JSON.stringify(message));
    }
  }

  // Real Account Registration & Sign-In Endpoints (Email + Password + Account Profile)
  app.post('/api/auth/register', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || '').trim();
    const bio = String(req.body?.bio || 'Verified Member on Mr. Stranger').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }
    if (displayName.length < 2) {
      res.status(400).json({ error: 'Please enter your full account display name.' });
      return;
    }
    if (accountsByEmail.has(email)) {
      res.status(409).json({ error: 'An account with this email already exists. Please switch to Sign In.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const uid = `acct_${crypto.randomBytes(8).toString('hex')}`;
    const today = getTodayDateString();

    const account: StoredAccount = {
      uid,
      email,
      displayName: displayName.slice(0, 64),
      bio: bio.slice(0, 300),
      salt,
      passwordHash,
      streakCount: 1,
      lastLoginDate: today,
      participationPoints: 25,
      privacyVisibility: 'everyone',
      readReceiptsEnabled: true,
      allowCallsFromConnectionsOnly: true,
      createdAt: new Date().toISOString(),
    };

    accountsByEmail.set(email, account);
    res.json({
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      bio: account.bio,
      streakCount: account.streakCount,
      lastLoginDate: account.lastLoginDate,
      participationPoints: account.participationPoints,
      privacyVisibility: account.privacyVisibility,
      readReceiptsEnabled: account.readReceiptsEnabled,
      allowCallsFromConnectionsOnly: account.allowCallsFromConnectionsOnly,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const account = accountsByEmail.get(email);
    if (!account) {
      res.status(401).json({
        error: 'No account found with this Email ID. Please create your account first or check your email.',
      });
      return;
    }

    const attemptedHash = hashPassword(password, account.salt);
    if (attemptedHash !== account.passwordHash) {
      res.status(401).json({ error: 'Invalid password for this Email ID.' });
      return;
    }

    const today = getTodayDateString();
    if (account.lastLoginDate !== today) {
      account.streakCount += 1;
      account.lastLoginDate = today;
      account.participationPoints += 15;
    }

    res.json({
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      bio: account.bio,
      streakCount: account.streakCount,
      lastLoginDate: account.lastLoginDate,
      participationPoints: account.participationPoints,
      privacyVisibility: account.privacyVisibility,
      readReceiptsEnabled: account.readReceiptsEnabled,
      allowCallsFromConnectionsOnly: account.allowCallsFromConnectionsOnly,
    });
  });

  app.post('/api/auth/verify-password', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const account = accountsByEmail.get(email);
    if (!account) {
      res.json({ verified: true });
      return;
    }
    const attemptedHash = hashPassword(password, account.salt);
    if (attemptedHash !== account.passwordHash) {
      res.status(401).json({ error: 'Password verification failed. Please enter your account password to confirm sign out.' });
      return;
    }
    res.json({ verified: true });
  });

  wss.on('connection', (ws) => {
    let registeredUid: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));

        if (msg.type === 'peer:announce' && msg.peer?.uid) {
          registeredUid = String(msg.peer.uid);
          const peer: OnlinePeer = {
            uid: registeredUid,
            displayName: String(msg.peer.displayName || 'User').slice(0, 64),
            bio: String(msg.peer.bio || '').slice(0, 300),
            avatarUrl: String(msg.peer.avatarUrl || '').slice(0, 200000),
            streakCount: Number(msg.peer.streakCount) || 1,
            participationPoints: Number(msg.peer.participationPoints) || 0,
            privacyVisibility: msg.peer.privacyVisibility || 'everyone',
            currentMode: msg.peer.currentMode || 'hub',
            activeStudyRoomCode: msg.peer.activeStudyRoomCode || 'STUDY-GLOBAL',
            activeGameId: msg.peer.activeGameId || null,
            connectedAt: clients.get(registeredUid)?.peer.connectedAt || Date.now(),
          };
          clients.set(registeredUid, { ws, peer });
          broadcastPresence();
          return;
        }

        if (!registeredUid) return;

        if (msg.type === 'peer:update_privacy') {
          const entry = clients.get(registeredUid);
          if (entry) {
            entry.peer.privacyVisibility = msg.privacyVisibility || 'everyone';
            broadcastPresence();
          }
          return;
        }

        if (msg.type === 'peer:mode_change') {
          const entry = clients.get(registeredUid);
          if (entry) {
            entry.peer.currentMode = msg.currentMode || 'hub';
            entry.peer.activeGameId = msg.activeGameId || null;
            if (msg.activeStudyRoomCode) {
              entry.peer.activeStudyRoomCode = String(msg.activeStudyRoomCode);
            }
            broadcastPresence();
          }
          return;
        }

        if (msg.type === 'request:notify' && msg.toUid) {
          sendToUid(String(msg.toUid), {
            type: 'request:incoming',
            fromUid: registeredUid,
            fromName: msg.fromName,
            note: msg.note,
            timestamp: Date.now(),
          });
          return;
        }

        if (msg.type === 'chat:direct' && msg.toUid) {
          const payload = {
            type: 'chat:direct',
            id: String(msg.id || `${Date.now()}-${registeredUid}`),
            senderUid: registeredUid,
            senderName: String(msg.senderName || 'User'),
            receiverUid: String(msg.toUid),
            text: String(msg.text || '').slice(0, 1000),
            timestamp: Date.now(),
          };
          sendToUid(String(msg.toUid), payload);
          sendToUid(registeredUid, payload);
          return;
        }

        if (msg.type === 'webrtc:signal' && msg.toUid) {
          sendToUid(String(msg.toUid), {
            type: 'webrtc:signal',
            fromUid: registeredUid,
            fromName: msg.fromName,
            callType: msg.callType || 'video',
            signalData: msg.signalData,
          });
          return;
        }

        // Study Room Live Desk Join / Update / Leave with Invite Room Code
        if (msg.type === 'study:join') {
          const roomCode = String(msg.roomCode || 'STUDY-GLOBAL').slice(0, 24);
          studyDesks.set(registeredUid, {
            uid: registeredUid,
            displayName: String(msg.displayName || 'Scholar').slice(0, 64),
            roomCode,
            roomName: String(msg.roomName || `Study Room ${roomCode}`).slice(0, 80),
            subject: String(msg.subject || 'Deep Work').slice(0, 100),
            positiveNote: String(msg.positiveNote || 'Stay focused and keep building.').slice(0, 400),
            timerMinutes: Number(msg.timerMinutes) || 25,
            startedAt: Date.now(),
          });
          broadcastPresence();
          return;
        }

        if (msg.type === 'study:leave') {
          studyDesks.delete(registeredUid);
          broadcastPresence();
          return;
        }

        if (msg.type === 'study:chat') {
          const chatMsg = JSON.stringify({
            type: 'study:chat',
            id: `${Date.now()}-${registeredUid}`,
            roomCode: String(msg.roomCode || 'STUDY-GLOBAL'),
            senderUid: registeredUid,
            senderName: String(msg.senderName || 'Scholar').slice(0, 64),
            text: String(msg.text || '').slice(0, 500),
            timestamp: Date.now(),
          });
          for (const { ws: clientWs } of clients.values()) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(chatMsg);
            }
          }
          return;
        }

        // Multiplayer Game Live Telemetry & Score Sync
        if (msg.type === 'game:update' && msg.gameId) {
          const gameId = msg.gameId as 'subway' | 'catapult' | 'blocks';
          const key = `${gameId}:${registeredUid}`;
          liveGameState.set(key, {
            uid: registeredUid,
            displayName: String(msg.displayName || 'Player').slice(0, 64),
            gameId,
            score: Number(msg.score) || 0,
            laneOrState: String(msg.laneOrState || ''),
            updatedAt: Date.now(),
          });
          broadcastPresence();
          return;
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    });

    ws.on('close', () => {
      if (registeredUid) {
        clients.delete(registeredUid);
        studyDesks.delete(registeredUid);
        for (const key of liveGameState.keys()) {
          if (key.endsWith(`:${registeredUid}`)) {
            liveGameState.delete(key);
          }
        }
        broadcastPresence();
      }
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Mr. Stranger Enterprise Real-Time Core',
      onlineCount: clients.size,
      activeStudyDesks: studyDesks.size,
      activeGameSessions: liveGameState.size,
      timestamp: new Date().toISOString(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Mr. Stranger Server & WebSocket Hub listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
