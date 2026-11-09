# 1. Product Discovery & Scope

## 1.1 Vision & Audience

- **Product Vision**: Build a calm, high-trust digital study sanctuary and real-time social workspace (**Mr. Stranger**) where scholars, engineers, and remote knowledge workers co-focus in live rooms, connect on an invite-first basis, share verified study milestones, and recharge with lightweight multiplayer break games.
- **Target Audience**:
  - University students and researchers preparing for deep-focus exams or thesis sprints.
  - Remote software engineers, designers, and independent builders seeking structured Pomodoro accountability without noisy social feeds.
  - Distributed study groups that coordinate across desktop and mobile devices via instant QR room codes.
- **Core Problem**: Traditional social networks maximize distraction and unsolicited messaging, while standalone timer utilities lack live human presence, peer accountability, and frictionless room handoff between desktop and mobile.
- **Main Value Proposition**: A unified **Quiet Study Sanctuary** combining live presence directories, invite-first E2EE-fingerprinted messaging and WebRTC calling, shared Pomodoro study rooms with ambient WebAudio soundscapes, QR room joining with interactive onboarding, and short break-time multiplayer arcade games.
- **Business Model**:
  - **Free Sanctuary Tier**: Unlimited public Study Rooms (`STUDY-204`), daily Pomodoro tracking, QR room scanner, public Moments feed, and 3 multiplayer break games.
  - **Pro Scholar & Team Guilds Tier**: Persistent custom private study rooms, Streak Freeze inventory vaults, extended 30-day cohort analytics exports, and verified guild badges.

---

## 1.2 Explicit MVP Scope (Minimum Complete Product)

To guarantee zero unimplemented buttons and 100% end-to-end vertical slices, features are partitioned into **MVP (Implemented & Verified)** vs. **Post-MVP Roadmap**:

| Capability Area | MVP Scope (Minimum Complete Product — Active in Production) | Post-MVP Scope (Future Expansion) |
| :--- | :--- | :--- |
| **Authentication & Identity** | Zero-touch auto-configured session, Email + Password registration/login (`scrypt` + `HMAC-SHA256`), Google OAuth (`signInWithPopup`), isolated `/privateAccounts/{userId}` PII vault | Hardware WebAuthn passkeys, enterprise SAML SSO |
| **Presence & Connections** | Live WebSocket Online Directory, 5 mood presets with 24h popularity analytics, invite-first `pending → accepted/declined` connection requests | Calendar-synced automatic status schedules |
| **Messaging & Calling** | Invite-gated direct messaging (`/messages/{messageId}`), WebRTC peer-to-peer audio/video calling in Talking Mode | Multi-party SFU video rooms (>8 concurrent speakers) |
| **Study Room & Pomodoro** | Synchronized Pomodoro timer (15/25/45/60m), procedural WebAudio ambient soundscapes, QR room scanner with 4-step interactive tutorial, D3/Recharts focus analytics | Native desktop OS menu-bar companion widget |
| **Social Feed & Moments** | Photo Moments feed (`/moments/{momentId}`), nested threaded comments (`/momentComments/{commentId}`), idempotent 1-like-per-user uniqueness (`/momentLikes/{likeId}`) with cursor pagination | Short-form vertical video reels |
| **Break Arcade** | 3 real-time HTML5 Canvas games (Subway Runner, Angry Catapult, Block Arena) with live WebSocket scoreboards | Custom level editors and seasonal tournament brackets |
