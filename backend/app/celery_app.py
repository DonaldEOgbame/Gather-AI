import os
from celery import Celery
from app.config import get_settings

settings = get_settings()

import socket

celery_app = Celery(
    "tasks",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

def is_redis_running():
    try:
        from urllib.parse import urlparse
        res = urlparse(settings.redis_url)
        host = res.hostname or "localhost"
        port = res.port or 6379
        s = socket.create_connection((host, port), timeout=0.2)
        s.close()
        return True
    except Exception:
        return False

if not is_redis_running():
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

# Auto-discover tasks from the tasks module
celery_app.autodiscover_tasks(["app"])

# Periodic schedule
celery_app.conf.beat_schedule = {
    "check-scheduled-releases-every-minute": {
        "task": "app.tasks.check_scheduled_releases",
        "schedule": 60.0,
    },
    "flush-delayed-notifications-every-minute": {
        "task": "app.tasks.flush_delayed_notifications",
        "schedule": 60.0,
    },
}
