from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Core
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    REDIS_URL: str

    # Auth
    JWT_SECRET: str
    JWT_EXPIRY_HOURS: int = 24

    # External APIs
    GROQ_API_KEY: str
    NVD_API_KEY: str = ""  # Optional
    ABUSEIPDB_API_KEY: str

    # App
    FRONTEND_URL: str = "http://localhost:5173"
    APP_BASE_URL: str = "http://localhost:8000"
    INGESTION_INTERVAL_HOURS: int = 6

    # SMTP (Gmail for demo)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""          # Gmail address
    SMTP_PASSWORD: str = ""      # Gmail App Password
    ALERT_FROM_EMAIL: str = "alerts@threatlens.app"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

