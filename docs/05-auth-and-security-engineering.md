# 5. Authentication, Authorization & Security Engineering

## 5.1 Identity & Permissions Separation

Authentication (verifying *who* the caller is) is strictly separated from Authorization (verifying *what* resources and actions the caller is permitted to access):

1. **Authentication Layer**:
   - **Firebase Authentication**: Google OAuth (`signInWithPopup`) with `request.auth.token.email_verified == true` verification.
   - **Credential Authentication**: Email + Password hashed via `crypto.scryptSync` (`N=16384, r=8, p=1, maxmem=32MB`, 32-byte CSPRNG salt, 64-byte key length) and verified using constant-time `crypto.timingSafeEqual`.
   - **Stateless Bearer Sessions**: Signed `HMAC-SHA256` tokens (`<base64url(payload)>.<hexSignature>`) with a bounded 12-hour TTL (`SESSION_TTL_MS`).
2. **Server-Side & Database Authorization Layer**:
   - **Role-Based Access Control (RBAC)**: Admin routes (`/api/admin/audit`) and `/admins/{adminId}` verify both token authenticity and explicit admin membership (`verifyUserAndAdminAccess` / `isAdmin()`).
   - **Resource Ownership & Relational Guards**:
     - Direct messages (`chat:direct`) and WebRTC calls (`webrtc:signal`) verify that `acceptedPairKeys` contains the sorted composite pair `uidA::uidB`.
     - Moment deletion (`moment:delete`) verifies `existing.authorUid === registeredUid`.
     - Post like creation/deletion (`/momentLikes/{likeId}`) enforces `userId == request.auth.uid` and `likeId == incoming().momentId + '_' + request.auth.uid`.

---

## 5.2 OWASP ASVS Security Baselines

| OWASP ASVS Area | Implemented Control | Verification Mechanism |
| :--- | :--- | :--- |
| **V2: Authentication & KDF** | Memory-hard `scrypt` (`N=16384, r=8, p=1`, 32B salt) + `crypto.timingSafeEqual` digest comparison | Unit test + `/api/security/audit-status` |
| **V3: Session Management** | `HMAC-SHA256` signed bearer tokens with 12h TTL expiration and tamper-proof signature check | Unit test + `/api/auth/verify-password` |
| **V4: Access Control (RBAC & IDOR)** | Default-deny Firestore catch-all, composite key uniqueness on `/momentLikes/{likeId}`, server RBAC guard on `/api/admin/audit` | `firestore.rules.test.ts` + RBAC probe |
| **V5: Validation, Sanitization & Encoding** | `sanitizeFormPayload` & `detectSecurityThreat` block `<script>`, `javascript:`, event handlers, SQLi (`UNION SELECT`), and NoSQLi (`$where`, `$gt`, `__proto__`) | Interactive Firewall Tester + unit tests |
| **V8: Data Protection & PII Isolation** | Split collection architecture isolating email & E2EE fingerprint inside `/privateAccounts/{userId}` (`allow list: if false`) | `firestore.rules.test.ts` |
| **V12: Secure File & Media Uploads** | Strict `data:image/` MIME prefix verification and `<= 650KB` (`650,000` chars) payload ceiling on Moment photos | Firestore rule `isValidMomentPost` + server check |
| **V13 & V14: API Rate Limiting, CORS & Headers** | 3-tier HTTP sliding-window rate limiter (10 Admin/min, 25 Auth/min, 120 API/min), 45 WS frames/10s, strict CORS allowlist, CSP, HSTS, `X-Frame-Options`, sensitive file blocker (`/.env`, `/server.ts`, `/*.map`) | 16-control Enterprise Security Audit |
