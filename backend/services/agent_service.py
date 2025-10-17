from typing import Dict, List, Callable, Any, Optional
from services.files_service import FilesService
from services.software_service import SoftwareService
from services.system_service import SystemService
from services.web_service import WebService
import json

class AgentService:
    def __init__(self):
        # Initialize services
        self.files_service = FilesService()
        self.software_service = SoftwareService()
        self.system_service = SystemService()
        self.web_service = WebService()
        
        # Tool registry
        self.tools: Dict[str, Callable] = {}
        self._register_tools()
        
        # Tool schemas for AI
        self.tool_schemas = self._build_tool_schemas()
    
    def _register_tools(self):
        """Register available tools"""
        # File operations
        self.tools["files.list"] = self.files_service.list_files
        self.tools["files.move"] = self.files_service.move_file
        self.tools["files.copy"] = self.files_service.copy_file
        self.tools["files.delete"] = self.files_service.delete_files
        self.tools["files.search"] = self.files_service.search_files
        self.tools["files.info"] = self.files_service.get_file_info
        
        # Software management
        self.tools["software.search"] = self.software_service.search_software
        self.tools["software.install"] = self.software_service.install_software
        self.tools["software.uninstall"] = self.software_service.uninstall_software
        self.tools["software.list"] = self.software_service.get_installed_software
        self.tools["software.upgrade"] = self.software_service.upgrade_software
        
        # System operations
        self.tools["system.metrics"] = self.system_service.get_metrics
        
        # Web automation
        self.tools["web.navigate"] = self.web_service.navigate
        self.tools["web.extract"] = self.web_service.extract_text
        self.tools["web.screenshot"] = self.web_service.screenshot
        self.tools["web.steps"] = self.web_service.execute_steps
    
    def _build_tool_schemas(self) -> Dict[str, Dict]:
        """Build tool schemas for AI"""
        return {
            "files.list": {
                "description": "List files in a directory",
                "parameters": {
                    "path": {"type": "string", "description": "Directory path"},
                    "show_hidden": {"type": "boolean", "default": False}
                }
            },
            "files.delete": {
                "description": "Delete files (to recycle bin by default)",
                "parameters": {
                    "paths": {"type": "array", "items": {"type": "string"}},
                    "permanent": {"type": "boolean", "default": False}
                },
                "requires_confirmation": True
            },
            "files.move": {
                "description": "Move or rename a file",
                "parameters": {
                    "source": {"type": "string"},
                    "destination": {"type": "string"},
                    "overwrite": {"type": "boolean", "default": False}
                }
            },
            "files.search": {
                "description": "Search for files by pattern",
                "parameters": {
                    "directory": {"type": "string"},
                    "pattern": {"type": "string"},
                    "max_results": {"type": "number", "default": 100}
                }
            },
            "software.search": {
                "description": "Search for software packages",
                "parameters": {
                    "query": {"type": "string"},
                    "max_results": {"type": "number", "default": 20}
                }
            },
            "software.install": {
                "description": "Install a software package",
                "parameters": {
                    "package_id": {"type": "string"},
                    "silent": {"type": "boolean", "default": True}
                },
                "requires_confirmation": True
            },
            "software.uninstall": {
                "description": "Uninstall a software package",
                "parameters": {
                    "package_id": {"type": "string"},
                    "silent": {"type": "boolean", "default": True}
                },
                "requires_confirmation": True
            },
            "system.metrics": {
                "description": "Get current system metrics (CPU, memory, disk)",
                "parameters": {}
            },
            "web.navigate": {
                "description": "Navigate to a URL in browser",
                "parameters": {
                    "url": {"type": "string"},
                    "session_id": {"type": "string", "default": "default"}
                }
            },
            "web.extract": {
                "description": "Extract text from a web page element",
                "parameters": {
                    "selector": {"type": "string"},
                    "session_id": {"type": "string", "default": "default"}
                }
            },
            "web.steps": {
                "description": "Execute a sequence of web automation steps",
                "parameters": {
                    "steps": {"type": "array"},
                    "session_id": {"type": "string", "default": "default"}
                }
            }
        }
    
    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        require_confirmation: bool = True
    ) -> Dict:
        """Execute a tool with given arguments"""
        try:
            # Check if tool exists
            if tool_name not in self.tools:
                return {"error": f"Tool not found: {tool_name}"}
            
            # Check if tool requires confirmation
            schema = self.tool_schemas.get(tool_name, {})
            if require_confirmation and schema.get("requires_confirmation", False):
                return {
                    "requires_confirmation": True,
                    "tool": tool_name,
                    "arguments": arguments,
                    "message": f"This action requires confirmation: {schema.get('description', tool_name)}"
                }
            
            # Execute the tool
            tool_fn = self.tools[tool_name]
            
            # Handle different argument patterns
            if not arguments:
                result = await tool_fn()
            else:
                result = await tool_fn(**arguments)
            
            return {
                "success": True,
                "tool": tool_name,
                "result": result
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "tool": tool_name,
                "arguments": arguments
            }
    
    async def execute_tool_confirmed(
        self,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> Dict:
        """Execute a tool after user confirmation"""
        return await self.execute_tool(tool_name, arguments, require_confirmation=False)
    
    def get_tool_schemas_for_ai(self) -> str:
        """Get tool schemas formatted for AI prompt"""
        schemas_text = "Available tools:\n\n"
        
        for tool_name, schema in self.tool_schemas.items():
            schemas_text += f"- {tool_name}: {schema['description']}\n"
            if schema.get("parameters"):
                schemas_text += f"  Parameters: {json.dumps(schema['parameters'], indent=2)}\n"
            if schema.get("requires_confirmation"):
                schemas_text += "  ⚠️ Requires user confirmation\n"
            schemas_text += "\n"
        
        schemas_text += "\nTo use a tool, respond with JSON format:\n"
        schemas_text += '{"action": "tool.name", "arguments": {...}}\n'
        
        return schemas_text
    
    async def process_ai_response(
        self,
        response: str,
        auto_execute: bool = False
    ) -> Dict:
        """Process AI response and extract tool calls"""
        try:
            # Try to find JSON in response
            if "{" in response and "}" in response:
                start = response.find("{")
                end = response.rfind("}") + 1
                json_str = response[start:end]
                
                try:
                    tool_call = json.loads(json_str)
                    
                    if "action" in tool_call and "arguments" in tool_call:
                        # Execute tool
                        result = await self.execute_tool(
                            tool_call["action"],
                            tool_call.get("arguments", {}),
                            require_confirmation=not auto_execute
                        )
                        
                        return {
                            "has_tool_call": True,
                            "tool_call": tool_call,
                            "result": result,
                            "response_text": response
                        }
                except json.JSONDecodeError:
                    pass
            
            # No tool call found
            return {
                "has_tool_call": False,
                "response_text": response
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "response_text": response
            }
    
    def list_available_tools(self) -> List[str]:
        """List all available tools"""
        return list(self.tools.keys())
    
    def get_tool_info(self, tool_name: str) -> Optional[Dict]:
        """Get information about a specific tool"""
        return self.tool_schemas.get(tool_name)