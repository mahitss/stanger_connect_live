# Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants

1. **Identity Isolation (`profiles/{userId}`)**:
   - No PII (`email`, `phone`, `address`) is stored in `/profiles/{userId}`.
   - Document creation or update is strictly restricted to `request.auth.uid == userId` and `incoming().uid == request.auth.uid`.
   - `createdAt` is immutable on update; `updatedAt` must equal `request.time`.
2. **Connection Requests (`requests/{requestId}`)**:
   - Only a verified user (`fromUid == request.auth.uid`) can create a `pending` request, and `fromUid != toUid`.
   - Only `toUid == request.auth.uid` can update a `pending` request to `accepted` or `declined` (Terminal State Locking prevents updates once status is `accepted` or `declined`).
   - Queries (`list`) require `resource.data.fromUid == request.auth.uid || resource.data.toUid == request.auth.uid`.
3. **Direct Messages (`messages/{messageId}`)**:
   - Only `senderUid == request.auth.uid` can create a message, and `createdAt == request.time`.
   - Messages are immutable (no updates allowed).
   - Queries (`list`) and reads (`get`) require `resource.data.senderUid == request.auth.uid || resource.data.receiverUid == request.auth.uid`.
4. **Photo Moments (`moments/{momentId}`)**:
   - Only `authorUid == request.auth.uid` can create or delete their own moment post.
   - `photoDataUrl` is bounded to `<= 650000` characters, and `caption` is bounded to `1..500` characters.
5. **Study Room Notes (`studyNotes/{noteId}`)**:
   - Only `authorUid == request.auth.uid` can create or delete their own study note.
   - `focusMinutes` must be between `1` and `240`.

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, Integrity & State)

1. **Payload 1 (Identity Spoofing on Profile)**: User `user_A` attempts to create `/profiles/user_B` with `uid: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Shadow Field Injection on Profile)**: User `user_A` updates `/profiles/user_A` including an undeclared field `isAdmin: true`. -> `PERMISSION_DENIED`
3. **Payload 3 (Unverified Email Write)**: User `user_A` with `email_verified: false` attempts to create a moment post. -> `PERMISSION_DENIED`
4. **Payload 4 (Terminal State Unlock on Request)**: User `user_B` attempts to update a request whose status is already `accepted` back to `pending`. -> `PERMISSION_DENIED`
5. **Payload 5 (Unauthorized Request Acceptance)**: User `user_A` (the sender `fromUid`) attempts to update their own sent request to `status: "accepted"`. -> `PERMISSION_DENIED`
6. **Payload 6 (Denial-of-Wallet Oversized Caption)**: User `user_A` creates a moment with a 10,000-character caption (`maxLength: 500`). -> `PERMISSION_DENIED`
7. **Payload 7 (Message Spoofing)**: User `user_A` creates a message with `senderUid: "user_B"`. -> `PERMISSION_DENIED`
8. **Payload 8 (Unauthorized Message List Scraping)**: User `user_C` attempts to `get` or `list` a message between `user_A` and `user_B`. -> `PERMISSION_DENIED`
9. **Payload 9 (Timestamp Forgery)**: User `user_A` creates a profile with a forged past timestamp `createdAt` not matching `request.time`. -> `PERMISSION_DENIED`
10. **Payload 10 (Immortal Field Mutation)**: User `user_A` updates `/profiles/user_A` and mutates `createdAt`. -> `PERMISSION_DENIED`
11. **Payload 11 (Path ID Poisoning)**: User `user_A` attempts to create `/moments/invalid$id!with*spaces`. -> `PERMISSION_DENIED`
12. **Payload 12 (Value Poisoning on Study Note)**: User `user_A` creates a study note with `focusMinutes: 999999` or string type. -> `PERMISSION_DENIED`
