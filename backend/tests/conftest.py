import os
import tempfile

# Set env BEFORE any app import so Settings() picks it up at module load.
# Force the deterministic local providers so the suite never touches the real
# Cloudinary/OpenRouter/SMTP backends a populated .env selects — tests stay
# offline, free, and deterministic. (os.environ wins over .env in pydantic.)
os.environ["JWT_SECRET"] = "a-sufficiently-long-test-secret-key-0123456789"
os.environ["STORAGE_BACKEND"] = "local"
os.environ["LOCAL_STORAGE_DIR"] = tempfile.mkdtemp()
os.environ["AI_PROVIDER"] = "stub"
os.environ["NOTIFIER_BACKEND"] = "console"
os.environ["PUSH_BACKEND"] = "console"


import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (register models on Base.metadata; import first to avoid rebinding `app`)
from app.db import Base, get_db
from app.main import app as fastapi_app


@pytest.fixture()
def client():
    """TestClient with a fresh in-memory-ish SQLite DB per test, wired via a
    FastAPI dependency override on get_db (the standard, reliable pattern)."""
    engine = create_engine(
        f"sqlite:///{tempfile.mktemp(suffix='.db')}",
        connect_args={"check_same_thread": False},
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)

    import app.db
    import app.tasks
    old_db_sess = app.db.SessionLocal
    old_tasks_sess = app.tasks.SessionLocal
    app.db.SessionLocal = TestingSession
    app.tasks.SessionLocal = TestingSession

    def _override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(fastapi_app)
    fastapi_app.dependency_overrides.clear()
    app.db.SessionLocal = old_db_sess
    app.tasks.SessionLocal = old_tasks_sess


@pytest.fixture(autouse=True)
def configure_celery():
    """Forces Celery to execute tasks synchronously in the current thread during tests."""
    from app.celery_app import celery_app
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True
