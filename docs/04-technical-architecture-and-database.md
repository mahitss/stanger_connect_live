# 4. Technical Architecture & Database Design

## 4.1 Tech Stack & Folder Structure

- **Frontend Framework**: React 19 + TypeScript 7 + Vite 8 + Tailwind CSS 4 + Motion + D3.js + Recharts + Three.js (`WebGLRenderer`).
- **Backend Runtime**: Node.js + Express 4 (`server.ts`) + `ws` WebSocket Server (`/ws`) mounted on port `3000`.
- **Database & Persistence Layer**: Firebase Firestore Enterprise Edition (`firebase-blueprint.json` + `firestore.rules`) + Server-Authoritative Real-Time Memory State.
- **Directory Structure**:
  - `/docs/` — Single-source-of-truth 7-pillar engineering specifications.
  - `/src/App.tsx` — Primary workspace shell, state orchestration, and real-time sync.
  - `/src/components/` — Modular domain views (`StudyRoomView`, `TalkingRoomView`, `GameArcadeView`, `TwitterSocialSection`, `GlassArchitectureShowcase`, D3/Recharts analytics cards).
  - `/src/utils/rules.ts` & `/src/utils/rules.test.ts` — Pure deterministic business logic, security validators, pagination engines, and 130+ unit tests.
  - `/server.ts` — Express REST API, WebSocket real-time hub, rate limiters, correlation ID telemetry, and RBAC guards.
  - `/firestore.rules` & `/firestore.rules.test.ts` — Zero-Trust Firestore security rules and Dirty Dozen test suite.

---

## 4.2 Strict REST API Contracts

All `/api/*` endpoints return `Content-Type: application/json`, attach `X-Correlation-Id` and `X-Response-Time-Ms` headers, and enforce sliding-window rate limits (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).

| Method & Path | Auth Rule | Rate Limit | Request Schema | Response Schema (`200 OK`) | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/auth/auto-session` | Public bootstrap | 25 / min | None | `{ uid, email, displayName, streakCount, participationPoints, isAdmin, sessionToken }` | `404`, `429` |
| `POST /api/auth/register` | Public | 25 / min | `{ email, password, displayName, bio? }` | `{ uid, email, displayName, sessionToken, isAdmin }` | `400`, `409`, `429` |
| `POST /api/auth/login` | Public | 25 / min | `{ email, password }` | `{ uid, email, displayName, sessionToken, isAdmin }` | `401`, `429` |
| `POST /api/moments/:momentId/likes` | Authenticated User | 120 / min | `{ action?: 'like' \| 'unlike' \| 'toggle', userId, userDisplayName, userHandle }` | `{ momentId, liked, likeId, totalLikesCount, uniqueConstraintKey, correlationId }` | `400`, `401`, `429` |
| `GET /api/moments/:momentId/likes` | Public / Signed-In | 120 / min | Query: `?cursor=0&limit=5` | `{ momentId, items: MomentLikeRecord[], totalCount, limit, cursor, nextCursor, hasMore, uniqueConstraintEnforced: true, correlationId }` | `400`, `429` |
| `GET /api/security/audit-status` | Public-Safe | 120 / min | Header: `Authorization?: Bearer <token>` | `{ scorePercent, passedControlsCount, totalControlsCount, environmentAudit, runtimeMetrics }` | `429` |
| `GET /api/admin/audit` | Admin RBAC (`Bearer`) | 10 / min | Header: `Authorization: Bearer <adminToken>` | `{ adminVerified: true, auditReport, registeredAccountsCount, onlineConnectionsCount }` | `401`, `403`, `429` |
| `GET /api/engineering/spec-status` | Public-Safe | 120 / min | Query: `?momentId=moment_study_204&limit=5` | `{ spec, observability: { latency, recentLogs }, likesDemoPage, correlationId }` | `429` |

---

## 4.3 Database Architecture & Entity Constraints

| Collection Path | Primary Key (`docId`) | Foreign / Relational Keys | Unique Constraints & Normalization | Security & Indexing Rule |
| :--- | :--- | :--- | :--- | :--- |
| `/profiles/{userId}` | `userId` (`uid`) | — | 3NF split from PII; no `email` stored in public profile | `userId == request.auth.uid`; indexed by `streakCount DESC` |
| `/privateAccounts/{userId}` | `userId` (`uid`) | `uid -> /profiles/{userId}` | 1:1 isolated PII vault (`email`, `e2eeFingerprint`) | Owner-only `get`/`create`/`update`; `list: if false` |
| `/requests/{requestId}` | `requestId` | `fromUid`, `toUid -> /profiles/{uid}` | `fromUid != toUid`; terminal state locking on `accepted`/`declined` | Indexed by `(toUid, status, createdAt DESC)` |
| `/messages/{messageId}` | `messageId` | `senderUid`, `receiverUid -> /profiles/{uid}` | Immutable after creation (`allow update, delete: if false`) | Indexed by `(senderUid, receiverUid, createdAt ASC)` |
| `/moments/{momentId}` | `momentId` | `authorUid -> /profiles/{uid}` | Bounded `caption <= 500`, `photoDataUrl <= 650KB` | Indexed by `(visibility, createdAt DESC)` |
| `/momentComments/{commentId}` | `commentId` | `momentId -> /moments/{momentId}` | Optional `parentCommentId` for nested threads | Indexed by `(momentId, createdAt ASC)` |
| `/momentLikes/{likeId}` | Composite `{momentId}_{userId}` | `momentId -> /moments/{momentId}`, `userId -> /profiles/{uid}` | **DB-Level Uniqueness**: `likeId == incoming().momentId + '_' + request.auth.uid` | Prevents duplicate likes per user; indexed by `(momentId, createdAt DESC)` |
| `/admins/{adminId}` | `adminId` (`uid`) | `uid -> /profiles/{uid}` | `role == 'admin'` | Readable/writable strictly by `isAdmin()` |
