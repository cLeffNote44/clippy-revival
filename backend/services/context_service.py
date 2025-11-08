"""
Context-Aware Service
Provides context-aware assistance based on user's current activity
"""

import psutil
from typing import Dict, Optional, List
from services.logger import get_logger

logger = get_logger("context")


class ContextService:
    """Service for context-aware features"""

    def __init__(self):
        self.active_window = None
        self.suggestions_enabled = True
        logger.info("Context service initialized")

    def get_active_window(self) -> Optional[Dict]:
        """
        Get information about the currently active window
        Note: This requires platform-specific implementation
        - Windows: win32gui
        - macOS: AppKit
        - Linux: xdotool or wmctrl
        """
        try:
            # Placeholder implementation
            return {
                "title": "Active Window Title",
                "process": "application.exe",
                "class": "WindowClass"
            }
        except Exception as e:
            logger.error(f"Failed to get active window: {e}")
            return None

    def get_running_applications(self) -> List[Dict]:
        """Get list of running applications"""
        apps = []
        try:
            for proc in psutil.process_iter(['pid', 'name', 'exe']):
                try:
                    apps.append({
                        "pid": proc.info['pid'],
                        "name": proc.info['name'],
                        "path": proc.info['exe']
                    })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
        except Exception as e:
            logger.error(f"Failed to get running applications: {e}")

        return apps[:50]  # Limit to 50 most recent

    def detect_context(self) -> Dict:
        """Detect current context and provide smart suggestions"""
        context = {
            "active_window": self.get_active_window(),
            "suggestions": []
        }

        # Add context-based suggestions
        window = context.get("active_window")
        if window:
            title = window.get("title", "").lower()

            if "code" in title or "visual studio" in title:
                context["suggestions"].append({
                    "type": "coding",
                    "message": "I can help you with code reviews, debugging, or documentation",
                    "actions": ["Review code", "Explain code", "Find bugs"]
                })
            elif "browser" in title or "chrome" in title or "firefox" in title:
                context["suggestions"].append({
                    "type": "browsing",
                    "message": "I can summarize pages, extract information, or help with research",
                    "actions": ["Summarize page", "Extract data", "Research topic"]
                })
            elif "word" in title or "document" in title:
                context["suggestions"].append({
                    "type": "writing",
                    "message": "I can help with writing, editing, or formatting",
                    "actions": ["Proofread", "Improve writing", "Format document"]
                })

        return context

    def get_screen_content(self) -> Optional[str]:
        """
        Get text content from screen (OCR)
        Note: Requires OCR library like Tesseract
        """
        try:
            # Placeholder for OCR implementation
            logger.info("Screen OCR requested (placeholder)")
            return "Screen content would appear here"
        except Exception as e:
            logger.error(f"Screen OCR error: {e}")
            return None

    def analyze_clipboard_context(self, clipboard_content: str) -> Dict:
        """Analyze clipboard content and provide contextual suggestions"""
        suggestions = []

        # Detect URLs
        if clipboard_content.startswith(("http://", "https://")):
            suggestions.append({
                "type": "url",
                "action": "Open URL",
                "description": "Open this link in browser"
            })

        # Detect code
        if any(keyword in clipboard_content for keyword in ["function", "class", "def", "const", "var"]):
            suggestions.append({
                "type": "code",
                "action": "Analyze code",
                "description": "I can explain this code or find issues"
            })

        # Detect email
        if "@" in clipboard_content and "." in clipboard_content:
            suggestions.append({
                "type": "email",
                "action": "Compose email",
                "description": "Draft an email to this address"
            })

        return {
            "content_type": "detected",
            "suggestions": suggestions
        }

    def get_smart_suggestions(self) -> List[Dict]:
        """Get smart suggestions based on current context"""
        suggestions = []

        # Time-based suggestions
        from datetime import datetime
        hour = datetime.now().hour

        if 6 <= hour < 12:
            suggestions.append({
                "type": "time",
                "message": "Good morning! Ready to start the day?",
                "actions": ["Morning briefing", "Check calendar", "Review tasks"]
            })
        elif 12 <= hour < 18:
            suggestions.append({
                "type": "time",
                "message": "Afternoon productivity check",
                "actions": ["Review progress", "Take a break", "Plan evening"]
            })

        return suggestions


# Singleton
_context_service = None

def get_context_service() -> ContextService:
    global _context_service
    if _context_service is None:
        _context_service = ContextService()
    return _context_service
