# Security Specification & Red-Team Audit — Loan Budget

## 1. Data Invariants
1. **Strict Ownership & Verified Email**: Every document under `/users/{userId}/loans/{loanId}` and `/users/{userId}/profile/{docId}` MUST belong exclusively to `request.auth.uid == userId` with `request.auth.token.email_verified == true` and `data.ownerId == request.auth.uid`.
2. **Global Default Deny**: Every unmatched path under `/databases/{database}/documents` MUST return `false` for all reads and writes.
3. **Path ID Poisoning Guard**: `userId`, `loanId`, and `docId` MUST satisfy `^[a-zA-Z0-9_\\-]+$` and length `1..128`.
4. **Schema, Key Allowlist, and Size Bounds**:
   - No ghost/shadow keys allowed (`keys().hasAll(...) && keys().hasOnly(...)`).
   - All strings have explicit `.size()` bounds; numeric amounts are finite positive numbers (`amount > 0`); `paidAmount` is `0 <= paidAmount <= amount`.
   - `createdAtServer` MUST equal `request.time` on create and remain immutable on update; `updatedAt` MUST equal `request.time` on create and update.
5. **Query Security Enforcement**: `allow list` on `/users/{userId}/loans`, `/users/{userId}/friends`, and `/chats` explicitly validates `resource.data` ownership/participation.
6. **PII-Free Handle Directory (`/usernames/{usernameLower}`)**: Stores ONLY public handle metadata (`uid`, `username`, `usernameLower`, `displayName`, `avatar`, `bio`, `updatedAt`) with ZERO email/phone/loan data. Supports exact `get` only (`isValidUsernameLower(usernameLower)`) for registration/profile uniqueness checks and friend handle lookup, while `allow list: if false` strictly prevents scraping.
7. **Chat Master Gate & Fixed-Size Array Guard (`/chats/{chatId}` & `/chats/{chatId}/messages/{messageId}`)**: Chat documents restrict `participantIds` to exact length `2` containing `participantA` and `participantB` (`participantA != participantB`). Every message read/write evaluates `get(/databases/$(database)/documents/chats/$(chatId)).data` to confirm caller membership and locks `senderId == request.auth.uid`.
8. **7-Day Username Cooldown Guard (`/users/{userId}/profile/{docId}`)**: Modifying an existing non-empty `profileUsername` requires `request.time >= existing().lastUsernameChangedAt + duration.value(7, 'd')` and stamps `lastUsernameChangedAt == request.time`. Non-username updates must leave `lastUsernameChangedAt` unchanged.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read/write** on `/users/uid1/loans/loan_1` or `/chats/u1_u2` -> Denied (`request.auth == null`).
2. **Unverified email write** (`email_verified: false`) -> Denied (`request.auth.token.email_verified == true` fails).
3. **Cross-user access** (UID `uid2` reading/writing `/users/uid1/loans/loan_1` or `/users/uid1/friends/uid3`) -> Denied (`request.auth.uid == userId` fails).
4. **OwnerId / SenderId spoofing** (`ownerId: "victim_uid"` or `senderId: "victim_uid"`) -> Denied.
5. **Shadow/ghost field injection** (`{ ..., isAdmin: true }`) -> Denied (`keys().hasOnly(...)` fails).
6. **Oversized ID poisoning** (`loanId` > 128 chars or containing spaces/slashes) -> Denied (`isValidId` fails).
7. **Oversized message / notes DoW attack** (`text` > 1000 chars or `notes` > 1000 chars) -> Denied.
8. **Negative or zero loan amount** (`amount: -500` or `amount: 0`) -> Denied (`data.amount > 0` fails).
9. **Client-forged server timestamp** (`createdAtServer` != `request.time` on create) -> Denied.
10. **Immutable field tampering** (changing `ownerId`, `id`, `participantIds`, or `createdAtServer` on update) -> Denied.
11. **Handle scraping / hijacking** (`list /usernames` or overwriting another user's `/usernames/{handle}`) -> Denied (`allow list: if false` and `existing().uid == request.auth.uid`).
12. **Outsider reading/writing a 1-to-1 chat** (`uid3` reading `/chats/uid1_uid2/messages/m1`) -> Denied by Master Gate `get(...)`.
13. **Username cooldown bypass** (updating `profileUsername` within 7 days of `lastUsernameChangedAt` or forging `lastUsernameChangedAt`) -> Denied (`isUsernameCooldownSatisfiedOnUpdate()` fails).

