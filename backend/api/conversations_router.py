"""
Conversations API Router
Provides endpoints for conversation history management
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from services.conversation_db import get_conversation_db
from services.logger import get_logger

router = APIRouter(prefix="/conversations", tags=["conversations"])
logger = get_logger("conversations-api")


@router.get("/sessions")
async def get_sessions(search: Optional[str] = None, limit: int = 100):
    """Get all conversation sessions"""
    try:
        db = get_conversation_db()
        sessions = db.list_sessions(limit=limit)

        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            sessions = [
                s for s in sessions
                if search_lower in s.get("session_id", "").lower() or
                   search_lower in str(s.get("model", "")).lower()
            ]

        return {
            "success": True,
            "sessions": sessions,
            "count": len(sessions)
        }
    except Exception as e:
        logger.error(f"Failed to get sessions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(session_id: str, limit: int = 100):
    """Get messages for a specific session"""
    try:
        db = get_conversation_db()
        messages = db.get_session_history(session_id, max_messages=limit)

        if not messages:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "success": True,
            "session_id": session_id,
            "messages": messages,
            "count": len(messages)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/export")
async def export_session(session_id: str):
    """Export a session as JSON"""
    try:
        db = get_conversation_db()
        messages = db.get_session_history(session_id, max_messages=10000)

        if not messages:
            raise HTTPException(status_code=404, detail="Session not found")

        # Get session metadata
        sessions = db.list_sessions()
        session_meta = next((s for s in sessions if s.get("session_id") == session_id), {})

        return {
            "success": True,
            "session_id": session_id,
            "metadata": session_meta,
            "messages": messages,
            "exported_at": db._get_timestamp()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a conversation session"""
    try:
        db = get_conversation_db()
        success = db.delete_session(session_id)

        if not success:
            raise HTTPException(status_code=404, detail="Session not found")

        logger.info(f"Deleted session: {session_id}")

        return {
            "success": True,
            "message": f"Session {session_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_conversations(query: str, limit: int = 50):
    """Search through all conversations"""
    try:
        db = get_conversation_db()
        results = db.search_messages(query, limit=limit)

        return {
            "success": True,
            "query": query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        logger.error(f"Failed to search conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_statistics():
    """Get conversation statistics"""
    try:
        db = get_conversation_db()
        stats = db.get_statistics()

        return {
            "success": True,
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export-all")
async def export_all_conversations():
    """Export all conversations"""
    try:
        db = get_conversation_db()
        sessions = db.list_sessions(limit=10000)

        all_conversations = []
        for session in sessions:
            messages = db.get_session_history(session["session_id"], max_messages=10000)
            all_conversations.append({
                "session_id": session["session_id"],
                "metadata": session,
                "messages": messages
            })

        return {
            "success": True,
            "conversations": all_conversations,
            "count": len(all_conversations),
            "exported_at": db._get_timestamp()
        }
    except Exception as e:
        logger.error(f"Failed to export all conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear-all")
async def clear_all_conversations():
    """Delete all conversations"""
    try:
        db = get_conversation_db()

        # Get count before clearing
        sessions = db.list_sessions()
        count = len(sessions)

        # Delete each session
        for session in sessions:
            db.delete_session(session["session_id"])

        logger.info(f"Cleared all conversations ({count} sessions)")

        return {
            "success": True,
            "message": f"Cleared {count} conversations",
            "deleted_count": count
        }
    except Exception as e:
        logger.error(f"Failed to clear all conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear-old")
async def clear_old_conversations(days: int = 30):
    """Delete conversations older than specified days"""
    try:
        db = get_conversation_db()
        deleted_count = db.clear_old_sessions(days=days)

        logger.info(f"Cleared {deleted_count} old conversations")

        return {
            "success": True,
            "message": f"Cleared {deleted_count} conversations older than {days} days",
            "deleted_count": deleted_count
        }
    except Exception as e:
        logger.error(f"Failed to clear old conversations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
