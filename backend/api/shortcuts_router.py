"""
Keyboard Shortcuts API Router
Provides endpoints for managing keyboard shortcuts
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.shortcuts_service import get_shortcuts_service
from services.logger import get_logger

router = APIRouter(prefix="/shortcuts", tags=["shortcuts"])
logger = get_logger("shortcuts-api")


class ShortcutUpdate(BaseModel):
    """Shortcut update request"""
    name: Optional[str] = None
    description: Optional[str] = None
    shortcut: Optional[str] = None
    action: Optional[str] = None
    global_: Optional[bool] = None
    enabled: Optional[bool] = None


class ShortcutCreate(BaseModel):
    """Shortcut creation request"""
    name: str
    description: str = ""
    shortcut: str
    action: str
    global_: bool = False
    enabled: bool = True


@router.get("/")
async def get_all_shortcuts():
    """Get all registered shortcuts"""
    try:
        shortcuts_service = get_shortcuts_service()
        shortcuts = shortcuts_service.get_all_shortcuts()

        return {
            "success": True,
            "shortcuts": shortcuts,
            "count": len(shortcuts)
        }
    except Exception as e:
        logger.error(f"Failed to get shortcuts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get shortcuts: {str(e)}")


@router.get("/global")
async def get_global_shortcuts():
    """Get only global shortcuts"""
    try:
        shortcuts_service = get_shortcuts_service()
        shortcuts = shortcuts_service.get_shortcuts_by_context(global_context=True)

        return {
            "success": True,
            "shortcuts": shortcuts,
            "count": len(shortcuts)
        }
    except Exception as e:
        logger.error(f"Failed to get global shortcuts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/local")
async def get_local_shortcuts():
    """Get only local (non-global) shortcuts"""
    try:
        shortcuts_service = get_shortcuts_service()
        shortcuts = shortcuts_service.get_shortcuts_by_context(global_context=False)

        return {
            "success": True,
            "shortcuts": shortcuts,
            "count": len(shortcuts)
        }
    except Exception as e:
        logger.error(f"Failed to get local shortcuts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{shortcut_id}")
async def get_shortcut(shortcut_id: str):
    """Get a specific shortcut by ID"""
    try:
        shortcuts_service = get_shortcuts_service()
        shortcut = shortcuts_service.get_shortcut(shortcut_id)

        if not shortcut:
            raise HTTPException(status_code=404, detail=f"Shortcut '{shortcut_id}' not found")

        return {
            "success": True,
            "shortcut": shortcut
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get shortcut {shortcut_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{shortcut_id}")
async def update_shortcut(shortcut_id: str, update: ShortcutUpdate):
    """Update a shortcut configuration"""
    try:
        shortcuts_service = get_shortcuts_service()

        # Build update dict
        update_data = {}
        if update.name is not None:
            update_data["name"] = update.name
        if update.description is not None:
            update_data["description"] = update.description
        if update.shortcut is not None:
            # Validate shortcut format
            if not shortcuts_service.validate_shortcut(update.shortcut):
                raise HTTPException(status_code=400, detail="Invalid shortcut format")

            # Check for conflicts
            conflict = shortcuts_service.check_conflict(update.shortcut, exclude_id=shortcut_id)
            if conflict:
                raise HTTPException(
                    status_code=409,
                    detail=f"Shortcut conflicts with existing shortcut: {conflict}"
                )

            update_data["shortcut"] = update.shortcut
        if update.action is not None:
            update_data["action"] = update.action
        if update.global_ is not None:
            update_data["global"] = update.global_
        if update.enabled is not None:
            update_data["enabled"] = update.enabled

        success = shortcuts_service.update_shortcut(shortcut_id, update_data)

        if not success:
            raise HTTPException(status_code=404, detail=f"Shortcut '{shortcut_id}' not found")

        return {
            "success": True,
            "message": f"Shortcut '{shortcut_id}' updated successfully",
            "shortcut": shortcuts_service.get_shortcut(shortcut_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update shortcut {shortcut_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_shortcut(shortcut: ShortcutCreate):
    """Create a new custom shortcut"""
    try:
        shortcuts_service = get_shortcuts_service()

        # Generate ID from name
        shortcut_id = shortcut.name.lower().replace(" ", "_")

        # Validate shortcut format
        if not shortcuts_service.validate_shortcut(shortcut.shortcut):
            raise HTTPException(status_code=400, detail="Invalid shortcut format")

        # Check for conflicts
        conflict = shortcuts_service.check_conflict(shortcut.shortcut)
        if conflict:
            raise HTTPException(
                status_code=409,
                detail=f"Shortcut conflicts with existing shortcut: {conflict}"
            )

        # Create shortcut
        shortcut_data = {
            "name": shortcut.name,
            "description": shortcut.description,
            "shortcut": shortcut.shortcut,
            "action": shortcut.action,
            "global": shortcut.global_,
            "enabled": shortcut.enabled
        }

        success = shortcuts_service.create_custom_shortcut(shortcut_id, shortcut_data)

        if not success:
            raise HTTPException(status_code=400, detail=f"Shortcut '{shortcut_id}' already exists")

        logger.info(f"Created custom shortcut: {shortcut_id}")

        return {
            "success": True,
            "message": f"Shortcut '{shortcut_id}' created successfully",
            "shortcut_id": shortcut_id,
            "shortcut": shortcuts_service.get_shortcut(shortcut_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create shortcut: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{shortcut_id}")
async def delete_shortcut(shortcut_id: str):
    """Delete a custom shortcut"""
    try:
        shortcuts_service = get_shortcuts_service()
        success = shortcuts_service.delete_shortcut(shortcut_id)

        if not success:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete shortcut '{shortcut_id}' (not found or is default shortcut)"
            )

        logger.info(f"Deleted shortcut: {shortcut_id}")

        return {
            "success": True,
            "message": f"Shortcut '{shortcut_id}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete shortcut {shortcut_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_shortcut(shortcut: str):
    """Validate a shortcut string"""
    try:
        shortcuts_service = get_shortcuts_service()
        is_valid = shortcuts_service.validate_shortcut(shortcut)

        # Check for conflicts
        conflict = None
        if is_valid:
            conflict = shortcuts_service.check_conflict(shortcut)

        return {
            "success": True,
            "valid": is_valid,
            "conflict": conflict,
            "message": "Shortcut is valid" if is_valid else "Invalid shortcut format"
        }
    except Exception as e:
        logger.error(f"Failed to validate shortcut: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_shortcuts():
    """Reset all shortcuts to defaults"""
    try:
        shortcuts_service = get_shortcuts_service()
        shortcuts_service.shortcuts = shortcuts_service.get_default_shortcuts()
        shortcuts_service.save_shortcuts()

        logger.info("Reset shortcuts to defaults")

        return {
            "success": True,
            "message": "Shortcuts reset to defaults",
            "shortcuts": shortcuts_service.get_all_shortcuts()
        }
    except Exception as e:
        logger.error(f"Failed to reset shortcuts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
