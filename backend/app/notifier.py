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


class FcmPush:
    """Firebase Cloud Messaging HTTP v1 sender (push_backend=fcm).

    Authenticates with a service-account JSON (Firebase console → Project settings
    → Service accounts → Generate new private key) and POSTs to the v1 endpoint.
    The OAuth2 access token is cached by google-auth and auto-refreshed.
    """

    SCOPE = "https://www.googleapis.com/auth/firebase.messaging"

    def __init__(self) -> None:
        from google.oauth2 import service_account  # lazy: only needed for fcm

        if not settings.fcm_credentials_file:
            raise RuntimeError("push_backend=fcm requires fcm_credentials_file to be set")
        self._creds = service_account.Credentials.from_service_account_file(
            settings.fcm_credentials_file, scopes=[self.SCOPE]
        )
        self._project_id = settings.fcm_project_id or self._creds.project_id
        if not self._project_id:
            raise RuntimeError("push_backend=fcm could not resolve a project_id")

    def _bearer(self) -> str:
        import google.auth.transport.requests

        if not self._creds.valid:
            self._creds.refresh(google.auth.transport.requests.Request())
        return self._creds.token

    def send(self, fcm_token: str, title: str, body: str, data: dict | None = None) -> bool:
        import requests

        message: dict = {
            "message": {
                "token": fcm_token,
                "notification": {"title": title, "body": body},
            }
        }
        if data:
            # FCM v1 data values must be strings.
            message["message"]["data"] = {k: str(v) for k, v in data.items()}

        resp = requests.post(
            f"https://fcm.googleapis.com/v1/projects/{self._project_id}/messages:send",
            headers={"Authorization": f"Bearer {self._bearer()}", "Content-Type": "application/json"},
            json=message,
            timeout=10,
        )
        if resp.status_code >= 400:
            # 404/UNREGISTERED means the token is stale — caller may prune it.
            log.warning("FCM send failed (%s) for %s: %s", resp.status_code, fcm_token[:12], resp.text)
            return False
        return True


_fcm: "FcmPush | None" = None


def _deliver_push(to: str, title: str, body: str, data: dict | None = None) -> None:
    """Route a push through the configured backend. Failures are logged, never raised,
    so a flaky push can't break the email/notification path that triggered it."""
    if settings.push_backend == "fcm":
        global _fcm
        try:
            if _fcm is None:
                _fcm = FcmPush()
            _fcm.send(to, title, body, data)
        except Exception as e:  # noqa: BLE001 — best-effort channel
            log.warning("FCM push error for %s: %s", to[:12], e)
        return
    log.info("PUSH -> %s | %s | %s | %s", to, title, body, data)


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
        _deliver_push(fcm_token, title, body, data)
        self.outbox.append(SentMessage(to=fcm_token, channel="push", subject=title, body=body))


class SmtpNotifier:
    """Real transactional email over SMTP (notifier_backend=smtp).

    Email is delivered via SMTP; SMS and push are logged (wire Twilio / FCM the
    same way once those credentials exist) so a missing channel never crashes a
    flow that primarily relies on email (invites, OTPs, resets).
    """

    def __init__(self) -> None:
        if not settings.smtp_host:
            raise RuntimeError("notifier_backend=smtp requires smtp_host to be set")

    def send_email(self, to: str, subject: str, body: str) -> None:
        import smtplib
        from email.message import EmailMessage

        msg = EmailMessage()
        msg["From"] = settings.smtp_from
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)

    def send_sms(self, to: str, body: str) -> None:
        log.info("SMS (no provider configured) -> %s\n%s", to, body)

    def send_push(self, fcm_token: str, title: str, body: str, data: dict | None = None) -> None:
        _deliver_push(fcm_token, title, body, data)


# Single shared instance so the outbox is inspectable across requests in tests.
_console = ConsoleNotifier()


def get_notifier() -> Notifier:
    backend = settings.notifier_backend
    if backend == "console":
        return _console
    if backend == "smtp":
        return SmtpNotifier()
    raise NotImplementedError(f"Unknown notifier backend '{backend}' (use 'console' or 'smtp').")
