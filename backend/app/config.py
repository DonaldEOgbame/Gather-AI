from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://gather:gather@localhost:5432/gather"

    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    storage_backend: str = "local"
    local_storage_dir: str = "./_storage"

    s3_bucket: str = ""
    s3_endpoint_url: str = ""
    s3_region: str = "auto"
    s3_access_key: str = ""
    s3_secret_key: str = ""

    # Cloudinary object storage (storage_backend=cloudinary). Files are stored as
    # `resource_type=raw` so non-image materials (PDF/slides) round-trip unchanged.
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    ai_provider: str = "stub"
    anthropic_api_key: str = ""

    # OpenRouter (ai_provider=openrouter) — OpenAI-compatible endpoint. Defaults to
    # the open-weights gpt-oss model; override ai_model for any OpenRouter model id.
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    ai_model: str = "openai/gpt-oss-120b"

    notifier_backend: str = "console"
    redis_url: str = "redis://localhost:6379/0"

    # Push delivery (independent of notifier_backend): "console" logs, "fcm" sends
    # via Firebase Cloud Messaging HTTP v1 using a service-account JSON. project_id
    # is read from the credentials file when fcm_project_id is left blank.
    push_backend: str = "console"
    fcm_credentials_file: str = ""
    fcm_project_id: str = ""

    # Real notifier (notifier_backend=smtp). SMS/push are best-effort logged
    # unless their own credentials are configured.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@gather.app"
    smtp_use_tls: bool = True

    invitation_ttl_hours: int = 168  # 7 days
    otp_ttl_minutes: int = 10
    refresh_token_expire_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
