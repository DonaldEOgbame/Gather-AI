# Gather-AI (UniPortal) — Architecture

A university file-distribution system. Lecturers publish course materials; students
get an offline-first, auto-organized local library. **Android-first**; iOS is a later,
reduced-capability port. Server-side AI is **stubbed behind an interface** initially and
swapped for real models in Phase 3.

## Stack

| Layer            | Choice                              | Rationale |
|------------------|-------------------------------------|-----------|
| Mobile app       | Flutter (Android-first)             | Native share-intent + filesystem plugins; strong isolate/SQLite story for on-device work. |
| Backend API      | FastAPI (Python 3.11+)              | Phase 3 is AI-heavy; same language as the AI tooling. |
| Database         | PostgreSQL                          | The University→Semester→Dept→Course→Week hierarchy is naturally relational. |
| Object storage   | S3-compatible (S3 / Cloudflare R2 / MinIO) | Files are blobs; kept out of Postgres. R2 has no egress fees. |
| Jobs / scheduler | Celery + Redis                      | Scheduled releases, summary generation, push fan-out. |
| Push             | Firebase Cloud Messaging (FCM)      | Android + iOS. |
| Server LLM       | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Cheap/fast TL;DR + key-term extraction (Phase 3). |

## System diagram

```
ANDROID APP (Flutter)
  Share Intent Receiver | UI (Riverpod) | Background Workers (WorkManager)
  Local Engine (Dart isolates): Scan&Sort · SHA-1 dedup · OCR/parse · TF-IDF cluster
  Local SQLite: hash -> physical_path -> logical_folder
  Sandbox FS: /MyUni/<COURSE>/...
        | REST + silent FCM push
BACKEND (FastAPI)
  Auth/RBAC · Courses · Drafts · Publish/Schedule · Sync API
  Celery worker (scheduled release, summaries) | AIProvider (STUB -> Claude) | Storage adapter (S3/R2)
  Postgres · Redis · Object store · FCM
```

## Roles (3-pillar, strict segregation)

- **Admin** — semesters, departments, course codes, assign lecturers, reset passwords, basic storage usage.
- **Lecturer** — upload/edit/delete for *assigned* courses only; per-file download counts; manage roster if granted.
- **Student** — view/download/bookmark/search/organize; zero write access on the server.

Hierarchy: `University > Semester(Active|Archived) > Department > Course Code > Week(1–15)`.

Course-level permissions are exactly two toggles per roster member: `can_publish`,
`can_manage_roster` (Module 2C).

## Identity & tenancy (Module 6)

- **University = the tenant root** (a.k.a. Institution). Carries a `join_code` and
  `timezone`. All users/structure/content scope to one institution (M13 isolation).
- **Provisioning:** institution-seeded roster import (primary) → invited users +
  invitation tokens; self-register-with-join-code → OTP on roster match, else an admin
  pending-approval queue. No open self-registration. `/auth/bootstrap` seeds the first
  admin and is refused once an institution has any user.
- **Account status lifecycle:** `invited → active → suspended → archived`, enforced in
  the auth dependency (only `active` can act on the server).
- **Sessions:** refresh-token-backed; tokens stored hashed; users list devices and
  remote-logout. Access tokens are short-lived JWTs.

## Seams (swappable behind Protocols)

```python
class AIProvider(Protocol):
    def summarize(self, text: str) -> Summary           # 3-bullet TL;DR + 5 key terms
    def extract_metadata(self, filename, text) -> Meta   # course/week/topic guess

class Notifier(Protocol):
    def send_email(self, to, subject, body) -> None      # invitations, OTPs, resets
    def send_sms(self, to, body) -> None
```

- **AI** — Phase 0–2: `StubAIProvider` (filename regex, fixed bullets). Phase 3:
  `ClaudeAIProvider` (Claude Haiku 4.5 + prompt caching).
- **Notifier** — Phase 0: `ConsoleNotifier` (logs + inspectable outbox for tests).
  Later: SES/Twilio.
- **Storage** — `LocalStorage` now; S3/R2 later.
- Dedup uses **SHA-256** (`materials.content_sha256`).

On-device Smart Renamer/Clustering (Module 3C/3D) is **never an LLM**: text-extract →
ML Kit OCR → TF-IDF/embedding clustering in a Dart isolate.

## Hard mobile-OS constraints (drive the design)

1. **Auto scan & MOVE files out of Downloads/WhatsApp (Module 3A).** iOS: effectively
   impossible (sandbox). Android: needs scoped-storage `MediaStore` and possibly
   `MANAGE_EXTERNAL_STORAGE` ("All files access"), which Google Play restricts and may
   reject. **Baseline that works everywhere = import-by-document-picker.** "Downloads now
   empty" is not guaranteeable.
2. **On-device renamer/clustering (3C/3D).** Do it with parse + OCR + TF-IDF in a
   background isolate, not an on-device LLM.
3. **Nightly 2 AM pre-cache + background sync (4B/4C).** iOS `BGProcessingTask` is
   opportunistic (no wall-clock guarantee); Android `WorkManager` better but Doze-limited.
   Design = opportunistic + silent-push-assisted, not a promised clock time.

## Module feasibility (Android-first)

| Module | Verdict |
|---|---|
| 1 Roles/hierarchy | OK |
| 2A Share-to-App overlay | OK (Android share intent + lightweight Activity) |
| 2B Drafts / team pool | OK (status filter on `materials`) |
| 2C 2-toggle perms | OK |
| 2D Publish/Schedule | OK (Celery) |
| 3A Scan & move | Risky — ship picker-import as dependable path |
| 3B SHA-1 dedup + alias | OK within sandbox |
| 3C Smart Renamer | Stub (regex) now; OCR/parse later |
| 3D TF-IDF clustering | Defer to Phase 3 |
| 3E Offline SQLite mirror | OK — build early |
| 4A Summaries | Stubbed seam → Claude later |
| 4B Nightly pre-cache | Opportunistic + silent push |
| 4C Stale Sweeper | OK (hash compare) |
