from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

engine = None
active_db_type = "unknown"

# Always prepare local SQLite engine as guaranteed zero-downtime backup
sqlite_engine = create_engine(
    settings.SQLITE_FALLBACK_URL,
    connect_args={"check_same_thread": False}
)
SqliteSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

try:
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = sqlite_engine
        active_db_type = "SQLite"
        logger.info(f"Connected to SQLite database: {settings.DATABASE_URL}")
    else:
        # Attempt primary PostgreSQL connection with resilient 4s timeout and bounded pooling
        pg_engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            pool_timeout=10,
            connect_args={"connect_timeout": 4}
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = pg_engine
        active_db_type = "PostgreSQL"
        logger.info("Connected successfully to PostgreSQL database.")
except Exception as e:
    logger.warning(
        f"PostgreSQL connection to '{settings.DATABASE_URL}' was not reachable ({e}). "
        f"Falling back to local SQLite database at '{settings.SQLITE_FALLBACK_URL}' for seamless execution."
    )
    engine = sqlite_engine
    active_db_type = "SQLite"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Resilient database dependency.
    Yields the database session and ensures clean closure without breaking
    generator lifecycle when endpoints raise standard HTTPExceptions.
    """
    global engine, active_db_type
    try:
        db = SessionLocal()
        # Verify connection health before handing off to route
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.warning(
            f"Database connection error on {active_db_type} ({e}). "
            f"Failing over to local SQLite database."
        )
        db = SqliteSessionLocal()

    try:
        yield db
    finally:
        db.close()


