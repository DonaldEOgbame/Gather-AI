"""Provider seams resolve real backends by config; defaults stay deterministic."""

import pytest


def test_defaults_are_deterministic_stubs():
    from app import storage, notifier, ai
    assert type(storage.get_storage()).__name__ == "LocalStorage"
    assert type(notifier.get_notifier()).__name__ == "ConsoleNotifier"
    assert type(ai.get_ai()).__name__ == "StubAIProvider"


def test_unknown_backends_raise_clearly(monkeypatch):
    from app import storage, notifier, ai
    monkeypatch.setattr(storage.settings, "storage_backend", "gcs")
    monkeypatch.setattr(notifier.settings, "notifier_backend", "telegram")
    monkeypatch.setattr(ai.settings, "ai_provider", "gpt")
    with pytest.raises(NotImplementedError):
        storage.get_storage()
    with pytest.raises(NotImplementedError):
        notifier.get_notifier()
    with pytest.raises(NotImplementedError):
        ai.get_ai()


def test_smtp_notifier_requires_host(monkeypatch):
    from app import notifier
    monkeypatch.setattr(notifier.settings, "notifier_backend", "smtp")
    monkeypatch.setattr(notifier.settings, "smtp_host", "")
    with pytest.raises(RuntimeError):
        notifier.get_notifier()


def test_claude_provider_requires_key(monkeypatch):
    from app import ai
    monkeypatch.setattr(ai.settings, "ai_provider", "claude")
    monkeypatch.setattr(ai.settings, "anthropic_api_key", "")
    with pytest.raises(RuntimeError):
        ai.get_ai()
