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

    ai_provider: str = "stub"
    anthropic_api_key: str = ""

    notifier_backend: str = "console"
    redis_url: str = "redis://localhost:6379/0"

    invitation_ttl_hours: int = 168  # 7 days
    otp_ttl_minutes: int = 10
    refresh_token_expire_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
