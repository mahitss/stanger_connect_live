# 2. Detailed Feature Requirements

## 2.1 Logical Module Breakdown

The application is partitioned into 8 cohesive domain modules:

1. **Module A — Authentication & Identity Vault (`auth`)**: Registration, login, Google OAuth, HMAC-SHA256 bearer sessions, password verification, and split-collection PII isolation (`/profiles/{userId}` vs. `/privateAccounts/{userId}`).
2. **Module B — Online Presence & Mood Directory (`directory`)**: Real-time WebSocket presence (`peer:announce`), privacy visibility modes (`everyone`, `connections_only`, `ghost`), and 24-hour mood trend aggregation.
3. **Module C — Social Feed, Moments & Unique Likes (`moments`)**: Photo Moment publishing, curated study placeholders, nested comment threads, and database-enforced unique likes with paginated liker lists.
4. **Module D — Invite-First Messaging & WebRTC Calling (`comms`)**: Connection request state machine (`pending → accepted | declined` with terminal state locking), direct messaging, and WebRTC audio/video signaling.
5. **Module E — Study Room, Pomodoro & Analytics (`study`)**: Shareable room codes (`STUDY-204`), Pomodoro desk controller, procedural ambient soundscapes, and 7-day / 30-day D3 & Recharts visualizations.
6. **Module F — QR Room Scanner & Onboarding Tutorial (`qr_scanner`)**: Live camera/frame QR detection (`jsQR`), custom audio chime & hardware vibration pulse, inline category tagging, and the 4-step translucent spotlight tutorial overlay.
7. **Module G — Multiplayer Break Arcade (`arcade`)**: Subway Runner, Angry Catapult, and Block Arena with live WebSocket score broadcasting (`game:update`).
8. **Module H — Notifications, Streaks & Security Center (`security_ops`)**: Acoustic WebAudio chimes, daily streak freeze inventory, 16-control OWASP ASVS security audit, and live observability telemetry.

---

## 2.2 Explicit Deterministic Feature Specifications

### Specification 2.2.1 — Post Likes Uniqueness & Liker Pagination

- **Actor**: Authenticated user (`session.valid === true` or verified account identity).
- **Behavior**:
  1. An authenticated user can **like** or **unlike** a Moment post (`momentId`) at most once.
  2. **Database-Level Uniqueness Enforcement**:
     - In Firestore (`/momentLikes/{likeId}`), the document ID is deterministically constrained by security rules to `likeId == incoming().momentId + '_' + request.auth.uid`.
     - In the real-time server store (`liveMomentLikes` map), likes are keyed by `momentId -> Map<userId, MomentLikeRecord>`, guaranteeing O(1) uniqueness per `(momentId, userId)` pair.
  3. **Idempotent Toggle & Explicit Action Support**:
     - `POST /api/moments/:momentId/likes` accepts `{ action?: 'like' | 'unlike' | 'toggle', userId, userDisplayName, userHandle }`.
     - Calling with `action: 'like'` when already liked is a no-op that returns the existing record without incrementing the count.
     - Calling with `action: 'unlike'` removes the composite record `${momentId}_${userId}` and decrements the count.
  4. **Deterministic Cursor/Offset Pagination of Users Who Liked the Post**:
     - `GET /api/moments/:momentId/likes?cursor=<offset>&limit=<pageSize>` returns a deterministic page of users who liked `momentId`, sorted by `createdAtMs DESC, userId ASC`.
     - `limit` is clamped to `1..50` (default `5`).
     - Response schema includes `items`, `totalCount`, `limit`, `cursor`, `nextCursor`, `prevCursor`, `hasMore`, `uniqueConstraintEnforced: true`, and `correlationId`.

### Specification 2.2.2 — Connection Request Terminal State Machine

- **Rule**: A connection request (`/requests/{requestId}`) is created with `status: 'pending'` by `fromUid == request.auth.uid` where `fromUid != toUid`.
- **Transition**: Only the recipient (`toUid == request.auth.uid`) may transition a `pending` request to `accepted` or `declined`.
- **Terminal Locking**: Once `status` is `accepted` or `declined`, any further `update` operation is rejected at both the Firestore security rule layer and the server WebSocket handler.

### Specification 2.2.3 — Interactive 4-Step QR Scanner Onboarding

- **New-User Trigger**: Automatically activates on Step 1 when `localStorage.getItem('mr_stranger_qr_scanner_tutorial_completed_v1') !== '1'`, or when `?qrTutorial=1` is present in the URL.
- **Spotlight Ring**: Applies a translucent emerald ring (`bg-[#5B8C6B]/20 ring-2 ring-[#5B8C6B]/70`) over `#workspace-header-qr-camera-scan-btn` and synchronizes step highlights across `#workspace-header-qr-scan-camera-btn`, `#workspace-header-qr-simulate-detect-btn`, and `#workspace-header-qr-viewport-scan-entries`.
