from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.vehicles import router as vehicles_router
from app.api.anpr import router as anpr_router
from app.api.challans import router as challans_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(vehicles_router)
api_router.include_router(anpr_router)
api_router.include_router(challans_router)
# Note: reports_router and admin_router are safely archived in major_project_archive/

