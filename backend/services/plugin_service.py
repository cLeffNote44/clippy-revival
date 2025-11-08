"""
Plugin Service
Manages plugin loading, execution, and lifecycle
"""

import os
import json
import importlib.util
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from jsonschema import validate, ValidationError
from services.logger import get_logger

logger = get_logger("plugins")


class Plugin:
    """Represents a loaded plugin"""

    def __init__(self, manifest: Dict, plugin_dir: Path):
        self.manifest = manifest
        self.plugin_dir = plugin_dir
        self.id = manifest["id"]
        self.name = manifest["name"]
        self.version = manifest["version"]
        self.enabled = False
        self.instance = None
        self.settings = {}

    def get_permission_level(self) -> str:
        """Get plugin permission level based on requested permissions"""
        permissions = self.manifest.get("permissions", [])

        dangerous_perms = ["files.delete", "system.execute", "files.write"]
        network_perms = ["network.http", "network.websocket"]

        if any(p in permissions for p in dangerous_perms):
            return "high"
        elif any(p in permissions for p in network_perms):
            return "medium"
        else:
            return "low"


class PluginAPI:
    """API exposed to plugins - sandboxed interface"""

    def __init__(self, plugin: Plugin, plugin_service: 'PluginService'):
        self.plugin = plugin
        self.plugin_service = plugin_service
        self.permissions = set(plugin.manifest.get("permissions", []))

    def _check_permission(self, permission: str):
        """Check if plugin has required permission"""
        if permission not in self.permissions:
            raise PermissionError(f"Plugin '{self.plugin.id}' does not have '{permission}' permission")

    # AI Methods
    def chat(self, message: str, session_id: str = None) -> Dict:
        """Send a message to AI"""
        self._check_permission("ai.chat")
        from services.ollama_service import OllamaService

        ollama = OllamaService()
        session = session_id or f"plugin-{self.plugin.id}"

        import asyncio
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(ollama.chat(message, session))

    def get_models(self) -> List[str]:
        """Get available AI models"""
        self._check_permission("ai.models")
        from services.ollama_service import OllamaService

        ollama = OllamaService()
        import asyncio
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(ollama.list_models())

    # System Methods
    def get_system_metrics(self) -> Dict:
        """Get system metrics"""
        self._check_permission("system.metrics")
        from services.system_service import SystemService

        system = SystemService()
        return system.get_metrics()

    # Notification Methods
    def show_notification(self, title: str, message: str, icon: str = "info"):
        """Show a notification"""
        self._check_permission("notifications.show")

        notification = {
            "plugin_id": self.plugin.id,
            "title": title,
            "message": message,
            "icon": icon
        }

        # Broadcast via WebSocket
        self.plugin_service.broadcast_event("notification", notification)
        logger.info(f"Plugin {self.plugin.id} showed notification: {title}")

    # Storage Methods
    def get_storage(self, key: str, default: Any = None) -> Any:
        """Get value from plugin storage"""
        self._check_permission("storage.read")
        return self.plugin_service.get_plugin_storage(self.plugin.id, key, default)

    def set_storage(self, key: str, value: Any):
        """Set value in plugin storage"""
        self._check_permission("storage.write")
        self.plugin_service.set_plugin_storage(self.plugin.id, key, value)

    # Settings Methods
    def get_setting(self, key: str, default: Any = None) -> Any:
        """Get plugin setting"""
        return self.plugin.settings.get(key, default)

    def set_setting(self, key: str, value: Any):
        """Set plugin setting"""
        self.plugin.settings[key] = value
        self.plugin_service.save_plugin_settings(self.plugin.id, self.plugin.settings)

    # Scheduler Methods
    def create_task(self, name: str, action: str, schedule_type: str, schedule_value: Any):
        """Create a scheduled task"""
        self._check_permission("scheduler.create")
        from services.scheduler_service import get_scheduler_service

        scheduler = get_scheduler_service()
        task_id = scheduler.create_task(
            name=f"[{self.plugin.name}] {name}",
            action=action,
            parameters={"plugin_id": self.plugin.id},
            schedule_type=schedule_type,
            schedule_value=schedule_value
        )

        logger.info(f"Plugin {self.plugin.id} created task {task_id}")
        return task_id

    # HTTP Methods
    def http_get(self, url: str, headers: Dict = None) -> Dict:
        """Make HTTP GET request"""
        self._check_permission("network.http")
        import httpx

        response = httpx.get(url, headers=headers or {}, timeout=10)
        return {
            "status": response.status_code,
            "headers": dict(response.headers),
            "body": response.text
        }

    def http_post(self, url: str, data: Any = None, headers: Dict = None) -> Dict:
        """Make HTTP POST request"""
        self._check_permission("network.http")
        import httpx

        response = httpx.post(url, json=data, headers=headers or {}, timeout=10)
        return {
            "status": response.status_code,
            "headers": dict(response.headers),
            "body": response.text
        }

    # Logging Methods
    def log_info(self, message: str):
        """Log info message"""
        logger.info(f"[Plugin:{self.plugin.id}] {message}")

    def log_error(self, message: str):
        """Log error message"""
        logger.error(f"[Plugin:{self.plugin.id}] {message}")

    def log_warning(self, message: str):
        """Log warning message"""
        logger.warning(f"[Plugin:{self.plugin.id}] {message}")


class PluginService:
    """Service for managing plugins"""

    def __init__(self, plugins_dir: str = None):
        if plugins_dir is None:
            plugins_dir = Path(__file__).parent.parent.parent / "plugins"

        self.plugins_dir = Path(plugins_dir)
        self.plugins_dir.mkdir(exist_ok=True)

        self.plugins: Dict[str, Plugin] = {}
        self.schema = self._load_schema()
        self.event_handlers: Dict[str, List[Callable]] = {}

        logger.info(f"PluginService initialized with plugins dir: {self.plugins_dir}")

    def _load_schema(self) -> Dict:
        """Load plugin manifest schema"""
        schema_path = self.plugins_dir / "plugin-schema.json"
        if schema_path.exists():
            with open(schema_path) as f:
                return json.load(f)
        return {}

    def discover_plugins(self) -> List[str]:
        """Discover available plugins"""
        plugins = []

        for item in self.plugins_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                manifest_path = item / "plugin.json"
                if manifest_path.exists():
                    plugins.append(item.name)

        logger.info(f"Discovered {len(plugins)} plugins: {plugins}")
        return plugins

    def load_plugin(self, plugin_id: str) -> bool:
        """Load a plugin"""
        try:
            plugin_dir = self.plugins_dir / plugin_id
            manifest_path = plugin_dir / "plugin.json"

            if not manifest_path.exists():
                logger.error(f"Plugin {plugin_id} manifest not found")
                return False

            # Load and validate manifest
            with open(manifest_path) as f:
                manifest = json.load(f)

            if self.schema:
                try:
                    validate(instance=manifest, schema=self.schema)
                except ValidationError as e:
                    logger.error(f"Plugin {plugin_id} manifest validation failed: {e}")
                    return False

            # Check if already loaded
            if plugin_id in self.plugins:
                logger.warning(f"Plugin {plugin_id} already loaded")
                return True

            # Create plugin instance
            plugin = Plugin(manifest, plugin_dir)

            # Load plugin settings
            plugin.settings = self._load_plugin_settings(plugin_id)

            # Store plugin
            self.plugins[plugin_id] = plugin

            logger.info(f"Plugin {plugin_id} loaded successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to load plugin {plugin_id}: {e}", exc_info=True)
            return False

    def enable_plugin(self, plugin_id: str) -> bool:
        """Enable a plugin"""
        try:
            if plugin_id not in self.plugins:
                if not self.load_plugin(plugin_id):
                    return False

            plugin = self.plugins[plugin_id]

            if plugin.enabled:
                logger.warning(f"Plugin {plugin_id} already enabled")
                return True

            # Load plugin code
            entry_file = plugin.plugin_dir / plugin.manifest["entry"]

            if not entry_file.exists():
                logger.error(f"Plugin {plugin_id} entry file not found: {entry_file}")
                return False

            # Create plugin API
            api = PluginAPI(plugin, self)

            # Execute plugin code
            spec = importlib.util.spec_from_file_location(plugin_id, entry_file)
            module = importlib.util.module_from_spec(spec)
            sys.modules[plugin_id] = module

            # Inject API
            module.clippy = api

            # Execute module
            spec.loader.exec_module(module)

            # Call activate if exists
            if hasattr(module, 'activate'):
                module.activate(api)

            plugin.instance = module
            plugin.enabled = True

            logger.info(f"Plugin {plugin_id} enabled")
            self.broadcast_event("plugin_enabled", {"plugin_id": plugin_id})

            return True

        except Exception as e:
            logger.error(f"Failed to enable plugin {plugin_id}: {e}", exc_info=True)
            return False

    def disable_plugin(self, plugin_id: str) -> bool:
        """Disable a plugin"""
        try:
            if plugin_id not in self.plugins:
                return False

            plugin = self.plugins[plugin_id]

            if not plugin.enabled:
                return True

            # Call deactivate if exists
            if plugin.instance and hasattr(plugin.instance, 'deactivate'):
                plugin.instance.deactivate()

            # Remove from sys.modules
            if plugin_id in sys.modules:
                del sys.modules[plugin_id]

            plugin.instance = None
            plugin.enabled = False

            logger.info(f"Plugin {plugin_id} disabled")
            self.broadcast_event("plugin_disabled", {"plugin_id": plugin_id})

            return True

        except Exception as e:
            logger.error(f"Failed to disable plugin {plugin_id}: {e}", exc_info=True)
            return False

    def unload_plugin(self, plugin_id: str) -> bool:
        """Unload a plugin"""
        if plugin_id in self.plugins:
            self.disable_plugin(plugin_id)
            del self.plugins[plugin_id]
            logger.info(f"Plugin {plugin_id} unloaded")
            return True
        return False

    def get_plugin_info(self, plugin_id: str) -> Optional[Dict]:
        """Get plugin information"""
        if plugin_id in self.plugins:
            plugin = self.plugins[plugin_id]
            return {
                "id": plugin.id,
                "name": plugin.name,
                "version": plugin.version,
                "description": plugin.manifest.get("description", ""),
                "author": plugin.manifest.get("author", {}),
                "enabled": plugin.enabled,
                "permissions": plugin.manifest.get("permissions", []),
                "permission_level": plugin.get_permission_level(),
                "settings": plugin.settings
            }
        return None

    def list_plugins(self) -> List[Dict]:
        """List all plugins"""
        return [self.get_plugin_info(pid) for pid in self.plugins.keys()]

    def _load_plugin_settings(self, plugin_id: str) -> Dict:
        """Load plugin settings from storage"""
        settings_file = self.plugins_dir / plugin_id / "settings.json"
        if settings_file.exists():
            with open(settings_file) as f:
                return json.load(f)
        return {}

    def save_plugin_settings(self, plugin_id: str, settings: Dict):
        """Save plugin settings"""
        settings_file = self.plugins_dir / plugin_id / "settings.json"
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)

    def get_plugin_storage(self, plugin_id: str, key: str, default: Any = None) -> Any:
        """Get value from plugin storage"""
        storage_file = self.plugins_dir / plugin_id / "storage.json"

        if storage_file.exists():
            with open(storage_file) as f:
                storage = json.load(f)
                return storage.get(key, default)

        return default

    def set_plugin_storage(self, plugin_id: str, key: str, value: Any):
        """Set value in plugin storage"""
        storage_file = self.plugins_dir / plugin_id / "storage.json"

        storage = {}
        if storage_file.exists():
            with open(storage_file) as f:
                storage = json.load(f)

        storage[key] = value

        with open(storage_file, 'w') as f:
            json.dump(storage, f, indent=2)

    def broadcast_event(self, event_type: str, data: Any):
        """Broadcast an event to all interested parties"""
        # This would integrate with WebSocket manager
        logger.debug(f"Broadcasting event: {event_type}")


# Singleton instance
_plugin_service = None


def get_plugin_service() -> PluginService:
    """Get the singleton plugin service instance"""
    global _plugin_service
    if _plugin_service is None:
        _plugin_service = PluginService()
    return _plugin_service
