#!/bin/sh
set -e

# Persistent data lives on the Fly volume mounted at /data.
mkdir -p /data

# Materialize the FCM service-account JSON from a Fly secret (kept out of the
# image). FCM_CREDENTIALS_FILE points here; see config.fcm_credentials_file.
if [ -n "$FCM_CREDENTIALS_JSON" ]; then
  printf '%s' "$FCM_CREDENTIALS_JSON" > /data/fcm.json
  echo "[entrypoint] wrote FCM credentials to /data/fcm.json"
fi

# One-time seed of the SQLite database on first boot. The guard keeps subsequent
# restarts/deploys from wiping data (bootstrap re-seeds from scratch).
if [ ! -f /data/gather.db ]; then
  echo "[entrypoint] seeding fresh database at /data/gather.db"
  python bootstrap_db.py
else
  echo "[entrypoint] existing database found, skipping seed"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8080
