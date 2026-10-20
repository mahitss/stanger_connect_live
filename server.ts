import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  detectSecurityThreat,
  sanitizeSafeText,
  checkSlidingWindowRateLimit,
  normalizeAndValidatePeerMood,
  MOOD_POPULARITY_WINDOW_MS,
  PeerMoodHistoryEvent,
} from './src/utils/rules.ts';

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
  currentMode:
    | 'hub'
    | 'chat'
    | 'talk'
    | 'study'
    | 'game_subway'
    | 'game_catapult'
    | 'game_blocks'
    | 'moments'
    | 'privacy';
  activeStudyRoomCode: string | null;
  activeGameId: string | null;
  mood?: string | null;
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

const SERVER_HMAC_SECRET = crypto.randomBytes(32).toString('hex');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function timingSafeCompareHex(aHex: string, bHex: string): boolean {
  try {
    const aBuf = Buffer.from(aHex, 'hex');
    const bBuf = Buffer.from(bHex, 'hex');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function signSessionToken(uid: string, email: string): string {
  const issuedAt = Date.now();
  const payload = `${uid}.${email}.${issuedAt}`;
  const sig = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
    now.getUTCDate()
  ).padStart(2, '0')}`;
}

function makeConnectionPairKey(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('::');
}

async function startServer() {
  const app = express();

  // Enterprise HTTP Security Headers
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
    next();
  });

  // Strict JSON body limit to prevent Denial-of-Memory payloads
  app.use(express.json({ limit: '128kb' }));

  // Sliding-Window HTTP Rate Limiters (Auth Brute-Force Guard + General API Guard)
  const authRateMap = new Map<string, number[]>();
  const apiRateMap = new Map<string, number[]>();

  app.use('/api', (req, res, next) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local');
    const isAuthRoute = req.path.startsWith('/auth/');
    const windowMs = 60_000;
    const maxReq = isAuthRoute ? 25 : 120;
    const store = isAuthRoute ? authRateMap : apiRateMap;

    const check = checkSlidingWindowRateLimit(
      store.get(ip) || [],
      Date.now(),
      windowMs,
      maxReq
    );
    store.set(ip, check.updatedTimestamps);

    res.setHeader('X-RateLimit-Limit', String(maxReq));
    res.setHeader('X-RateLimit-Remaining', String(check.remaining));

    if (!check.allowed) {
      res.setHeader('Retry-After', String(check.retryAfterSeconds));
      res.status(429).json({
        error: `Rate limit exceeded. Please wait ${check.retryAfterSeconds}s before retrying.`,
      });
      return;
    }

    // Inspect all incoming string body fields for SQLi / NoSQLi / XSS injection vectors
    if (req.body && typeof req.body === 'object') {
      for (const [key, val] of Object.entries(req.body)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          res.status(400).json({ error: 'Blocked forbidden prototype property.' });
          return;
        }
        if (typeof val === 'string' && key !== 'password') {
          const threat = detectSecurityThreat(val);
          if (!threat.safe) {
            res.status(400).json({ error: threat.reason });
            return;
          }
        }
      }
    }

    next();
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    maxPayload: 64 * 1024, // 64KB max frame size
  });

  // Authoritative server-side real-time state (Zero fake or mock records)
  const accountsByEmail = new Map<string, StoredAccount>();
  const clients = new Map<string, { ws: WebSocket; peer: OnlinePeer }>();
  const studyDesks = new Map<string, StudyDesk>();
  const liveGameState = new Map<string, GameScoreEntry>();
  const acceptedPairKeys = new Set<string>();
  const wsRateMap = new Map<WebSocket, number[]>();
  const liveMoments = new Map<
    string,
    {
      id: string;
      authorUid: string;
      authorName: string;
      caption: string;
      photoDataUrl: string;
      visibility: 'public' | 'connections';
      createdAtMs: number;
    }
  >();
  const liveMomentComments = new Map<
    string,
    {
      id: string;
      momentId: string;
      momentAuthorUid: string;
      authorUid: string;
      authorName: string;
      text: string;
      visibility: 'public' | 'connections';
      createdAtMs: number;
    }
  >();
  const liveMoodEvents = new Map<string, PeerMoodHistoryEvent>();
  const lastRecordedMoodByUid = new Map<string, string>();

  function pruneExpiredMoodEvents(nowMs = Date.now()) {
    const cutoff = nowMs - MOOD_POPULARITY_WINDOW_MS;
    for (const [id, ev] of liveMoodEvents.entries()) {
      if (ev.timestampMs < cutoff) {
        liveMoodEvents.delete(id);
      }
    }
  }

  function recordPeerMoodEvent(uid: string, displayName: string, rawMood: string | null | undefined) {
    const nowMs = Date.now();
    pruneExpiredMoodEvents(nowMs);
    const check = normalizeAndValidatePeerMood(rawMood);
    if (!check.valid || !check.mood) {
      lastRecordedMoodByUid.delete(uid);
      return;
    }
    const prevMood = lastRecordedMoodByUid.get(uid);
    if (prevMood && prevMood.toLowerCase() === check.mood.toLowerCase()) {
      return;
    }
    lastRecordedMoodByUid.set(uid, check.mood);
    const id = `mood_${uid}_${nowMs}_${Math.random().toString(36).slice(2, 7)}`;
    liveMoodEvents.set(id, {
      id,
      uid,
      displayName: sanitizeSafeText(displayName || 'Member', 64),
      mood: check.mood,
      timestampMs: nowMs,
    });
    if (liveMoodEvents.size > 500) {
      const oldestKey = liveMoodEvents.keys().next().value;
      if (oldestKey) liveMoodEvents.delete(oldestKey);
    }
  }

  function buildPlatformUsersList() {
    const byUid = new Map<
      string,
      {
        uid: string;
        displayName: string;
        bio: string;
        streakCount: number;
        participationPoints: number;
        isOnline: boolean;
        currentMode: string;
        privacyVisibility: 'everyone' | 'connections_only' | 'ghost';
      }
    >();

    for (const acct of accountsByEmail.values()) {
      byUid.set(acct.uid, {
        uid: acct.uid,
        displayName: acct.displayName,
        bio: acct.bio,
        streakCount: acct.streakCount,
        participationPoints: acct.participationPoints,
        isOnline: clients.has(acct.uid),
        currentMode: clients.get(acct.uid)?.peer.currentMode || 'hub',
        privacyVisibility: acct.privacyVisibility,
      });
    }

    for (const { peer } of clients.values()) {
      const prev = byUid.get(peer.uid);
      byUid.set(peer.uid, {
        uid: peer.uid,
        displayName: peer.displayName || prev?.displayName || 'Verified Member',
        bio: peer.bio || prev?.bio || 'Active member on Mr. Stranger',
        streakCount: Math.max(peer.streakCount, prev?.streakCount || 1),
        participationPoints: Math.max(
          peer.participationPoints,
          prev?.participationPoints || 0
        ),
        isOnline: true,
        currentMode: peer.currentMode || 'hub',
        privacyVisibility: peer.privacyVisibility,
      });
    }

    return Array.from(byUid.values()).filter((u) => u.privacyVisibility !== 'ghost');
  }

  function broadcastPresence() {
    pruneExpiredMoodEvents();
    const peers = Array.from(clients.values())
      .map((c) => c.peer)
      .filter((p) => p.privacyVisibility !== 'ghost');
    const desks = Array.from(studyDesks.values());
    const scores = Array.from(liveGameState.values());
    const platformUsers = buildPlatformUsersList();
    const payload = JSON.stringify({
      type: 'server:state_sync',
      peers,
      platformUsers,
      studyDesks: desks,
      gameScores: scores,
      moments: Array.from(liveMoments.values()),
      momentComments: Array.from(liveMomentComments.values()),
      moodEvents: Array.from(liveMoodEvents.values()),
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

  app.get('/api/leaderboard', (_req, res) => {
    res.json({
      users: buildPlatformUsersList(),
      timestamp: Date.now(),
    });
  });

  // Real Account Registration & Sign-In Endpoints (Email + Password + Account Profile)
  app.post('/api/auth/register', (req, res) => {
    const email = sanitizeSafeText(String(req.body?.email || ''), 160).toLowerCase();
    const password = String(req.body?.password || '');
    const displayName = sanitizeSafeText(String(req.body?.displayName || ''), 64);
    const bio = sanitizeSafeText(
      String(req.body?.bio || 'Verified Member on Mr. Stranger'),
      300
    );

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
      return;
    }
    if (displayName.length < 2) {
      res.status(400).json({ error: 'Please enter your full account display name.' });
      return;
    }
    if (accountsByEmail.has(email)) {
      res.status(409).json({
        error: 'An account with this email already exists. Please switch to Sign In.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const uid = `acct_${crypto.randomBytes(8).toString('hex')}`;
    const today = getTodayDateString();

    const account: StoredAccount = {
      uid,
      email,
      displayName,
      bio,
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
      sessionToken: signSessionToken(account.uid, account.email),
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const email = sanitizeSafeText(String(req.body?.email || ''), 160).toLowerCase();
    const password = String(req.body?.password || '');

    const account = accountsByEmail.get(email);
    if (!account) {
      res.status(401).json({
        error:
          'No account found with this Email ID. Please create your account first or check your email.',
      });
      return;
    }

    const attemptedHash = hashPassword(password, account.salt);
    if (!timingSafeCompareHex(attemptedHash, account.passwordHash)) {
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
      sessionToken: signSessionToken(account.uid, account.email),
    });
  });

  app.post('/api/auth/verify-password', (req, res) => {
    const email = sanitizeSafeText(String(req.body?.email || ''), 160).toLowerCase();
    const password = String(req.body?.password || '');
    const account = accountsByEmail.get(email);
    if (!account) {
      res.json({ verified: true });
      return;
    }
    const attemptedHash = hashPassword(password, account.salt);
    if (!timingSafeCompareHex(attemptedHash, account.passwordHash)) {
      res.status(401).json({
        error:
          'Password verification failed. Please enter your account password to confirm sign out.',
      });
      return;
    }
    res.json({ verified: true });
  });

  wss.on('connection', (ws) => {
    let registeredUid: string | null = null;
    wsRateMap.set(ws, []);

    ws.on('message', (raw) => {
      try {
        // Per-socket sliding-window flood & DoS rate limit (45 frames per 10 seconds)
        const rateCheck = checkSlidingWindowRateLimit(
          wsRateMap.get(ws) || [],
          Date.now(),
          10_000,
          45
        );
        wsRateMap.set(ws, rateCheck.updatedTimestamps);
        if (!rateCheck.allowed) {
          ws.send(
            JSON.stringify({
              type: 'server:security_notice',
              reason: `WebSocket rate limit active. Slow down (${rateCheck.retryAfterSeconds}s).`,
            })
          );
          return;
        }

        const msg = JSON.parse(String(raw));

        if (msg.type === 'peer:announce' && msg.peer?.uid) {
          const cleanUid = String(msg.peer.uid).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
          if (!cleanUid) return;
          registeredUid = cleanUid;
          const moodCheck = normalizeAndValidatePeerMood(
            msg.peer.mood ?? clients.get(registeredUid)?.peer.mood ?? null
          );
          const peer: OnlinePeer = {
            uid: registeredUid,
            displayName: sanitizeSafeText(String(msg.peer.displayName || 'User'), 64),
            bio: sanitizeSafeText(String(msg.peer.bio || ''), 300),
            avatarUrl: String(msg.peer.avatarUrl || '').slice(0, 200000),
            streakCount: Math.max(1, Number(msg.peer.streakCount) || 1),
            participationPoints: Math.max(0, Number(msg.peer.participationPoints) || 0),
            privacyVisibility:
              msg.peer.privacyVisibility === 'connections_only' ||
              msg.peer.privacyVisibility === 'ghost'
                ? msg.peer.privacyVisibility
                : 'everyone',
            currentMode: msg.peer.currentMode || 'hub',
            activeStudyRoomCode: sanitizeSafeText(
              String(msg.peer.activeStudyRoomCode || 'STUDY-GLOBAL'),
              24
            ),
            activeGameId: msg.peer.activeGameId || null,
            mood: moodCheck.valid ? moodCheck.mood : null,
            connectedAt: clients.get(registeredUid)?.peer.connectedAt || Date.now(),
          };
          clients.set(registeredUid, { ws, peer });
          if (peer.mood) {
            recordPeerMoodEvent(peer.uid, peer.displayName, peer.mood);
          }
          broadcastPresence();
          return;
        }

        if (!registeredUid) return;

        if (msg.type === 'peer:update_mood') {
          const entry = clients.get(registeredUid);
          if (entry) {
            const moodCheck = normalizeAndValidatePeerMood(msg.mood);
            if (!moodCheck.valid) {
              ws.send(
                JSON.stringify({
                  type: 'server:security_notice',
                  reason: moodCheck.error,
                })
              );
              return;
            }
            entry.peer.mood = moodCheck.mood;
            recordPeerMoodEvent(entry.peer.uid, entry.peer.displayName, moodCheck.mood);
            broadcastPresence();
          }
          return;
        }

        if (msg.type === 'peer:update_privacy') {
          const entry = clients.get(registeredUid);
          if (entry) {
            entry.peer.privacyVisibility =
              msg.privacyVisibility === 'connections_only' || msg.privacyVisibility === 'ghost'
                ? msg.privacyVisibility
                : 'everyone';
            for (const acct of accountsByEmail.values()) {
              if (acct.uid === registeredUid) {
                acct.privacyVisibility = entry.peer.privacyVisibility;
              }
            }
            broadcastPresence();
          }
          return;
        }

        if (msg.type === 'peer:update_stats') {
          const entry = clients.get(registeredUid);
          const nextPoints = Math.max(0, Math.min(10_000_000, Math.round(Number(msg.participationPoints) || 0)));
          const nextStreak = Math.max(1, Math.min(10_000, Math.round(Number(msg.streakCount) || 1)));
          if (entry) {
            entry.peer.participationPoints = Math.max(entry.peer.participationPoints, nextPoints);
            entry.peer.streakCount = Math.max(entry.peer.streakCount, nextStreak);
          }
          for (const acct of accountsByEmail.values()) {
            if (acct.uid === registeredUid) {
              acct.participationPoints = Math.max(acct.participationPoints, nextPoints);
              acct.streakCount = Math.max(acct.streakCount, nextStreak);
            }
          }
          broadcastPresence();
          return;
        }

        if (msg.type === 'peer:mode_change') {
          const entry = clients.get(registeredUid);
          if (entry) {
            entry.peer.currentMode = msg.currentMode || 'hub';
            entry.peer.activeGameId = msg.activeGameId || null;
            if (msg.activeStudyRoomCode) {
              entry.peer.activeStudyRoomCode = sanitizeSafeText(
                String(msg.activeStudyRoomCode),
                24
              );
            }
            if (msg.mood !== undefined) {
              const moodCheck = normalizeAndValidatePeerMood(msg.mood);
              if (moodCheck.valid) {
                entry.peer.mood = moodCheck.mood;
              }
            }
            broadcastPresence();
          }
          return;
        }

        if (msg.type === 'request:notify' && msg.toUid) {
          const targetUid = String(msg.toUid).replace(/[^a-zA-Z0-9_-]/g, '');
          if (!targetUid || targetUid === registeredUid) return;
          const noteText = String(msg.note || '');
          if (!detectSecurityThreat(noteText).safe) return;

          sendToUid(targetUid, {
            type: 'request:incoming',
            fromUid: registeredUid,
            fromName: sanitizeSafeText(String(msg.fromName || 'User'), 64),
            note: sanitizeSafeText(noteText, 200),
            timestamp: Date.now(),
          });
          return;
        }

        if (msg.type === 'request:decision' && msg.partnerUid) {
          const partnerUid = String(msg.partnerUid).replace(/[^a-zA-Z0-9_-]/g, '');
          if (!partnerUid || partnerUid === registeredUid) return;
          const decision = msg.decision === 'accepted' ? 'accepted' : 'declined';
          const pairKey = makeConnectionPairKey(registeredUid, partnerUid);
          if (decision === 'accepted') {
            acceptedPairKeys.add(pairKey);
          } else {
            acceptedPairKeys.delete(pairKey);
          }
          sendToUid(partnerUid, {
            type: 'request:decision',
            fromUid: registeredUid,
            decision,
            timestamp: Date.now(),
          });
          return;
        }

        // Strict Invite-First Chat Authorization on Server
        if (msg.type === 'chat:direct' && msg.toUid) {
          const targetUid = String(msg.toUid).replace(/[^a-zA-Z0-9_-]/g, '');
          if (!targetUid || targetUid === registeredUid) return;
          const pairKey = makeConnectionPairKey(registeredUid, targetUid);
          if (!acceptedPairKeys.has(pairKey)) {
            ws.send(
              JSON.stringify({
                type: 'server:security_notice',
                reason:
                  'Blocked direct message: connection invite must be accepted by both users first.',
              })
            );
            return;
          }
          const rawText = String(msg.text || '');
          if (!detectSecurityThreat(rawText).safe) return;

          const payload = {
            type: 'chat:direct',
            id: String(msg.id || `${Date.now()}-${registeredUid}`),
            senderUid: registeredUid,
            senderName: sanitizeSafeText(String(msg.senderName || 'User'), 64),
            receiverUid: targetUid,
            text: sanitizeSafeText(rawText, 1000),
            timestamp: Date.now(),
          };
          sendToUid(targetUid, payload);
          sendToUid(registeredUid, payload);
          return;
        }

        // Strict Invite-First WebRTC Signaling Authorization on Server
        if (msg.type === 'webrtc:signal' && msg.toUid) {
          const targetUid = String(msg.toUid).replace(/[^a-zA-Z0-9_-]/g, '');
          if (!targetUid || targetUid === registeredUid) return;
          const pairKey = makeConnectionPairKey(registeredUid, targetUid);
          if (!acceptedPairKeys.has(pairKey)) {
            return;
          }
          sendToUid(targetUid, {
            type: 'webrtc:signal',
            fromUid: registeredUid,
            fromName: sanitizeSafeText(String(msg.fromName || 'User'), 64),
            callType: msg.callType === 'audio' ? 'audio' : 'video',
            signalData: msg.signalData,
          });
          return;
        }

        // Study Room Live Desk Join / Update / Leave with Invite Room Code
        if (msg.type === 'study:join') {
          const roomCode = sanitizeSafeText(String(msg.roomCode || 'STUDY-GLOBAL'), 24);
          const subject = String(msg.subject || 'Deep Work');
          const positiveNote = String(msg.positiveNote || 'Stay focused and keep building.');
          if (!detectSecurityThreat(subject).safe || !detectSecurityThreat(positiveNote).safe) {
            return;
          }

          const entry = clients.get(registeredUid);
          if (entry) {
            entry.peer.activeStudyRoomCode = roomCode;
          }

          studyDesks.set(registeredUid, {
            uid: registeredUid,
            displayName: sanitizeSafeText(String(msg.displayName || 'Scholar'), 64),
            roomCode,
            roomName: sanitizeSafeText(String(msg.roomName || `Study Room ${roomCode}`), 80),
            subject: sanitizeSafeText(subject, 100),
            positiveNote: sanitizeSafeText(positiveNote, 400),
            timerMinutes: Math.min(240, Math.max(1, Number(msg.timerMinutes) || 25)),
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
          const rawText = String(msg.text || '');
          if (!detectSecurityThreat(rawText).safe) return;
          const chatMsg = JSON.stringify({
            type: 'study:chat',
            id: `${Date.now()}-${registeredUid}`,
            roomCode: sanitizeSafeText(String(msg.roomCode || 'STUDY-GLOBAL'), 24),
            senderUid: registeredUid,
            senderName: sanitizeSafeText(String(msg.senderName || 'Scholar'), 64),
            text: sanitizeSafeText(rawText, 500),
            timestamp: Date.now(),
          });
          for (const { ws: clientWs } of clients.values()) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(chatMsg);
            }
          }
          return;
        }

        // Photo Moment Publish, Delete, Comment & Discussion Sync
        if (msg.type === 'moment:publish' && msg.moment) {
          const rawMoment = msg.moment;
          const momentId = String(rawMoment.id || `moment_${Date.now()}_${registeredUid}`)
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .slice(0, 128);
          const rawCaption = String(rawMoment.caption || '');
          const photoDataUrl = String(rawMoment.photoDataUrl || '');
          if (
            !momentId ||
            !rawCaption.trim() ||
            !detectSecurityThreat(rawCaption).safe ||
            !photoDataUrl.startsWith('data:image/') ||
            photoDataUrl.length > 750000
          ) {
            return;
          }
          const visibility: 'public' | 'connections' =
            rawMoment.visibility === 'connections' ? 'connections' : 'public';
          const momentRecord = {
            id: momentId,
            authorUid: registeredUid,
            authorName: sanitizeSafeText(String(rawMoment.authorName || 'Member'), 64),
            caption: sanitizeSafeText(rawCaption, 500),
            photoDataUrl,
            visibility,
            createdAtMs: Number(rawMoment.createdAtMs) || Date.now(),
          };
          liveMoments.set(momentId, momentRecord);
          const pubFrame = JSON.stringify({
            type: 'moment:publish',
            moment: momentRecord,
          });
          for (const { ws: clientWs } of clients.values()) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(pubFrame);
            }
          }
          return;
        }

        if (msg.type === 'moment:delete' && msg.momentId) {
          const momentId = String(msg.momentId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
          const existing = liveMoments.get(momentId);
          if (!existing || existing.authorUid === registeredUid) {
            liveMoments.delete(momentId);
            const delFrame = JSON.stringify({
              type: 'moment:delete',
              momentId,
            });
            for (const { ws: clientWs } of clients.values()) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(delFrame);
              }
            }
          }
          return;
        }

        if (msg.type === 'moment:comment' && msg.momentId) {
          const momentId = String(msg.momentId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
          const momentAuthorUid = String(msg.momentAuthorUid || registeredUid)
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .slice(0, 128);
          const rawText = String(msg.text || '');
          if (!momentId || !rawText.trim() || !detectSecurityThreat(rawText).safe) {
            return;
          }
          const visibility: 'public' | 'connections' =
            msg.visibility === 'connections' ? 'connections' : 'public';

          if (visibility === 'connections' && registeredUid !== momentAuthorUid) {
            const pairKey = makeConnectionPairKey(registeredUid, momentAuthorUid);
            if (!acceptedPairKeys.has(pairKey)) {
              ws.send(
                JSON.stringify({
                  type: 'server:security_notice',
                  reason:
                    'Only accepted connections can comment on a connections-only photo moment.',
                })
              );
              return;
            }
          }

          const commentId = String(msg.id || `cmt_${Date.now()}_${registeredUid}`)
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .slice(0, 128);

          const commentRecord = {
            id: commentId,
            momentId,
            momentAuthorUid,
            authorUid: registeredUid,
            authorName: sanitizeSafeText(String(msg.authorName || 'Member'), 64),
            text: sanitizeSafeText(rawText, 400),
            visibility,
            createdAtMs: Number(msg.createdAtMs) || Date.now(),
          };

          liveMomentComments.set(commentId, commentRecord);
          const commentFrame = JSON.stringify({
            type: 'moment:comment',
            comment: commentRecord,
          });
          for (const { ws: clientWs } of clients.values()) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(commentFrame);
            }
          }
          return;
        }

        if (msg.type === 'moment:comment_delete' && msg.commentId) {
          const commentId = String(msg.commentId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
          const existing = liveMomentComments.get(commentId);
          if (
            existing &&
            (existing.authorUid === registeredUid || existing.momentAuthorUid === registeredUid)
          ) {
            liveMomentComments.delete(commentId);
            const delFrame = JSON.stringify({
              type: 'moment:comment_delete',
              commentId,
            });
            for (const { ws: clientWs } of clients.values()) {
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(delFrame);
              }
            }
          }
          return;
        }

        // Multiplayer Game Live Telemetry & Score Sync
        if (msg.type === 'game:update' && msg.gameId) {
          const gameId = msg.gameId as 'subway' | 'catapult' | 'blocks';
          if (gameId !== 'subway' && gameId !== 'catapult' && gameId !== 'blocks') return;
          const key = `${gameId}:${registeredUid}`;
          liveGameState.set(key, {
            uid: registeredUid,
            displayName: sanitizeSafeText(String(msg.displayName || 'Player'), 64),
            gameId,
            score: Math.max(0, Math.min(10_000_000, Number(msg.score) || 0)),
            laneOrState: sanitizeSafeText(String(msg.laneOrState || ''), 64),
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
      wsRateMap.delete(ws);
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
      securityGuards: ['scrypt', 'hmac-sha256', 'rate-limiter', 'sqli-nosqli-xss-shield'],
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
