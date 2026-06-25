"""Notifier seam for transactional email/SMS (invitations, OTPs, password resets).
Phase 0 uses ConsoleNotifier (logs to stdout + an in-memory outbox the tests can read);
real providers (SES/Twilio) swap in behind the same Protocol later. Mirrors the AI seam."""

import logging
from dataclasses import dataclass, field
from typing import Protocol

from app.config import get_settings

settings = get_settings()
log = logging.getLogger("notifier")


@dataclass
class SentMessage:
    to: str
    channel: str  # "email" | "sms"
    subject: str
    body: str


class Notifier(Protocol):
    def send_email(self, to: str, subject: str, body: str) -> None: ...
    def send_sms(self, to: str, body: str) -> None: ...
    def send_push(self, fcm_token: str, title: str, body: str, data: dict | None = None) -> None: ...


class ConsoleNotifier:
    """Logs messages and keeps the last N in a process-local outbox so smoke tests
    can assert on what *would* have been sent (e.g. read back an OTP/invite token)."""

    outbox: list[SentMessage] = field(default_factory=list)

    def __init__(self) -> None:
        self.outbox = []

    def send_email(self, to: str, subject: str, body: str) -> None:
        log.info("EMAIL -> %s | %s\n%s", to, subject, body)
        self.outbox.append(SentMessage(to=to, channel="email", subject=subject, body=body))

    def send_sms(self, to: str, body: str) -> None:
        log.info("SMS -> %s\n%s", to, body)
        self.outbox.append(SentMessage(to=to, channel="sms", subject="", body=body))

    def send_push(self, fcm_token: str, title: str, body: str, data: dict | None = None) -> None:
        log.info("PUSH -> %s | %s | %s | %s", fcm_token, title, body, data)
        self.outbox.append(SentMessage(to=fcm_token, channel="push", subject=title, body=body))


# Single shared instance so the outbox is inspectable across requests in tests.
_console = ConsoleNotifier()


def get_notifier() -> Notifier:
    if settings.notifier_backend == "console":
        return _console
    # Later: return SesTwilioNotifier(...)
    raise NotImplementedError(
        f"Notifier backend '{settings.notifier_backend}' not implemented (Phase 0 = console)."
    )
