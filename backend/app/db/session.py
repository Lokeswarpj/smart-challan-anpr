from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

engine = None
active_db_type = "unknown"

try:
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
        active_db_type = "SQLite"
        logger.info(f"Connected to SQLite database: {settings.DATABASE_URL}")
    else:
        # Attempt primary PostgreSQL connection with fast 1s timeout
        pg_engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 1}
        )
        with pg_engine.connect() as conn:
            pass
        engine = pg_engine
        active_db_type = "PostgreSQL"
        logger.info("Connected successfully to PostgreSQL database.")
except Exception as e:
    logger.warning(
        f"PostgreSQL connection to '{settings.DATABASE_URL}' was not reachable ({e}). "
        f"Falling back to local SQLite database at '{settings.SQLITE_FALLBACK_URL}' for seamless execution."
    )
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )
    active_db_type = "SQLite"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

