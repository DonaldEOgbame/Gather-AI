# Gather-AI — Phased Roadmap

## Phase 0 — Foundation  ✅ done
Repo scaffold (`/backend`), Postgres schema + migrations, auth + RBAC,
storage adapter, courses + materials upload/download (SHA-256 dedup).
**Exit (met):** a lecturer can log in and upload a file via API; a student can list/download.

## Phase 1 — Identity & publishing loop  ◀ in progress
- **Module 6 (Identity) — ✅ done.** Institution + join code, first-admin bootstrap,
  roster import → invitation → activation, self-register-with-join-code (OTP match) +
  pending-approval queue, account status lifecycle (invited→active→suspended→archived),
  refresh-token sessions/devices + remote logout. Email/SMS behind a `Notifier` seam.
- **Remaining:** Drafts→publish/schedule workflow (Celery beat), the `can_publish`
  publish gate, FCM push, Android Share-to-App intent → draft, the Module 11
  notifications system (batched digests, quiet hours), Module 13 audit trail.
**Exit:** the full Module 2 + Module 5 daily flow works end-to-end.

## Phase 2 — Offline mirror (flagship)
Sandbox FS + local SQLite (`hash→path→[logical folders]` — logical aliases, not OS-level;
see Reality Check), picker-import (Module 3A buildable form), SHA-256 dedup with aliases,
download + offline open, Stale Version Sweeper.
**Exit:** Modules 3B/3E + 4C real; Module 3A as picker/SAF import.

## Phase 3 — Make AI real
Swap `StubAIProvider`→`ClaudeAIProvider` (summaries/metadata), on-device OCR + TF-IDF
clustering, opportunistic (best-effort) pre-cache. AI course/week guesses are always
shown as editable pre-filled fields, never silent (Reality Check).
**Exit:** Modules 3C/3D/4A/4B real.

## Phase 4 — Hardening
Android scoped-storage scanning (MediaStore + Storage Access Framework; copy-by-default
with a 30-day trash), iOS reduced-capability port, accessibility/localization (Module 14).

---

## How Modules 6–15 map onto the phases

| Module | Where it lands |
|---|---|
| 6 Identity/onboarding/auth | **Phase 1 — built** |
| 7 Per-role profiles | Phase 1 (profile endpoints) + Phase 2 (student stats from the mirror) |
| 8 Navigation / IA | Mobile app (per-phase as screens land) |
| 9 User interactions (search, bookmarks, viewer, gestures) | Phase 2 (mirror) + later |
| 10 Settings | Spans phases; storage/sync settings are Phase 2 |
| 11 Notifications system | Phase 1 (event→notification map, batching, quiet hours) |
| 12 Empty states / errors / edge cases | Cross-cutting; offline-queue + tombstones are Phase 2 |
| 13 Security / privacy / tenancy / audit | Phase 1 (tenant scoping + audit) onward |
| 14 Accessibility / localization / perf | Phase 4 + ongoing budgets |
| 15 Extended onboarding journeys | Realized as Phases 1–2 ship |

## Platform Reality Check (locked decisions)

These confirm the Android-first constraints and resolve open questions:

- **No autonomous phone-wide scan.** iOS sandbox forbids it; Android `MANAGE_EXTERNAL_STORAGE`
  risks Play removal. Buildable form: **document-picker / Storage Access Framework import**
  of user-chosen folders.
- **Copy by default, not move.** Move only for explicitly-granted folders, with a 30-day trash.
- **Aliases are logical (SQLite), not OS-level.** `File_Hash → Physical_Path → [Logical_Folders]`.
- **SHA-256, not SHA-1**, for dedup — applied in code.
- **Pre-cache is best-effort** (WorkManager / BGAppRefreshTask on Wi-Fi+charging) + instant
  download-on-open fallback. Not a promised clock time.
- **AI course/week guesses are pre-filled & editable**, never silent miscategorization.

---

### Module 6 API surface (built, tested)

```
POST   /courses/institutions          create tenant + join_code (open; bootstrap path)
POST   /auth/bootstrap                 first admin of an institution (one-time, 409 after)
POST   /auth/roster-import   (admin)   seed invited users + email invitation tokens
POST   /auth/activate                  invitation token + password -> Active
POST   /auth/self-register             join_code + matric: roster match -> OTP, else -> approvals
POST   /auth/verify-otp                OTP + password -> Active
GET    /auth/pending-approvals (admin) self-register requests with no roster match
POST   /auth/pending-approvals/{id} (admin)  approve (-> invite) or reject
POST   /auth/login                     -> access + refresh token
POST   /auth/refresh                   refresh token -> new access token
GET    /auth/sessions                  active devices
DELETE /auth/sessions/{id}             remote logout
GET    /auth/me                        current user
```

Verification: `cd backend && pytest` — **8 tests pass** (identity flows + materials RBAC).
The Alembic chain is a single linear head (0001→0002); a live Postgres apply was not run
in this environment (Docker daemon was down) but the migration uses only standard ops.
