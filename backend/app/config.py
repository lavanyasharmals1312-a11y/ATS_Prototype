from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    database_url: str
    secret_key: str
    enable_ai_parsing: bool = False
    gemini_api_key: str = ""
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    cors_origins: str = "http://localhost:5173"
    access_token_expire_minutes: int = 480
    log_level: str = "INFO"
    app_version: str = "1.0.0"
    app_env: str = "development"
settings = Settings()
