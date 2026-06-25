"""AI seam. Phase 0-2 uses StubAIProvider; Phase 3 swaps in ClaudeAIProvider
(Claude Haiku 4.5) behind the same Protocol. Nothing else in the app knows which is active."""

import re
from dataclasses import dataclass, field
from typing import Protocol

from app.config import get_settings

settings = get_settings()


@dataclass
class Summary:
    tldr: list[str] = field(default_factory=list)  # 3 bullets
    key_terms: list[str] = field(default_factory=list)  # 5 terms


@dataclass
class Meta:
    course_code: str | None = None
    week: int | None = None
    topic: str | None = None


class AIProvider(Protocol):
    def summarize(self, text: str) -> Summary: ...
    def extract_metadata(self, filename: str, text: str) -> Meta: ...


class StubAIProvider:
    """Deterministic fakes so the full UI/flow is buildable before real models exist."""

    _CODE_RE = re.compile(r"([A-Z]{2,4})\s?_?(\d{3})", re.IGNORECASE)
    _WEEK_RE = re.compile(r"week[\s_]?(\d{1,2})", re.IGNORECASE)

    def summarize(self, text: str) -> Summary:
        return Summary(
            tldr=[
                "Stub summary bullet 1.",
                "Stub summary bullet 2.",
                "Stub summary bullet 3.",
            ],
            key_terms=["Term1", "Term2", "Term3", "Term4", "Term5"],
        )

    def extract_metadata(self, filename: str, text: str) -> Meta:
        code = None
        if m := self._CODE_RE.search(filename):
            code = f"{m.group(1).upper()}{m.group(2)}"
        week = None
        if m := self._WEEK_RE.search(filename):
            week = int(m.group(1))
        return Meta(course_code=code, week=week, topic=None)


def get_ai() -> AIProvider:
    if settings.ai_provider == "stub":
        return StubAIProvider()
    # Phase 3: return ClaudeAIProvider(api_key=settings.anthropic_api_key)
    raise NotImplementedError(
        f"AI provider '{settings.ai_provider}' not implemented yet (Phase 0 = stub)."
    )
