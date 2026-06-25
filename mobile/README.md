# UniPortal — Mobile Client (Android-first, Expo/React Native + TypeScript)

The student/lecturer/admin app for the Gather-AI UniPortal spec. It talks to the
FastAPI backend in [`../backend`](../backend) and maintains a local SQLite
**mirror** for offline study.

## Locked product decisions (per spec "Open Questions")

| Question | Decision in this build |
|---|---|
| Account model | **Institution-seeded** (admin CSV roster + invite activation) **+ self-register-with-code** → Pending Approvals queue. SSO deferred. |
| iOS in scope v1? | **No.** Android-first. |
| Move vs Copy | **Copy** default, with a **30-day trash** safety net. |
| Summaries | **Server-side** (backend `app/ai.py` seam; stubbed). |
| Distribution | **Android enterprise / sideloaded (MDM)** → enables the **true full-scan** with `MANAGE_EXTERNAL_STORAGE`. Not for Google Play. |

## How the Platform Reality Check is implemented

- **Full recursive scan + move** → real on this enterprise target via a native
  module (`UniportalFiles`, contract in [`src/scan/fileSource.ts`](src/scan/fileSource.ts)).
  Falls back to document-picker **import** when the module/permission is absent
  ([`src/scan/nativeBridge.ts`](src/scan/nativeBridge.ts)).
- **Copy by default, originals kept 30 days** → [`src/scan/engine.ts`](src/scan/engine.ts)
  writes the retained original ref into the `trash` table; the reaper in
  [`App.tsx`](App.tsx) purges expired entries on launch.
- **SHA alias / soft reference** → implemented **logically** in SQLite, not at the
  OS level: one `content` row per sha256, many `placement` rows (the alias system).
  See [`src/db/schema.ts`](src/db/schema.ts). Hash is **SHA-256**.
- **AI auto-detect course/week** → always a **pre-filled, editable** suggestion with
  a confidence hint, never silent ([`src/scan/matcher.ts`](src/scan/matcher.ts),
  Drafts upload flow).
- **Overnight pre-cache** → exposed as a best-effort toggle in Settings; the
  guaranteed path is download-on-open ([`src/services/materials.ts`](src/services/materials.ts)).

## Module → code map

| Module | Where |
|---|---|
| 1 Course→Week→File | `screens/CourseDetailScreen.tsx`, `services/materials.ts` |
| 2 Drafts / publish / batch | `screens/tabs/DraftsTab.tsx` → backend `/materials/publish-batch` |
| 3 Scan & Sort / smart folders | `scan/engine.ts`, `scan/matcher.ts`, `screens/tabs/LibraryTab.tsx`, `screens/FolderDetailScreen.tsx` |
| 4 Metadata / dedup / rename | `scan/matcher.ts`, `db/index.ts` (`findContent`, `libraryStats`) |
| 6 Identity / onboarding / auth | `screens/auth/*`, `stores/auth.ts`, `services/permissions.ts` |
| 7 Profiles (per role) | `screens/tabs/ProfileTab.tsx` |
| 8 Navigation (per-role tabs) | `navigation/*` |
| 9 Search / bookmarks / viewer | `screens/tabs/SearchTab.tsx`, `screens/ViewerScreen.tsx`, `db/index.ts` |
| 10 Settings | `screens/SettingsScreen.tsx`, `stores/prefs.ts` |
| 11 Notifications | `screens/NotificationCenterScreen.tsx` → backend `/auth/notifications*` |
| 12 Empty/error/edge | `components/ui.tsx` (`EmptyState`, `Banner`), scan-skip tray, trash |
| 13 Security/privacy | SecureStore tokens, app-private mirror, tenant isolation (server) |
| 14 a11y / theme / perf | `theme/index.ts`, `components/*` (labels, tap targets, cancelable scan) |
| 15 End-to-end flows | onboarding → scan → link-to-course (student); upload → publish (lecturer); roster import → approvals (admin) |

## Running

```bash
npm install
# point at the backend (Android emulator reaches host at 10.0.2.2)
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 npm run android
npm run lint   # tsc --noEmit
```

The full-scan native module ships in a custom dev/enterprise build (`expo run:android`),
not Expo Go. In Expo Go the app runs and degrades to import-only scanning.

## Native module to implement (Android)

`UniportalFiles` (Kotlin) — see the contract in `src/scan/fileSource.ts`:
`hasAllFilesAccess()`, `requestAllFilesAccess()`, `listRecursive(roots)`. It needs the
`MANAGE_EXTERNAL_STORAGE` grant (declared in `app.json`) and should enumerate the
default roots (Download, DCIM, Documents, WhatsApp media).
