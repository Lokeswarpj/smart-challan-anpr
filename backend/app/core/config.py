import os
from typing import Optional

class Settings:
    PROJECT_NAME: str = "Vehicle Document Verification System (ANPR)"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings (PostgreSQL default with automatic SQLite fallback)
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "vehicle_db")
    
    # Full connection string
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./vehicle_verification.db"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "anpr-traffic-enforcement-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours for officer shift
    
    # Storage
    RECEIPTS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "receipts")
    EXPORTS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "exports")
    
    # Email settings (standard smtplib)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "traffic-enforcement@dept.gov.in")

settings = Settings()
os.makedirs(settings.RECEIPTS_DIR, exist_ok=True)
os.makedirs(settings.EXPORTS_DIR, exist_ok=True)
