from fastapi import APIRouter
from pydantic import BaseModel
from services.web_service import WebService
from typing import List, Dict, Optional

router = APIRouter()
web_service = WebService()

class StartSessionRequest(BaseModel):
    session_id: str = "default"
    headless: bool = True

class NavigateRequest(BaseModel):
    url: str
    session_id: str = "default"

class ClickRequest(BaseModel):
    selector: str
    session_id: str = "default"

class FillRequest(BaseModel):
    selector: str
    text: str
    session_id: str = "default"

class ExtractRequest(BaseModel):
    selector: str
    session_id: str = "default"

class ExecuteStepsRequest(BaseModel):
    steps: List[Dict]
    session_id: str = "default"

@router.post("/session/start")
async def start_session(request: StartSessionRequest):
    """Start a new browser automation session"""
    return await web_service.start_session(
        request.session_id,
        request.headless
    )

@router.post("/session/stop")
async def stop_session(session_id: str = "default"):
    """Stop a browser session"""
    return await web_service.stop_session(session_id)

@router.post("/navigate")
async def navigate(request: NavigateRequest):
    """Navigate to a URL"""
    return await web_service.navigate(
        request.url,
        request.session_id
    )

@router.post("/click")
async def click(request: ClickRequest):
    """Click an element"""
    return await web_service.click(
        request.selector,
        request.session_id
    )

@router.post("/fill")
async def fill(request: FillRequest):
    """Fill a form field"""
    return await web_service.fill(
        request.selector,
        request.text,
        request.session_id
    )

@router.post("/extract")
async def extract_text(request: ExtractRequest):
    """Extract text from an element"""
    return await web_service.extract_text(
        request.selector,
        request.session_id
    )

@router.post("/extract/multiple")
async def extract_multiple(request: ExtractRequest):
    """Extract text from multiple elements"""
    return await web_service.extract_multiple(
        request.selector,
        request.session_id
    )

@router.post("/screenshot")
async def screenshot(session_id: str = "default", full_page: bool = False):
    """Take a screenshot"""
    return await web_service.screenshot(session_id, full_page)

@router.get("/page/info")
async def get_page_info(session_id: str = "default"):
    """Get current page information"""
    return await web_service.get_page_info(session_id)

@router.post("/steps")
async def execute_steps(request: ExecuteStepsRequest):
    """Execute a sequence of automation steps"""
    return await web_service.execute_steps(
        request.steps,
        request.session_id
    )
