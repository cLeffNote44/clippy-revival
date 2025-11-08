"""
Keyboard Shortcuts Service
Manages keyboard shortcuts registration and execution
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Callable
from services.logger import get_logger

logger = get_logger("shortcuts")


class ShortcutsService:
    """Service for managing keyboard shortcuts"""

    def __init__(self):
        self.shortcuts_file = Path(__file__).parent.parent.parent / "shortcuts.json"
        self.shortcuts: Dict[str, Dict] = {}
        self.actions: Dict[str, Callable] = {}
        self.load_shortcuts()
        self.register_default_actions()

    def load_shortcuts(self):
        """Load shortcuts from config file"""
        if self.shortcuts_file.exists():
            try:
                with open(self.shortcuts_file, 'r') as f:
                    self.shortcuts = json.load(f)
                logger.info(f"Loaded {len(self.shortcuts)} shortcuts")
            except Exception as e:
                logger.error(f"Failed to load shortcuts: {e}")
                self.shortcuts = self.get_default_shortcuts()
        else:
            self.shortcuts = self.get_default_shortcuts()
            self.save_shortcuts()

    def save_shortcuts(self):
        """Save shortcuts to config file"""
        try:
            with open(self.shortcuts_file, 'w') as f:
                json.dump(self.shortcuts, f, indent=2)
            logger.info("Shortcuts saved successfully")
        except Exception as e:
            logger.error(f"Failed to save shortcuts: {e}")

    def get_default_shortcuts(self) -> Dict[str, Dict]:
        """Get default keyboard shortcuts"""
        return {
            "summon_clippy": {
                "name": "Summon Clippy",
                "description": "Open Clippy window",
                "shortcut": "Ctrl+Alt+C",
                "action": "summon_clippy",
                "global": True,
                "enabled": True
            },
            "quick_actions": {
                "name": "Quick Actions",
                "description": "Open quick actions palette",
                "shortcut": "Ctrl+K",
                "action": "show_quick_actions",
                "global": False,
                "enabled": True
            },
            "new_conversation": {
                "name": "New Conversation",
                "description": "Start a new conversation",
                "shortcut": "Ctrl+N",
                "action": "new_conversation",
                "global": False,
                "enabled": True
            },
            "search_conversations": {
                "name": "Search Conversations",
                "description": "Search through conversation history",
                "shortcut": "Ctrl+Shift+F",
                "action": "search_conversations",
                "global": False,
                "enabled": True
            },
            "toggle_pause": {
                "name": "Toggle Pause",
                "description": "Pause/resume assistant",
                "shortcut": "Ctrl+Shift+P",
                "action": "toggle_pause",
                "global": True,
                "enabled": True
            },
            "clipboard_history": {
                "name": "Clipboard History",
                "description": "Open clipboard history",
                "shortcut": "Ctrl+Shift+V",
                "action": "show_clipboard_history",
                "global": True,
                "enabled": True
            },
            "take_screenshot": {
                "name": "Take Screenshot",
                "description": "Take screenshot and ask Clippy about it",
                "shortcut": "Ctrl+Shift+S",
                "action": "take_screenshot",
                "global": True,
                "enabled": True
            },
            "voice_input": {
                "name": "Voice Input",
                "description": "Start voice input",
                "shortcut": "Ctrl+Shift+Space",
                "action": "start_voice_input",
                "global": True,
                "enabled": True
            },
            "open_settings": {
                "name": "Open Settings",
                "description": "Open Clippy settings",
                "shortcut": "Ctrl+,",
                "action": "open_settings",
                "global": False,
                "enabled": True
            },
            "show_plugins": {
                "name": "Plugin Manager",
                "description": "Open plugin manager",
                "shortcut": "Ctrl+Shift+E",
                "action": "show_plugins",
                "global": False,
                "enabled": True
            }
        }

    def register_default_actions(self):
        """Register default action handlers"""
        # These are placeholder actions - actual implementation will be in frontend
        self.actions = {
            "summon_clippy": lambda: logger.info("Summon Clippy action"),
            "show_quick_actions": lambda: logger.info("Show quick actions"),
            "new_conversation": lambda: logger.info("New conversation"),
            "search_conversations": lambda: logger.info("Search conversations"),
            "toggle_pause": lambda: logger.info("Toggle pause"),
            "show_clipboard_history": lambda: logger.info("Show clipboard history"),
            "take_screenshot": lambda: logger.info("Take screenshot"),
            "start_voice_input": lambda: logger.info("Start voice input"),
            "open_settings": lambda: logger.info("Open settings"),
            "show_plugins": lambda: logger.info("Show plugins")
        }

    def get_all_shortcuts(self) -> Dict[str, Dict]:
        """Get all registered shortcuts"""
        return self.shortcuts

    def get_shortcut(self, shortcut_id: str) -> Optional[Dict]:
        """Get a specific shortcut by ID"""
        return self.shortcuts.get(shortcut_id)

    def update_shortcut(self, shortcut_id: str, shortcut_data: Dict) -> bool:
        """Update a shortcut configuration"""
        if shortcut_id not in self.shortcuts:
            logger.warning(f"Shortcut {shortcut_id} not found")
            return False

        self.shortcuts[shortcut_id].update(shortcut_data)
        self.save_shortcuts()
        logger.info(f"Updated shortcut: {shortcut_id}")
        return True

    def create_custom_shortcut(self, shortcut_id: str, shortcut_data: Dict) -> bool:
        """Create a new custom shortcut"""
        if shortcut_id in self.shortcuts:
            logger.warning(f"Shortcut {shortcut_id} already exists")
            return False

        required_fields = ["name", "shortcut", "action"]
        if not all(field in shortcut_data for field in required_fields):
            logger.error("Missing required fields for shortcut")
            return False

        self.shortcuts[shortcut_id] = {
            "name": shortcut_data["name"],
            "description": shortcut_data.get("description", ""),
            "shortcut": shortcut_data["shortcut"],
            "action": shortcut_data["action"],
            "global": shortcut_data.get("global", False),
            "enabled": shortcut_data.get("enabled", True),
            "custom": True
        }

        self.save_shortcuts()
        logger.info(f"Created custom shortcut: {shortcut_id}")
        return True

    def delete_shortcut(self, shortcut_id: str) -> bool:
        """Delete a custom shortcut"""
        if shortcut_id not in self.shortcuts:
            return False

        # Don't allow deleting default shortcuts
        if not self.shortcuts[shortcut_id].get("custom", False):
            logger.warning(f"Cannot delete default shortcut: {shortcut_id}")
            return False

        del self.shortcuts[shortcut_id]
        self.save_shortcuts()
        logger.info(f"Deleted shortcut: {shortcut_id}")
        return True

    def register_action(self, action_id: str, handler: Callable):
        """Register an action handler"""
        self.actions[action_id] = handler
        logger.info(f"Registered action handler: {action_id}")

    def execute_action(self, action_id: str, **kwargs):
        """Execute a registered action"""
        if action_id not in self.actions:
            logger.warning(f"Action {action_id} not found")
            return None

        try:
            return self.actions[action_id](**kwargs)
        except Exception as e:
            logger.error(f"Failed to execute action {action_id}: {e}")
            return None

    def get_shortcuts_by_context(self, global_context: bool = True) -> List[Dict]:
        """Get shortcuts filtered by context (global vs local)"""
        return [
            {"id": k, **v}
            for k, v in self.shortcuts.items()
            if v.get("enabled", True) and v.get("global", False) == global_context
        ]

    def validate_shortcut(self, shortcut: str) -> bool:
        """Validate shortcut string format"""
        # Basic validation - can be enhanced
        valid_modifiers = ["Ctrl", "Alt", "Shift", "Meta", "Cmd"]
        parts = shortcut.split("+")

        if len(parts) < 2:
            return False

        # Check if all but last part are valid modifiers
        for part in parts[:-1]:
            if part not in valid_modifiers:
                return False

        # Last part should be a key
        return len(parts[-1]) >= 1

    def check_conflict(self, shortcut: str, exclude_id: Optional[str] = None) -> Optional[str]:
        """Check if shortcut conflicts with existing shortcuts"""
        for shortcut_id, shortcut_data in self.shortcuts.items():
            if exclude_id and shortcut_id == exclude_id:
                continue

            if shortcut_data.get("shortcut") == shortcut and shortcut_data.get("enabled", True):
                return shortcut_id

        return None


# Singleton instance
_shortcuts_service = None


def get_shortcuts_service() -> ShortcutsService:
    """Get or create shortcuts service instance"""
    global _shortcuts_service
    if _shortcuts_service is None:
        _shortcuts_service = ShortcutsService()
    return _shortcuts_service
