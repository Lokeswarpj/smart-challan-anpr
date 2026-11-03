import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from sqlalchemy import text
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, active_db_type, SessionLocal
from app.db.models import Vehicle, Officer
from app.api.api_router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    try:
        Base.metadata.create_all(bind=engine)
        # Check if DB has records; if not, suggest seeding
        db = SessionLocal()
        v_count = db.query(Vehicle).count()
        o_count = db.query(Officer).count()
        db.close()
        print(f"[ROADGUARD] System online. DB: {active_db_type}. Vehicles: {v_count}, Officers: {o_count}")
    except Exception as e:
        print(f"[ROADGUARD] Database initialization notice: {e}")
    yield
    # Shutdown
    print("[ROADGUARD] System shutting down.")

app = FastAPI(
    title="ROADGUARD API",
    description="AI-Powered Vehicle Document Verification System using Automatic Number Plate Recognition (ANPR)",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:5000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(api_router)

@app.get("/")
def root():
    return {
        "service": "ROADGUARD AI Backend",
        "tagline": "VERIFY SMARTER. ENFORCE FASTER.",
        "status": "operational",
        "version": "2.4.0",
        "documentation": "/docs",
        "database": active_db_type
    }

@app.get("/health")
def health_check():
    db_status = "healthy"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "degraded"

    return {
        "status": "healthy",
        "database": {
            "type": active_db_type,
            "status": db_status
        },
        "engine": "PyTorch + EasyOCR + YOLOv8"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
