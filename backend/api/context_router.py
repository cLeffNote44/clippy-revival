"""
Context-Aware API Router
Provides endpoints for context-aware assistance
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.context_service import get_context_service
from services.logger import get_logger

router = APIRouter(prefix="/context", tags=["context"])
logger = get_logger("context-api")


class ClipboardAnalysisRequest(BaseModel):
    """Clipboard analysis request"""
    content: str


@router.get("/active-window")
async def get_active_window():
    """Get information about the currently active window"""
    try:
        context_service = get_context_service()
        window_info = context_service.get_active_window()

        if not window_info:
            return {
                "success": True,
                "window": None,
                "message": "Unable to detect active window"
            }

        return {
            "success": True,
            "window": window_info
        }
    except Exception as e:
        logger.error(f"Failed to get active window: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/running-apps")
async def get_running_applications():
    """Get list of running applications"""
    try:
        context_service = get_context_service()
        apps = context_service.get_running_applications()

        return {
            "success": True,
            "applications": apps,
            "count": len(apps)
        }
    except Exception as e:
        logger.error(f"Failed to get running applications: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detect")
async def detect_context():
    """Detect current context and provide smart suggestions"""
    try:
        context_service = get_context_service()
        context = context_service.detect_context()

        return {
            "success": True,
            **context
        }
    except Exception as e:
        logger.error(f"Failed to detect context: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions")
async def get_smart_suggestions():
    """Get smart suggestions based on current context"""
    try:
        context_service = get_context_service()
        suggestions = context_service.get_smart_suggestions()

        return {
            "success": True,
            "suggestions": suggestions,
            "count": len(suggestions)
        }
    except Exception as e:
        logger.error(f"Failed to get suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-clipboard")
async def analyze_clipboard(request: ClipboardAnalysisRequest):
    """Analyze clipboard content and provide contextual suggestions"""
    try:
        context_service = get_context_service()
        analysis = context_service.analyze_clipboard_context(request.content)

        return {
            "success": True,
            **analysis
        }
    except Exception as e:
        logger.error(f"Failed to analyze clipboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/screen-content")
async def get_screen_content():
    """
    Get text content from screen using OCR
    Note: Requires OCR integration (Tesseract, etc.)
    """
    try:
        context_service = get_context_service()
        content = context_service.get_screen_content()

        if content is None:
            return {
                "success": True,
                "content": None,
                "message": "OCR service not available"
            }

        return {
            "success": True,
            "content": content
        }
    except Exception as e:
        logger.error(f"Failed to get screen content: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enable-suggestions")
async def enable_suggestions(enabled: bool = True):
    """Enable or disable smart suggestions"""
    try:
        context_service = get_context_service()
        context_service.suggestions_enabled = enabled

        return {
            "success": True,
            "message": f"Suggestions {'enabled' if enabled else 'disabled'}",
            "enabled": enabled
        }
    except Exception as e:
        logger.error(f"Failed to toggle suggestions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_context_status():
    """Get context service status"""
    try:
        context_service = get_context_service()

        return {
            "success": True,
            "suggestions_enabled": context_service.suggestions_enabled,
            "active_window": context_service.get_active_window() is not None
        }
    except Exception as e:
        logger.error(f"Failed to get context status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
