"""AI seam. Default StubAIProvider for offline dev; real summaries/metadata via
ClaudeAIProvider (Anthropic) or OpenRouterAIProvider (gpt-oss), all behind the
same Protocol. Real providers return model output as-is — no deterministic fallback."""

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


class ClaudeAIProvider:
    """Real summaries + metadata extraction via the Anthropic API (Claude Haiku 4.5),
    selectable with `ai_provider=claude`. Returns the model's output as-is (null
    fields stay null) — no deterministic fallback."""

    MODEL = "claude-haiku-4-5"

    def __init__(self, api_key: str) -> None:
        if not api_key:
            raise RuntimeError("ai_provider=claude requires anthropic_api_key to be set")
        import anthropic  # lazy import so stub-only installs don't need the SDK

        self._client = anthropic.Anthropic(api_key=api_key)

    def summarize(self, text: str) -> Summary:
        schema = {
            "type": "object",
            "properties": {
                "tldr": {"type": "array", "items": {"type": "string"}},
                "key_terms": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["tldr", "key_terms"],
            "additionalProperties": False,
        }
        resp = self._client.messages.create(
            model=self.MODEL,
            max_tokens=1024,
            output_config={"format": {"type": "json_schema", "schema": schema}},
            messages=[{
                "role": "user",
                "content": (
                    "Summarize this course material as exactly 3 short TL;DR bullets "
                    "and 5 key terms.\n\n" + text[:12000]
                ),
            }],
        )
        import json
        data = json.loads(next(b.text for b in resp.content if b.type == "text"))
        return Summary(tldr=data["tldr"][:3], key_terms=data["key_terms"][:5])

    def extract_metadata(self, filename: str, text: str) -> Meta:
        schema = {
            "type": "object",
            "properties": {
                "course_code": {"type": ["string", "null"]},
                "week": {"type": ["integer", "null"]},
                "topic": {"type": ["string", "null"]},
            },
            "required": ["course_code", "week", "topic"],
            "additionalProperties": False,
        }
        resp = self._client.messages.create(
            model=self.MODEL,
            max_tokens=256,
            output_config={"format": {"type": "json_schema", "schema": schema}},
            messages=[{
                "role": "user",
                "content": (
                    f"Infer the course code, week number, and topic for a file named "
                    f"'{filename}'. Use null when unknown.\n\n{text[:4000]}"
                ),
            }],
        )
        import json
        data = json.loads(next(b.text for b in resp.content if b.type == "text"))
        return Meta(
            course_code=data.get("course_code"),
            week=data.get("week"),
            topic=data.get("topic"),
        )


class OpenRouterAIProvider:
    """Real summaries + metadata extraction via OpenRouter's OpenAI-compatible API
    (`ai_provider=openrouter`, default model gpt-oss). Returns the model's output
    as-is — no deterministic fallback."""

    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        if not api_key:
            raise RuntimeError("ai_provider=openrouter requires openrouter_api_key to be set")
        from openai import OpenAI  # lazy import so stub-only installs don't need the SDK

        self._client = OpenAI(api_key=api_key, base_url=base_url)
        self._model = model

    def _json_call(self, prompt: str, name: str, schema: dict, max_tokens: int) -> dict:
        import json

        resp = self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            response_format={
                "type": "json_schema",
                "json_schema": {"name": name, "strict": True, "schema": schema},
            },
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(resp.choices[0].message.content)

    def summarize(self, text: str) -> Summary:
        schema = {
            "type": "object",
            "properties": {
                "tldr": {"type": "array", "items": {"type": "string"}},
                "key_terms": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["tldr", "key_terms"],
            "additionalProperties": False,
        }
        data = self._json_call(
            "Summarize this course material as exactly 3 short TL;DR bullets "
            "and 5 key terms.\n\n" + text[:12000],
            "summary",
            schema,
            1024,
        )
        return Summary(tldr=data["tldr"][:3], key_terms=data["key_terms"][:5])

    def extract_metadata(self, filename: str, text: str) -> Meta:
        schema = {
            "type": "object",
            "properties": {
                "course_code": {"type": ["string", "null"]},
                "week": {"type": ["integer", "null"]},
                "topic": {"type": ["string", "null"]},
            },
            "required": ["course_code", "week", "topic"],
            "additionalProperties": False,
        }
        data = self._json_call(
            f"Infer the course code, week number, and topic for a file named "
            f"'{filename}'. Use null when unknown.\n\n{text[:4000]}",
            "metadata",
            schema,
            256,
        )
        return Meta(
            course_code=data.get("course_code"),
            week=data.get("week"),
            topic=data.get("topic"),
        )


def get_ai() -> AIProvider:
    provider = settings.ai_provider
    if provider == "stub":
        return StubAIProvider()
    if provider == "claude":
        return ClaudeAIProvider(api_key=settings.anthropic_api_key)
    if provider == "openrouter":
        return OpenRouterAIProvider(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            model=settings.ai_model,
        )
    raise NotImplementedError(
        f"Unknown AI provider '{provider}' (use 'stub', 'claude', or 'openrouter')."
    )
