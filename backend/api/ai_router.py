from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.multi_model_service import MultiModelService
from services.agent_service import AgentService
from typing import Optional, Dict, Any

router = APIRouter()
agent_service = AgentService()
ai_service = MultiModelService(agent_service=agent_service)

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    tools_allowed: Optional[bool] = True

class ModelRequest(BaseModel):
    model_name: str

class ProviderModelRequest(BaseModel):
    provider: str
    model: str

@router.get("/providers")
async def get_providers():
    """List available AI providers"""
    providers = await ai_service.list_providers()
    return {
        "providers": providers,
        "active_provider": ai_service.provider,
        "active_model": ai_service.active_model
    }

@router.get("/models")
async def get_models(provider: Optional[str] = None):
    """List available models for a provider"""
    models = await ai_service.list_models(provider)
    return {
        "models": models,
        "active_model": ai_service.active_model,
        "active_provider": ai_service.provider
    }

@router.post("/provider")
async def set_provider_model(request: ProviderModelRequest):
    """Set the active AI provider and model"""
    success = await ai_service.set_provider_and_model(request.provider, request.model)
    if success:
        return {
            "success": True,
            "provider": request.provider,
            "model": request.model
        }
    raise HTTPException(status_code=400, detail="Provider or model not available")

@router.post("/model")
async def set_model(request: ModelRequest):
    """Set the active AI model (keeps current provider)"""
    success = await ai_service.set_provider_and_model(ai_service.provider, request.model_name)
    if success:
        return {"success": True, "model": request.model_name}
    raise HTTPException(status_code=404, detail="Model not found")

@router.post("/model/pull")
async def pull_model(request: ModelRequest):
    """Pull a model from Ollama"""
    success = await ai_service.pull_model(request.model_name)
    if success:
        return {"success": True, "model": request.model_name}
    raise HTTPException(status_code=500, detail="Failed to pull model")

@router.post("/chat")
async def chat(request: ChatRequest):
    """Chat with AI assistant"""
    response = await ai_service.chat(
        message=request.message,
        session_id=request.session_id,
        tools_allowed=request.tools_allowed
    )
    return response

@router.delete("/conversation/{session_id}")
async def clear_conversation(session_id: str):
    """Clear conversation history"""
    ai_service.clear_conversation(session_id)
    return {"success": True, "session_id": session_id}

@router.get("/tools")
async def list_tools():
    """List all available tools"""
    return {
        "tools": agent_service.list_available_tools(),
        "schemas": agent_service.tool_schemas
    }

@router.get("/tools/{tool_name}")
async def get_tool_info(tool_name: str):
    """Get information about a specific tool"""
    info = agent_service.get_tool_info(tool_name)
    if info:
        return info
    raise HTTPException(status_code=404, detail="Tool not found")

class ExecuteToolRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}
    confirmed: bool = False

@router.post("/tools/execute")
async def execute_tool(request: ExecuteToolRequest):
    """Execute a tool"""
    if request.confirmed:
        return await agent_service.execute_tool_confirmed(
            request.tool_name,
            request.arguments
        )
    else:
        return await agent_service.execute_tool(
            request.tool_name,
            request.arguments
        )
