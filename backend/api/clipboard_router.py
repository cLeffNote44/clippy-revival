"""
Clipboard API Router
Provides endpoints for clipboard history management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from services.clipboard_service import get_clipboard_service
from services.ollama_service import OllamaService
from services.logger import get_logger

router = APIRouter(prefix="/clipboard", tags=["clipboard"])
logger = get_logger("clipboard-api")


class ClipboardItem(BaseModel):
    """Clipboard item model"""
    content: str
    type: str = "text"
    metadata: Optional[Dict] = None


class ClipboardItemUpdate(BaseModel):
    """Clipboard item update model"""
    category: Optional[str] = None
    pinned: Optional[bool] = None
    metadata: Optional[Dict] = None


class AnalyzeRequest(BaseModel):
    """AI analysis request"""
    content: str


@router.post("/add")
async def add_clipboard_item(item: ClipboardItem):
    """Add item to clipboard history"""
    try:
        clipboard_service = get_clipboard_service(OllamaService())
        result = await clipboard_service.add_item(
            content=item.content,
            content_type=item.type,
            metadata=item.metadata
        )

        return {
            "success": True,
            "item": result
        }
    except Exception as e:
        logger.error(f"Failed to add clipboard item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_clipboard_history(
    limit: int = 100,
    offset: int = 0,
    category: Optional[str] = None,
    search: Optional[str] = None,
    pinned_only: bool = False
):
    """Get clipboard history with filtering"""
    try:
        clipboard_service = get_clipboard_service()
        result = clipboard_service.get_history(
            limit=limit,
            offset=offset,
            category=category,
            search=search,
            pinned_only=pinned_only
        )

        return {
            "success": True,
            **result
        }
    except Exception as e:
        logger.error(f"Failed to get clipboard history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/item/{item_id}")
async def get_clipboard_item(item_id: str):
    """Get specific clipboard item"""
    try:
        clipboard_service = get_clipboard_service()
        item = clipboard_service.get_item(item_id)

        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        return {
            "success": True,
            "item": item
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get clipboard item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/item/{item_id}")
async def update_clipboard_item(item_id: str, update: ClipboardItemUpdate):
    """Update clipboard item"""
    try:
        clipboard_service = get_clipboard_service()

        update_data = {}
        if update.category is not None:
            update_data["category"] = update.category
        if update.pinned is not None:
            update_data["pinned"] = update.pinned
        if update.metadata is not None:
            update_data["metadata"] = update.metadata

        success = clipboard_service.update_item(item_id, update_data)

        if not success:
            raise HTTPException(status_code=404, detail="Item not found")

        return {
            "success": True,
            "message": "Item updated successfully",
            "item": clipboard_service.get_item(item_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update clipboard item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/item/{item_id}")
async def delete_clipboard_item(item_id: str):
    """Delete clipboard item"""
    try:
        clipboard_service = get_clipboard_service()
        success = clipboard_service.delete_item(item_id)

        if not success:
            raise HTTPException(status_code=404, detail="Item not found")

        return {
            "success": True,
            "message": "Item deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete clipboard item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear")
async def clear_clipboard_history(keep_pinned: bool = True):
    """Clear clipboard history"""
    try:
        clipboard_service = get_clipboard_service()
        deleted_count = clipboard_service.clear_history(keep_pinned=keep_pinned)

        return {
            "success": True,
            "message": f"Cleared {deleted_count} items",
            "deleted_count": deleted_count
        }
    except Exception as e:
        logger.error(f"Failed to clear clipboard history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear-old")
async def clear_old_items(days: int = 30):
    """Clear old clipboard items"""
    try:
        clipboard_service = get_clipboard_service()
        deleted_count = clipboard_service.clear_old_items(days=days)

        return {
            "success": True,
            "message": f"Cleared {deleted_count} items older than {days} days",
            "deleted_count": deleted_count
        }
    except Exception as e:
        logger.error(f"Failed to clear old items: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_clipboard_statistics():
    """Get clipboard statistics"""
    try:
        clipboard_service = get_clipboard_service()
        stats = clipboard_service.get_statistics()

        return {
            "success": True,
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_clipboard_content(request: AnalyzeRequest):
    """Analyze clipboard content with AI"""
    try:
        clipboard_service = get_clipboard_service(OllamaService())
        analysis = await clipboard_service.analyze_with_ai(request.content)

        if not analysis:
            raise HTTPException(status_code=503, detail="AI analysis not available")

        return {
            "success": True,
            "analysis": analysis
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories():
    """Get list of all categories"""
    try:
        clipboard_service = get_clipboard_service()
        stats = clipboard_service.get_statistics()

        categories = list(stats["categories"].keys())

        return {
            "success": True,
            "categories": categories,
            "counts": stats["categories"]
        }
    except Exception as e:
        logger.error(f"Failed to get categories: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
