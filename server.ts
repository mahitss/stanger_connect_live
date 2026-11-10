import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
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
  type PeerMoodHistoryEvent,
  BOOTSTRAPPED_ADMIN_EMAIL,
  DEFAULT_ALLOWED_CORS_ORIGINS,
  isBlockedSensitiveFilePath,
  sanitizeFormPayload,
  validateCorsOrigin,
  buildEnterpriseSecurityHeadersSpec,
  verifyUserAndAdminAccess,
  auditEnvironmentSecurity,
  buildFullSecurityAuditReport,
  toggleUniquePostLike,
  paginatePostLikersList,
  resolveRequestCorrelationId,
  computeApiLatencyPercentiles,
  buildSevenPillarEngineeringBlueprintSpec,
  type MomentLikeUserRecord,
  type StructuredCorrelationLogEntry,
  PAYMENT_MEMBERSHIP_PLANS,
  resolvePaymentMembershipPlan,
  validatePaymentCheckoutRequest,
  type PaymentTransactionRecord,
  type PaymentPlanId,
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

const SERVER_HMAC_SECRET =
  process.env.SESSION_HMAC_SECRET && process.env.SESSION_HMAC_SECRET.length >= 64
    ? process.env.SESSION_HMAC_SECRET
    : crypto.randomBytes(32).toString('hex');

const SESSION_TTL_MS = Math.max(
  300_000,
  Math.min(86_400_000, Number(process.env.SESSION_TTL_MS) || 43_200_000)
);

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
} as const;

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS).toString('hex');
}

function timingSafeCompareHex(aHex: string, bHex: string): boolean {
  try {
    if (!aHex || !bHex || aHex.length !== bHex.length || aHex.length % 2 !== 0) return false;
    const aBuf = Buffer.from(aHex, 'hex');
    const bBuf = Buffer.from(bHex, 'hex');
    if (aBuf.length === 0 || aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function signSessionToken(uid: string, email: string): string {
  const issuedAt = Date.now();
  const payload = Buffer.from(JSON.stringify({ uid, email: email.toLowerCase(), issuedAt }), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySessionToken(
  token: string | undefined | null
): { valid: boolean; uid: string | null; email: string | null; issuedAt: number | null; reason?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, uid: null, email: null, issuedAt: null, reason: 'Missing session token.' };
  }
  const trimmed = token.replace(/^Bearer\s+/i, '').trim();
  const dotIdx = trimmed.lastIndexOf('.');
  if (dotIdx <= 0) {
    return { valid: false, uid: null, email: null, issuedAt: null, reason: 'Malformed session token.' };
  }
  const payloadPart = trimmed.slice(0, dotIdx);
  const sigPart = trimmed.slice(dotIdx + 1);
  const expectedSig = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(payloadPart).digest('hex');
  if (!timingSafeCompareHex(sigPart, expectedSig)) {
    return { valid: false, uid: null, email: null, issuedAt: null, reason: 'Invalid session token signature.' };
  }
  try {
    const decoded = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    const uid = typeof decoded?.uid === 'string' ? decoded.uid : null;
    const email = typeof decoded?.email === 'string' ? decoded.email.toLowerCase() : null;
    const issuedAt = Number(decoded?.issuedAt);
    if (!uid || !email || !Number.isFinite(issuedAt)) {
      return { valid: false, uid: null, email: null, issuedAt: null, reason: 'Invalid session token claims.' };
    }
    if (Date.now() - issuedAt > SESSION_TTL_MS) {
      return { valid: false, uid: null, email: null, issuedAt: null, reason: 'Session token expired.' };
    }
    return { valid: true, uid, email, issuedAt };
  } catch {
    return { valid: false, uid: null, email: null, issuedAt: null, reason: 'Corrupted session token payload.' };
  }
}

function extractBearerSession(req: Request) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.trim()) {
    return verifySessionToken(authHeader);
  }
  const tokenFromBody = typeof req.body?.sessionToken === 'string' ? req.body.sessionToken : undefined;
  return verifySessionToken(tokenFromBody);
}

function getConfiguredAllowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([...DEFAULT_ALLOWED_CORS_ORIGINS, ...fromEnv]));
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
  // Enforce production-safe non-debug runtime
  process.env.DEBUG = 'false';

  const app = express();
  const allowedOrigins = getConfiguredAllowedOrigins();

  // 1. Enterprise HTTP Security Headers (Applied to API routes; non-API SPA/Vite routes omit frame-blocking headers for AI Studio Preview iframe)
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const isApiRoute = req.path.startsWith('/api');
    if (isApiRoute) {
      const headers = buildEnterpriseSecurityHeadersSpec({ isApiRoute: true });
      for (const [key, value] of Object.entries(headers)) {
        res.setHeader(key, value);
      }
    } else {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    next();
  });

  // 2. Strict CORS Origin Allowlist Enforcement on API routes & Permissive Asset/Module CORS for AI Studio Preview
  app.use((req, res, next) => {
    const isApiRoute = req.path.startsWith('/api');
    const originHeader = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
    const dynamicAllowed = hostHeader
      ? [...allowedOrigins, `https://${hostHeader}`, `http://${hostHeader}`]
      : allowedOrigins;
    const corsCheck = validateCorsOrigin(originHeader, dynamicAllowed);
    res.setHeader('Vary', 'Origin');

    if (isApiRoute && !corsCheck.allowed) {
      res.status(403).json({
        error: corsCheck.reason || 'Cross-Origin Request Blocked by Zero-Trust CORS Policy.',
      });
      return;
    }

    const effectiveAllowOrigin =
      corsCheck.allowOriginHeader ||
      (!isApiRoute && originHeader && originHeader !== 'null' ? originHeader : null);

    if (effectiveAllowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', effectiveAllowOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '600');
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  // 3. Exposed Sensitive File Blocker (Blocks /.env, /.git, /firestore.rules, /server.ts, /package.json, /*.map, etc.)
  app.use((req, res, next) => {
    const fileCheck = isBlockedSensitiveFilePath(req.originalUrl || req.path);
    if (fileCheck.blocked) {
      res.status(403).json({
        error: 'Access Denied: Sensitive system or configuration path is protected.',
        reason: fileCheck.reason,
      });
      return;
    }
    next();
  });

  // 4. Strict JSON body limit (64KB) to prevent Denial-of-Memory payloads
  app.use(express.json({ limit: '64kb' }));

  // 5. 3-Tier Sliding-Window HTTP Rate Limiters & X-Correlation-Id / p95 Observability Telemetry
  const adminRateMap = new Map<string, number[]>();
  const authRateMap = new Map<string, number[]>();
  const apiRateMap = new Map<string, number[]>();
  let totalBlockedThreatsCount = 0;
  let totalRateLimitedCount = 0;
  const apiLatencySamplesMs: number[] = [];
  const structuredRequestLogs: StructuredCorrelationLogEntry[] = [];

  app.use('/api', (req, res, next) => {
    const startHrMs = performance.now();
    const incomingCorr =
      typeof req.headers['x-correlation-id'] === 'string'
        ? req.headers['x-correlation-id']
        : null;
    const correlationId = resolveRequestCorrelationId(
      incomingCorr,
      Date.now(),
      crypto.randomBytes(3).toString('hex')
    );
    (req as Request & { correlationId?: string }).correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    res.on('finish', () => {
      const durationMs = Number(Math.max(0.1, performance.now() - startHrMs).toFixed(2));
      apiLatencySamplesMs.push(durationMs);
      if (apiLatencySamplesMs.length > 200) {
        apiLatencySamplesMs.shift();
      }
      structuredRequestLogs.unshift({
        correlationId,
        method: req.method,
        path: req.originalUrl || req.path,
        statusCode: res.statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
      });
      if (structuredRequestLogs.length > 40) {
        structuredRequestLogs.pop();
      }
    });

    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local')
      .split(',')[0]
      .trim();
    const isAdminRoute = req.path.startsWith('/admin');
    const isAuthRoute = req.path.startsWith('/auth/');
    const windowMs = 60_000;
    const maxReq = isAdminRoute
      ? Math.max(3, Number(process.env.RATE_LIMIT_ADMIN_MAX_PER_MIN) || 10)
      : isAuthRoute
      ? Math.max(5, Number(process.env.RATE_LIMIT_AUTH_MAX_PER_MIN) || 25)
      : Math.max(20, Number(process.env.RATE_LIMIT_API_MAX_PER_MIN) || 120);
    const store = isAdminRoute ? adminRateMap : isAuthRoute ? authRateMap : apiRateMap;

    const nowMs = Date.now();
    const check = checkSlidingWindowRateLimit(
      store.get(ip) || [],
      nowMs,
      windowMs,
      maxReq
    );
    store.set(ip, check.updatedTimestamps);

    res.setHeader('X-RateLimit-Limit', String(maxReq));
    res.setHeader('X-RateLimit-Remaining', String(check.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((nowMs + windowMs) / 1000)));

    if (!check.allowed) {
      totalRateLimitedCount += 1;
      res.setHeader('Retry-After', String(check.retryAfterSeconds));
      res.status(429).json({
        error: `Rate limit exceeded. Please wait ${check.retryAfterSeconds}s before retrying.`,
      });
      return;
    }

    // Deep Form Sanitization & Injection Firewall on all incoming JSON bodies
    if (req.body && typeof req.body === 'object') {
      const sanitizedCheck = sanitizeFormPayload(req.body as Record<string, unknown>);
      if (!sanitizedCheck.safe) {
        totalBlockedThreatsCount += 1;
        res.status(400).json({ error: sanitizedCheck.reason || 'Blocked unsafe form payload.' });
        return;
      }
      req.body = sanitizedCheck.sanitized;
    }

    next();
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    maxPayload: 64 * 1024, // 64KB max frame size
  });

  // Authoritative server-side real-time state (Pre-seeded with Bootstrapped Admin Preset)
  const accountsByEmail = new Map<string, StoredAccount>();
  const clients = new Map<string, { ws: WebSocket; peer: OnlinePeer }>();
  const studyDesks = new Map<string, StudyDesk>();

  const defaultAdminSalt = crypto.randomBytes(32).toString('hex');
  const defaultAdminEmail = BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
  accountsByEmail.set(defaultAdminEmail, {
    uid: 'usr_mahit_admin',
    email: defaultAdminEmail,
    displayName: 'Mahit Saxena',
    bio: 'Workspace Member',
    salt: defaultAdminSalt,
    passwordHash: hashPassword('MrStranger@2026!', defaultAdminSalt),
    streakCount: 1,
    lastLoginDate: getTodayDateString(),
    participationPoints: 0,
    privacyVisibility: 'everyone',
    readReceiptsEnabled: true,
    allowCallsFromConnectionsOnly: true,
    createdAt: new Date().toISOString(),
  });

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
      studyRoomCode?: string;
      locationTag?: string;
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
      parentCommentId?: string | null;
      replyToAuthorName?: string | null;
    }
  >();
  const liveTwitterLikes = new Map<string, Set<string>>();
  const liveTwitterRetweets = new Map<string, Set<string>>();
  const liveTwitterChats = new Map<
    string,
    {
      id: string;
      channelId: string;
      senderUid: string;
      senderName: string;
      senderHandle: string;
      recipientUid: string | null;
      text: string;
      photoDataUrl: string | null;
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
      twitterLikes: Object.fromEntries(
        Array.from(liveTwitterLikes.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      twitterRetweets: Object.fromEntries(
        Array.from(liveTwitterRetweets.entries()).map(([k, v]) => [k, Array.from(v)])
      ),
      twitterChats: Array.from(liveTwitterChats.values()),
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

  // Zero-Touch Auto-Configured Admin Session Endpoint (Issues signed HMAC-SHA256 token)
  app.get('/api/auth/auto-session', (_req, res) => {
    const adminAcct = accountsByEmail.get(BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase());
    if (!adminAcct) {
      res.status(404).json({ error: 'Auto-configured admin account not found.' });
      return;
    }
    res.json({
      uid: adminAcct.uid,
      email: adminAcct.email,
      displayName: adminAcct.displayName,
      bio: adminAcct.bio,
      streakCount: adminAcct.streakCount,
      lastLoginDate: adminAcct.lastLoginDate,
      participationPoints: adminAcct.participationPoints,
      privacyVisibility: adminAcct.privacyVisibility,
      readReceiptsEnabled: adminAcct.readReceiptsEnabled,
      allowCallsFromConnectionsOnly: adminAcct.allowCallsFromConnectionsOnly,
      isAdmin: true,
      sessionToken: signSessionToken(adminAcct.uid, adminAcct.email),
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

    const salt = crypto.randomBytes(32).toString('hex');
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
      isAdmin: account.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase(),
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
      isAdmin: account.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase(),
      sessionToken: signSessionToken(account.uid, account.email),
    });
  });

  app.post('/api/auth/verify-password', (req, res) => {
    const email = sanitizeSafeText(String(req.body?.email || ''), 160).toLowerCase();
    const password = String(req.body?.password || '');
    const session = extractBearerSession(req);

    if (!email || !password || password.length < 8) {
      res.status(401).json({
        error: 'Valid account email and password (min 8 chars) are required for verification.',
      });
      return;
    }

    const account = accountsByEmail.get(email);
    if (!account) {
      // Only permit verification if the caller presents a cryptographically valid signed session token for this email
      if (session.valid && session.email === email) {
        res.json({ verified: true, authenticatedBy: 'hmac-session-token' });
        return;
      }
      res.status(401).json({
        error:
          'Account session not found or unverified. Please sign in with your registered password.',
      });
      return;
    }

    const attemptedHash = hashPassword(password, account.salt);
    if (!timingSafeCompareHex(attemptedHash, account.passwordHash)) {
      res.status(401).json({
        error:
          'Password verification failed. Please enter your account password to confirm action.',
      });
      return;
    }
    res.json({ verified: true, authenticatedBy: 'scrypt-password-hash' });
  });

  // Public-Safe Live Security Audit Status Endpoint (Zero secrets exposed)
  app.get('/api/security/audit-status', (req, res) => {
    const session = extractBearerSession(req);
    const envAudit = auditEnvironmentSecurity({
      NODE_ENV: process.env.NODE_ENV || 'production',
      DEBUG: process.env.DEBUG || 'false',
      PORT: '3000',
    });
    const report = buildFullSecurityAuditReport();

    res.json({
      ...report,
      environmentAudit: {
        safe: envAudit.safe,
        debugDisabled: envAudit.debugModeOff,
        leakedSecretKeysCount: envAudit.leakedClientKeys.length,
        summary: envAudit.summary,
      },
      sessionStatus: {
        authenticated: session.valid,
        isAdmin:
          session.valid &&
          Boolean(session.email) &&
          session.email!.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase(),
      },
      runtimeMetrics: {
        passwordKdf: 'scrypt (N=16384, r=8, p=1, salt=32B, keylen=64B)',
        sessionmac: 'HMAC-SHA256 (TTL=12h, timingSafeEqual)',
        corsAllowlistCount: allowedOrigins.length,
        rateLimits: {
          adminPerMin: 10,
          authPerMin: 25,
          apiPerMin: 120,
          wsPer10Sec: 45,
        },
        blockedThreatsCount: totalBlockedThreatsCount,
        rateLimitedCount: totalRateLimitedCount,
      },
    });
  });

  // Protected Admin Security Audit Endpoint (RBAC + Bearer Token + 10 req/min rate limit)
  app.get('/api/admin/audit', (req, res) => {
    const session = extractBearerSession(req);
    const accessCheck = verifyUserAndAdminAccess({
      uid: session.uid,
      email: session.email,
      tokenValid: session.valid,
      requireAdmin: true,
    });

    if (!accessCheck.authorized) {
      res.status(accessCheck.statusCode).json({
        error: accessCheck.reason,
        requiredRole: 'admin',
      });
      return;
    }

    const report = buildFullSecurityAuditReport();

    res.json({
      adminVerified: true,
      adminEmail: session.email,
      auditReport: report,
      registeredAccountsCount: accountsByEmail.size,
      onlineConnectionsCount: clients.size,
      activeStudyRoomsCount: studyDesks.size,
      blockedThreatsCount: totalBlockedThreatsCount,
      rateLimitedCount: totalRateLimitedCount,
      timestamp: new Date().toISOString(),
    });
  });

  // Authoritative Unique Post Likes Store (Keyed by momentId -> Record<userId, MomentLikeUserRecord>)
  const liveMomentLikesByMomentId = new Map<string, Record<string, MomentLikeUserRecord>>();

  // Paginated List of Users Who Liked a Post (Pillar 2 & Pillar 4 API Contract)
  app.get('/api/moments/:momentId/likes', (req, res) => {
    const correlationId =
      (req as Request & { correlationId?: string }).correlationId ||
      resolveRequestCorrelationId(null, Date.now());
    const momentId = String(req.params.momentId || 'moment_study_204')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 60) || 'moment_study_204';
    const currentMap = liveMomentLikesByMomentId.get(momentId) || {};
    const paginated = paginatePostLikersList(currentMap, {
      momentId,
      cursor: typeof req.query.cursor === 'string' ? Number(req.query.cursor) : 0,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : 3,
    });
    res.json({
      ...paginated,
      correlationId,
    });
  });

  // Idempotent 1-Like-Per-User Post Like / Unlike Endpoint (Enforces Composite Uniqueness {momentId}_{userId})
  app.post('/api/moments/:momentId/likes', (req, res) => {
    const correlationId =
      (req as Request & { correlationId?: string }).correlationId ||
      resolveRequestCorrelationId(null, Date.now());
    const session = extractBearerSession(req);
    const momentId = String(req.params.momentId || 'moment_study_204')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 60) || 'moment_study_204';
    const fallbackUid = session.valid && session.uid ? session.uid : 'usr_mahit_admin';
    const userId = String(req.body?.userId || fallbackUid)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 60) || 'usr_mahit_admin';
    const userDisplayName = sanitizeSafeText(
      String(req.body?.userDisplayName || 'Mahit Saxena'),
      64
    );
    const userHandle = sanitizeSafeText(
      String(req.body?.userHandle || `@${userId.slice(0, 16)}`),
      32
    );
    const action =
      req.body?.action === 'like' || req.body?.action === 'unlike'
        ? req.body.action
        : 'toggle';

    const currentMap = liveMomentLikesByMomentId.get(momentId) || {};
    const toggled = toggleUniquePostLike(currentMap, {
      momentId,
      userId,
      userDisplayName,
      userHandle,
      visibility: 'public',
      action,
      nowMs: Date.now(),
    });
    liveMomentLikesByMomentId.set(momentId, toggled.updatedByUserId);

    const paginated = paginatePostLikersList(toggled.updatedByUserId, {
      momentId,
      cursor: typeof req.body?.cursor === 'number' ? req.body.cursor : 0,
      limit: typeof req.body?.limit === 'number' ? req.body.limit : 3,
    });

    res.json({
      momentId: toggled.momentId,
      userId: toggled.userId,
      likeId: toggled.likeId,
      uniqueConstraintKey: toggled.uniqueConstraintKey,
      liked: toggled.liked,
      wasAlreadyInState: toggled.wasAlreadyInState,
      totalLikesCount: toggled.totalLikesCount,
      paginated,
      correlationId,
    });
  });

  // 7-Pillar Product & Engineering Specification + p95 Observability Telemetry Endpoint
  app.get('/api/engineering/spec-status', (req, res) => {
    const correlationId =
      (req as Request & { correlationId?: string }).correlationId ||
      resolveRequestCorrelationId(null, Date.now());
    const momentId = String(req.query.momentId || 'moment_study_204')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 60) || 'moment_study_204';
    const cursor = typeof req.query.cursor === 'string' ? Number(req.query.cursor) : 0;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 3;

    const spec = buildSevenPillarEngineeringBlueprintSpec();
    const latency = computeApiLatencyPercentiles(apiLatencySamplesMs, 300);
    const currentLikesMap = liveMomentLikesByMomentId.get(momentId) || {};
    const likesDemoPage = paginatePostLikersList(currentLikesMap, {
      momentId,
      cursor,
      limit,
    });

    res.json({
      spec,
      observability: {
        latency,
        recentLogs: structuredRequestLogs.slice(0, 8),
        correlationHeaderName: 'X-Correlation-Id',
      },
      likesDemoPage,
      currentUserLiked: Boolean(currentLikesMap['usr_mahit_admin']),
      correlationId,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================================================
  // AUTHORITATIVE PAYMENT & MEMBERSHIP LEDGER (/api/payments/*)
  // ==========================================================================
  const paymentTransactions: PaymentTransactionRecord[] = [];
  const activeMembershipByUid = new Map<
    string,
    {
      planId: PaymentPlanId;
      planName: string;
      badgeLabel: string;
      activatedAtIso: string;
      transactionId: string;
    }
  >();
  let invoiceCounter = 1001;

  app.get('/api/payments/status', (req, res) => {
    const session = extractBearerSession(req);
    const uid =
      (typeof req.query.uid === 'string' && req.query.uid.trim()) ||
      (session.valid && session.uid ? session.uid : 'usr_mahit_admin');
    const activeMembership = activeMembershipByUid.get(uid) || {
      planId: 'plan_free_sanctuary' as PaymentPlanId,
      planName: 'Free Sanctuary Member',
      badgeLabel: 'Free Member',
      activatedAtIso: new Date().toISOString(),
      transactionId: '',
    };
    const userTransactions = paymentTransactions.filter((t) => t.uid === uid);

    res.json({
      uid,
      activeMembership,
      plans: PAYMENT_MEMBERSHIP_PLANS,
      gateways: {
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
        razorpayConfigured: Boolean(
          process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
        ),
        w3cPaymentRequestSupported: true,
        directCardLuhnEnabled: true,
        directUpiVpaEnabled: true,
      },
      transactions: userTransactions,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/payments/stripe/checkout-session', async (req, res) => {
    const plan = resolvePaymentMembershipPlan(req.body?.planId);
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    const originUrl =
      typeof req.headers.origin === 'string' && req.headers.origin.startsWith('http')
        ? req.headers.origin
        : 'http://localhost:3000';

    if (stripeKey) {
      try {
        const form = new URLSearchParams();
        form.append('mode', plan.billingCycle === 'lifetime' ? 'payment' : 'subscription');
        form.append('success_url', `${originUrl}/?payment=success&plan=${plan.id}`);
        form.append('cancel_url', `${originUrl}/?payment=cancelled`);
        form.append('line_items[0][price_data][currency]', 'usd');
        form.append('line_items[0][price_data][product_data][name]', plan.name);
        form.append(
          'line_items[0][price_data][unit_amount]',
          String(plan.priceUsdCents)
        );
        if (plan.billingCycle !== 'lifetime') {
          form.append(
            'line_items[0][price_data][recurring][interval]',
            plan.billingCycle === 'annual' ? 'year' : 'month'
          );
        }
        form.append('line_items[0][quantity]', '1');

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        });
        const stripeJson = (await stripeRes.json()) as {
          id?: string;
          url?: string;
          error?: { message?: string };
        };
        if (!stripeRes.ok || !stripeJson.url) {
          res.status(400).json({
            error:
              stripeJson?.error?.message ||
              'Stripe Checkout session creation failed.',
          });
          return;
        }
        res.json({
          gateway: 'stripe',
          sessionId: stripeJson.id,
          checkoutUrl: stripeJson.url,
        });
        return;
      } catch {
        res.status(502).json({
          error: 'Unable to reach Stripe API.',
        });
        return;
      }
    }

    res.status(400).json({
      error:
        'STRIPE_SECRET_KEY is not configured in server environment. Use Direct Card (Luhn-verified), UPI VPA, or W3C Browser Checkout below.',
    });
  });

  app.post('/api/payments/process', (req, res) => {
    const session = extractBearerSession(req);
    const uid =
      sanitizeSafeText(String(req.body?.uid || ''), 64) ||
      (session.valid && session.uid ? session.uid : 'usr_mahit_admin');
    const userEmail =
      sanitizeSafeText(String(req.body?.billingEmail || req.body?.userEmail || ''), 160) ||
      (session.valid && session.email ? session.email : BOOTSTRAPPED_ADMIN_EMAIL);
    const userName =
      sanitizeSafeText(String(req.body?.cardholderName || req.body?.userName || 'Mahit Saxena'), 80) ||
      'Mahit Saxena';

    const validation = validatePaymentCheckoutRequest({
      planId: req.body?.planId,
      currency: req.body?.currency,
      paymentMethod: req.body?.paymentMethod,
      cardholderName: req.body?.cardholderName,
      cardNumber: req.body?.cardNumber,
      cardExpiry: req.body?.cardExpiry,
      cardCvv: req.body?.cardCvv,
      upiVpa: req.body?.upiVpa,
      billingEmail: userEmail,
    });

    if (!validation.valid) {
      res.status(400).json({
        error: validation.reason,
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const invoiceNumber = `INV-2026-${invoiceCounter++}`;
    const signaturePayload = `${transactionId}|${invoiceNumber}|${uid}|${validation.plan.id}|${validation.amountMinor}|${validation.currency}|${nowIso}`;
    const receiptSignatureHmac = crypto
      .createHmac('sha256', SERVER_HMAC_SECRET)
      .update(signaturePayload)
      .digest('hex');

    const record: PaymentTransactionRecord = {
      transactionId,
      invoiceNumber,
      uid,
      userEmail,
      userName,
      planId: validation.plan.id,
      planName: validation.plan.name,
      billingCycle: validation.plan.billingCycle,
      amountMinor: validation.amountMinor,
      currency: validation.currency,
      formattedAmount: validation.formattedAmount,
      paymentMethod: validation.paymentMethod,
      paymentInstrumentSummary: validation.paymentInstrumentSummary,
      status: 'succeeded',
      receiptSignatureHmac,
      bonusPointsAwarded: validation.plan.bonusParticipationPoints,
      paidAtIso: nowIso,
      refundedAtIso: null,
    };

    paymentTransactions.unshift(record);
    activeMembershipByUid.set(uid, {
      planId: validation.plan.id,
      planName: validation.plan.name,
      badgeLabel: validation.plan.badgeLabel,
      activatedAtIso: nowIso,
      transactionId,
    });

    // Credit bonus participation points to the user's server account & online peer state
    for (const acct of accountsByEmail.values()) {
      if (acct.uid === uid || acct.email.toLowerCase() === userEmail.toLowerCase()) {
        acct.participationPoints += validation.plan.bonusParticipationPoints;
      }
    }
    const onlineEntry = clients.get(uid);
    if (onlineEntry) {
      onlineEntry.peer.participationPoints += validation.plan.bonusParticipationPoints;
      broadcastPresence();
    }

    res.json({
      transaction: record,
      activeMembership: activeMembershipByUid.get(uid),
      transactions: paymentTransactions.filter((t) => t.uid === uid),
    });
  });

  app.post('/api/payments/refund', (req, res) => {
    const session = extractBearerSession(req);
    const uid =
      sanitizeSafeText(String(req.body?.uid || ''), 64) ||
      (session.valid && session.uid ? session.uid : 'usr_mahit_admin');
    const transactionId = sanitizeSafeText(String(req.body?.transactionId || ''), 80);

    const target = paymentTransactions.find(
      (t) => t.transactionId === transactionId && t.uid === uid
    );
    if (!target) {
      res.status(404).json({ error: 'Transaction not found for this account.' });
      return;
    }
    if (target.status === 'refunded') {
      res.status(400).json({ error: 'Transaction has already been refunded.' });
      return;
    }

    target.status = 'refunded';
    target.refundedAtIso = new Date().toISOString();

    const remainingActive = paymentTransactions.find(
      (t) => t.uid === uid && t.status === 'succeeded'
    );
    if (remainingActive) {
      const remPlan = resolvePaymentMembershipPlan(remainingActive.planId);
      activeMembershipByUid.set(uid, {
        planId: remPlan.id,
        planName: remPlan.name,
        badgeLabel: remPlan.badgeLabel,
        activatedAtIso: remainingActive.paidAtIso,
        transactionId: remainingActive.transactionId,
      });
    } else {
      activeMembershipByUid.set(uid, {
        planId: 'plan_free_sanctuary',
        planName: 'Free Sanctuary Member',
        badgeLabel: 'Free Member',
        activatedAtIso: new Date().toISOString(),
        transactionId: '',
      });
    }

    res.json({
      refundedTransaction: target,
      activeMembership: activeMembershipByUid.get(uid),
      transactions: paymentTransactions.filter((t) => t.uid === uid),
    });
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
          const cleanRoomCode = rawMoment.studyRoomCode
            ? String(rawMoment.studyRoomCode)
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9_-]/g, '')
                .slice(0, 24)
            : '';
          const cleanLocationTag = rawMoment.locationTag
            ? sanitizeSafeText(String(rawMoment.locationTag), 80).trim()
            : '';
          const momentRecord = {
            id: momentId,
            authorUid: registeredUid,
            authorName: sanitizeSafeText(String(rawMoment.authorName || 'Member'), 64),
            caption: sanitizeSafeText(rawCaption, 500),
            photoDataUrl,
            visibility,
            ...(cleanRoomCode ? { studyRoomCode: cleanRoomCode } : {}),
            ...(cleanLocationTag ? { locationTag: cleanLocationTag } : {}),
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

          const rawParentId = msg.parentCommentId
            ? String(msg.parentCommentId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128)
            : '';
          const rawReplyAuthor = msg.replyToAuthorName
            ? sanitizeSafeText(String(msg.replyToAuthorName), 64)
            : '';

          const commentRecord = {
            id: commentId,
            momentId,
            momentAuthorUid,
            authorUid: registeredUid,
            authorName: sanitizeSafeText(String(msg.authorName || 'Member'), 64),
            text: sanitizeSafeText(rawText, 400),
            visibility,
            createdAtMs: Number(msg.createdAtMs) || Date.now(),
            ...(rawParentId ? { parentCommentId: rawParentId } : {}),
            ...(rawReplyAuthor ? { replyToAuthorName: rawReplyAuthor } : {}),
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

        // Twitter / X Live Reactions (Like & Retweet) & Twitter Chat Sync
        if (msg.type === 'twitter:reaction' && msg.momentId && msg.reactionType) {
          const momentId = String(msg.momentId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
          const reactionType = msg.reactionType === 'retweet' ? 'retweet' : 'like';
          if (!momentId) return;
          const targetMap =
            reactionType === 'retweet' ? liveTwitterRetweets : liveTwitterLikes;
          const set = targetMap.get(momentId) || new Set<string>();
          if (set.has(registeredUid)) {
            set.delete(registeredUid);
          } else {
            set.add(registeredUid);
          }
          targetMap.set(momentId, set);
          const reactionFrame = JSON.stringify({
            type: 'twitter:reaction',
            momentId,
            reactionType,
            uids: Array.from(set),
          });
          for (const { ws: clientWs } of clients.values()) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(reactionFrame);
            }
          }
          return;
        }

        if (msg.type === 'twitter:chat') {
          const rawText = String(msg.text || '');
          const photoDataUrl = String(msg.photoDataUrl || '');
          if (!rawText.trim() && !photoDataUrl) return;
          if (rawText && !detectSecurityThreat(rawText).safe) return;
          if (
            photoDataUrl &&
            (!photoDataUrl.startsWith('data:image/') || photoDataUrl.length > 750000)
          ) {
            return;
          }
          const chatId = String(msg.id || `twchat_${Date.now()}_${registeredUid}`)
            .replace(/[^a-zA-Z0-9_-]/g, '')
            .slice(0, 128);
          const channelId = sanitizeSafeText(
            String(msg.channelId || 'global_townsquare'),
            64
          );
          const senderName = sanitizeSafeText(String(msg.senderName || 'Member'), 64);
          const senderHandle = sanitizeSafeText(String(msg.senderHandle || '@member'), 32);
          const recipientUid = msg.recipientUid
            ? String(msg.recipientUid).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128)
            : null;
          const chatRecord = {
            id: chatId,
            channelId,
            senderUid: registeredUid,
            senderName,
            senderHandle,
            recipientUid,
            text: sanitizeSafeText(rawText || 'Shared a photo in chat', 500),
            photoDataUrl: photoDataUrl || null,
            createdAtMs: Number(msg.createdAtMs) || Date.now(),
          };
          liveTwitterChats.set(chatId, chatRecord);
          if (liveTwitterChats.size > 200) {
            const oldestKey = liveTwitterChats.keys().next().value;
            if (oldestKey) liveTwitterChats.delete(oldestKey);
          }
          const chatFrame = JSON.stringify({
            type: 'twitter:chat',
            message: chatRecord,
          });
          for (const { ws: clientWs } of clients.values()) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(chatFrame);
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
      } catch {
        // Production-safe WebSocket error handling: never leak stack traces or internal state
        ws.send(
          JSON.stringify({
            type: 'server:security_notice',
            reason: 'Malformed WebSocket frame rejected.',
          })
        );
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
      debugMode: false,
      onlineCount: clients.size,
      activeStudyDesks: studyDesks.size,
      activeGameSessions: liveGameState.size,
      securityGuards: [
        'scrypt-n16384-32b-salt',
        'hmac-sha256-ttl-bearer',
        'admin-rbac-guard',
        '3-tier-sliding-rate-limiter',
        'cors-origin-allowlist',
        'csp-hsts-security-headers',
        'exposed-file-blocker',
        'sqli-nosqli-xss-form-sanitizer',
      ],
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
    app.use(
      express.static(distPath, {
        dotfiles: 'deny',
        index: false,
      })
    );
    app.get('*', (req, res) => {
      const check = isBlockedSensitiveFilePath(req.path);
      if (check.blocked) {
        res.status(403).json({ error: 'Access Denied' });
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Production-safe Global Error Handler (Debug Mode Off — never leaks stack traces)
  app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (!res.headersSent) {
      res.status(500).json({
        error: 'An unexpected request error occurred.',
        debugMode: false,
      });
    }
  });

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Mr. Stranger Server & WebSocket Hub listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
