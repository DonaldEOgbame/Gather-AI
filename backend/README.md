# Gather-AI — Backend (FastAPI)

Phase 0 foundation: auth + RBAC, the University→Semester→Dept→Course→Week hierarchy,
the 2-toggle course roster, and material upload/list/download with SHA-1 content hashing.
Storage and AI are behind adapters (`local` disk + `stub` AI now; S3/R2 + Claude later).

## Run locally

```bash
# 1. start Postgres
docker compose up -d db          # from repo root

# 2. set up the Python env
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # adjust JWT_SECRET etc.

# 3. migrate + run
alembic upgrade head
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for the interactive API.

## Tests

```bash
cd backend && source .venv/bin/activate
pip install pytest && pytest          # 8 tests: identity flows + materials RBAC
```

## Quick smoke (curl)

There is **no open registration** — accounts are provisioned (Module 6). Bootstrap the
first admin, then go through the institution-seeded flow:

```bash
# 1. create an institution (tenant) + join code
INST=$(curl -s -X POST localhost:8000/courses/institutions \
  -H 'content-type: application/json' \
  -d '{"name":"Aduna U","join_code":"ADUN-2026","timezone":"Africa/Lagos"}' \
  | python -c 'import sys,json;print(json.load(sys.stdin)["id"])')

# 2. bootstrap the first admin (one-time per institution), then log in
curl -X POST "localhost:8000/auth/bootstrap?institution_id=$INST&email=admin@aduna.edu&password=password123"

TOKEN=$(curl -s -X POST localhost:8000/auth/login \
  -d 'username=admin@aduna.edu&password=password123' \
  | python -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

# 3. roster-import lecturers/students (each gets an invitation email -> /auth/activate)
curl -X POST localhost:8000/auth/roster-import -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d "{\"institution_id\":\"$INST\",\"rows\":[{\"email\":\"prof@aduna.edu\",\"matric_or_staff_id\":\"S1\",\"global_role\":\"lecturer\"}]}"
```

With `NOTIFIER_BACKEND=console`, invitation tokens and OTPs are printed to the server log.

## Layout

```
app/
  config.py      settings (env-driven)
  db.py          engine + session + Base
  models.py      SQLAlchemy models (full hierarchy)
  schemas.py     Pydantic request/response models
  security.py    password hashing + JWT
  deps.py        auth + RBAC dependencies (global role + per-course roster)
  storage.py     StorageAdapter (local now, S3/R2 later)
  ai.py          AIProvider seam (StubAIProvider now, Claude in Phase 3)
  notifier.py    Notifier seam for email/SMS (ConsoleNotifier now, SES/Twilio later)
  routers/       auth (incl. Module 6 identity), courses, materials
alembic/         migrations (0001_baseline, 0002_identity)
tests/           pytest (identity flows + materials RBAC)
```

## RBAC model

- **Global roles** (`admin`/`lecturer`/`student`) gate top-level access.
- **Per-course** access is the roster row's two toggles: `can_publish`,
  `can_manage_roster`. Admins act as implicit full-privilege members.
- Students only ever see `live` materials in courses they're enrolled in.
