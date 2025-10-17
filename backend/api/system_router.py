from fastapi import APIRouter
from services.system_service import SystemService

router = APIRouter()
system_service = SystemService()

@router.get("/metrics")
async def get_metrics():
    return await system_service.get_metrics()