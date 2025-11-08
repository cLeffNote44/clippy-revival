"""
Plugin Management API Router
Provides REST endpoints for plugin management
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from services.plugin_service import get_plugin_service
from services.logger import get_logger

router = APIRouter(prefix="/plugins", tags=["plugins"])
logger = get_logger("plugins")


class PluginInfo(BaseModel):
    """Plugin information response model"""
    id: str
    name: str
    version: str
    description: str
    author: Dict[str, str]
    enabled: bool
    permissions: List[str]
    permission_level: str
    settings: Dict[str, Any]


class PluginSettingUpdate(BaseModel):
    """Plugin setting update request"""
    key: str
    value: Any


class PluginEnableRequest(BaseModel):
    """Plugin enable/disable request"""
    enabled: bool


@router.get("/discover")
async def discover_plugins():
    """
    Discover all available plugins
    Returns list of plugin IDs found in the plugins directory
    """
    try:
        plugin_service = get_plugin_service()
        plugins = plugin_service.discover_plugins()

        return {
            "success": True,
            "plugins": plugins,
            "count": len(plugins)
        }
    except Exception as e:
        logger.error(f"Failed to discover plugins: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to discover plugins: {str(e)}")


@router.get("/list", response_model=List[PluginInfo])
async def list_plugins():
    """
    List all loaded plugins with their details
    """
    try:
        plugin_service = get_plugin_service()
        plugins = plugin_service.list_plugins()

        return plugins
    except Exception as e:
        logger.error(f"Failed to list plugins: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list plugins: {str(e)}")


@router.get("/{plugin_id}", response_model=PluginInfo)
async def get_plugin(plugin_id: str):
    """
    Get detailed information about a specific plugin
    """
    try:
        plugin_service = get_plugin_service()
        plugin_info = plugin_service.get_plugin_info(plugin_id)

        if not plugin_info:
            raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")

        return plugin_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get plugin: {str(e)}")


@router.post("/{plugin_id}/load")
async def load_plugin(plugin_id: str):
    """
    Load a plugin (without enabling it)
    """
    try:
        plugin_service = get_plugin_service()
        success = plugin_service.load_plugin(plugin_id)

        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to load plugin '{plugin_id}'")

        return {
            "success": True,
            "message": f"Plugin '{plugin_id}' loaded successfully",
            "plugin": plugin_service.get_plugin_info(plugin_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to load plugin: {str(e)}")


@router.post("/{plugin_id}/enable")
async def enable_plugin(plugin_id: str):
    """
    Enable a plugin (loads and activates it)
    """
    try:
        plugin_service = get_plugin_service()
        success = plugin_service.enable_plugin(plugin_id)

        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to enable plugin '{plugin_id}'")

        logger.info(f"Plugin {plugin_id} enabled via API")

        return {
            "success": True,
            "message": f"Plugin '{plugin_id}' enabled successfully",
            "plugin": plugin_service.get_plugin_info(plugin_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to enable plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to enable plugin: {str(e)}")


@router.post("/{plugin_id}/disable")
async def disable_plugin(plugin_id: str):
    """
    Disable a plugin (deactivates it but keeps it loaded)
    """
    try:
        plugin_service = get_plugin_service()
        success = plugin_service.disable_plugin(plugin_id)

        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to disable plugin '{plugin_id}'")

        logger.info(f"Plugin {plugin_id} disabled via API")

        return {
            "success": True,
            "message": f"Plugin '{plugin_id}' disabled successfully",
            "plugin": plugin_service.get_plugin_info(plugin_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to disable plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to disable plugin: {str(e)}")


@router.post("/{plugin_id}/unload")
async def unload_plugin(plugin_id: str):
    """
    Unload a plugin completely (disables and removes from memory)
    """
    try:
        plugin_service = get_plugin_service()
        success = plugin_service.unload_plugin(plugin_id)

        if not success:
            raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")

        logger.info(f"Plugin {plugin_id} unloaded via API")

        return {
            "success": True,
            "message": f"Plugin '{plugin_id}' unloaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unload plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to unload plugin: {str(e)}")


@router.post("/{plugin_id}/reload")
async def reload_plugin(plugin_id: str):
    """
    Reload a plugin (unload and re-enable)
    """
    try:
        plugin_service = get_plugin_service()

        # Check if plugin was enabled
        plugin_info = plugin_service.get_plugin_info(plugin_id)
        was_enabled = plugin_info and plugin_info.get("enabled", False)

        # Unload
        plugin_service.unload_plugin(plugin_id)

        # Re-enable if it was enabled before
        if was_enabled:
            success = plugin_service.enable_plugin(plugin_id)
        else:
            success = plugin_service.load_plugin(plugin_id)

        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to reload plugin '{plugin_id}'")

        logger.info(f"Plugin {plugin_id} reloaded via API")

        return {
            "success": True,
            "message": f"Plugin '{plugin_id}' reloaded successfully",
            "plugin": plugin_service.get_plugin_info(plugin_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reload plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to reload plugin: {str(e)}")


@router.get("/{plugin_id}/settings")
async def get_plugin_settings(plugin_id: str):
    """
    Get plugin settings
    """
    try:
        plugin_service = get_plugin_service()
        plugin_info = plugin_service.get_plugin_info(plugin_id)

        if not plugin_info:
            raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")

        return {
            "success": True,
            "settings": plugin_info.get("settings", {})
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get settings for plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get settings: {str(e)}")


@router.put("/{plugin_id}/settings")
async def update_plugin_setting(plugin_id: str, update: PluginSettingUpdate):
    """
    Update a plugin setting
    """
    try:
        plugin_service = get_plugin_service()

        if plugin_id not in plugin_service.plugins:
            raise HTTPException(status_code=404, detail=f"Plugin '{plugin_id}' not found")

        plugin = plugin_service.plugins[plugin_id]
        plugin.settings[update.key] = update.value
        plugin_service.save_plugin_settings(plugin_id, plugin.settings)

        logger.info(f"Updated setting '{update.key}' for plugin {plugin_id}")

        return {
            "success": True,
            "message": f"Setting '{update.key}' updated successfully",
            "settings": plugin.settings
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update setting for plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update setting: {str(e)}")


@router.get("/{plugin_id}/storage/{key}")
async def get_plugin_storage(plugin_id: str, key: str):
    """
    Get a value from plugin storage
    """
    try:
        plugin_service = get_plugin_service()
        value = plugin_service.get_plugin_storage(plugin_id, key)

        return {
            "success": True,
            "key": key,
            "value": value
        }
    except Exception as e:
        logger.error(f"Failed to get storage for plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get storage: {str(e)}")


@router.put("/{plugin_id}/storage/{key}")
async def set_plugin_storage(plugin_id: str, key: str, value: Any = Body(...)):
    """
    Set a value in plugin storage
    """
    try:
        plugin_service = get_plugin_service()
        plugin_service.set_plugin_storage(plugin_id, key, value)

        logger.info(f"Updated storage key '{key}' for plugin {plugin_id}")

        return {
            "success": True,
            "message": f"Storage key '{key}' updated successfully"
        }
    except Exception as e:
        logger.error(f"Failed to set storage for plugin {plugin_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to set storage: {str(e)}")
