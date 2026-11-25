# EDU SMART Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Identity Integrity**: Every document in `studyTasks`, `thinkReflections`, `aiSessions`, `factChecks`, `selfTests`, and `surveys` MUST carry `userId == request.auth.uid` on create, and `userId` is immutable on update.
2. **Email Verification Gate**: All authenticated reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Zero Self-Assigned Roles**: On `/users/{userId}` creation, `role` MUST be `'student'` and `teacherApproved` MUST be `false` (unless caller is a verified admin). Users can record `requestedRole: 'teacher'` to request school approval, without escalating `role` or `teacherApproved`.
4. **PII Isolation**: `email`, `phone`, and `birthDate` live exclusively in `/users/{userId}/private/info`, readable and writable only by the owner (`userId == request.auth.uid`) or verified admin.
5. **Temporal Integrity**: `createdAt` MUST equal `request.time` on create and remain immutable on update; `updatedAt` MUST equal `request.time` on create and update.
6. **Strict Schema & Size Bounds**: Every collection enforces exact `keys().hasAll(...) && keys().hasOnly(...)`, `.size()` limits on all strings/arrays, and regex validation (`^[a-zA-Z0-9_\-]+$`) on path IDs.
7. **Query Enforcement**: Every `allow list` strictly requires `resource.data.userId == request.auth.uid` (no `get()`/`exists()` inside `allow list`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Assigned Teacher/Admin Role on Create** (`/users/u1`): `{ uid: "u1", displayName: "Hack", role: "teacher", requestedRole: "teacher", teacherApproved: true, ... }` -> MUST be denied.
2. **Shadow Ghost Field on StudyTask Create** (`/studyTasks/t1`): valid fields + `{ isVerified: true }` -> MUST be denied via `hasOnly`.
3. **UID Spoofing on ThinkReflection** (`/thinkReflections/r1`): signed in as `u1`, payload `{ userId: "u2", ... }` -> MUST be denied.
4. **Unverified Email Write** (`/studyTasks/t1`): `email_verified: false` -> MUST be denied.
5. **Blanket List Scraping** (`/surveys`): unauthenticated or cross-user `list` query without `where('userId', '==', uid)` -> MUST be denied.
6. **PII Cross-User Read** (`/users/u2/private/info`): `get` by `u1` -> MUST be denied.
7. **Path ID Poisoning** (`/studyTasks/bad$id!!` or 500-char ID) -> MUST be denied by `isValidId()`.
8. **Client-Spoofed Timestamp** (`/studyTasks/t1`): `createdAt` set to past/arbitrary timestamp instead of `request.time` -> MUST be denied.
9. **Immutable Owner Tampering on StudyTask Update**: changing `userId` or `createdAt` -> MUST be denied.
10. **Value Poisoning on StudyTask Update**: toggling `done` while passing a 5000-char `name` or invalid boolean type -> MUST be denied by `isValidStudyTask(incoming())`.
11. **Oversized Array / Invalid Likert Score on Survey**: `answers` with length 8 or score `9` -> MUST be denied.
12. **Terminal FactCheck Tampering / Update**: modifying immutable `factChecks` or `surveys` after submission -> MUST be denied.
