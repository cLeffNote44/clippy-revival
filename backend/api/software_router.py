from fastapi import APIRouter
from pydantic import BaseModel
from services.software_service import SoftwareService
from typing import Optional

router = APIRouter()
software_service = SoftwareService()

class InstallRequest(BaseModel):
    package_id: str
    silent: bool = True

class UninstallRequest(BaseModel):
    package_id: str
    silent: bool = True

class UpgradeRequest(BaseModel):
    package_id: Optional[str] = None
    upgrade_all: bool = False

@router.get("/search")
async def search_software(query: str, max_results: int = 20):
    """Search for software packages"""
    return await software_service.search_software(query, max_results)

@router.get("/installed")
async def get_installed():
    """List installed software"""
    return await software_service.get_installed_software()

@router.post("/install")
async def install_software(request: InstallRequest):
    """Install a software package"""
    return await software_service.install_software(
        request.package_id,
        request.silent
    )

@router.post("/uninstall")
async def uninstall_software(request: UninstallRequest):
    """Uninstall a software package"""
    return await software_service.uninstall_software(
        request.package_id,
        request.silent
    )

@router.post("/upgrade")
async def upgrade_software(request: UpgradeRequest):
    """Upgrade software package(s)"""
    return await software_service.upgrade_software(
        request.package_id,
        request.upgrade_all
    )

@router.get("/info/{package_id}")
async def get_package_info(package_id: str):
    """Get detailed package information"""
    return await software_service.get_package_info(package_id)
