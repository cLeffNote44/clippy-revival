from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio
import uvicorn
import os
import sys
from pathlib import Path
from typing import Dict, List

# Import routers
from api.ai_router import router as ai_router
from api.system_router import router as system_router
from api.files_router import router as files_router
from api.software_router import router as software_router
from api.web_router import router as web_router
from api.characters import router as characters_router
from api.scheduler_router import router as scheduler_router

# Import services
from services.system_service import SystemService
from services.websocket_manager import WebSocketManager
from services.scheduler_service import get_scheduler_service

# Import security middleware
from middleware.security import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    InputValidationMiddleware
)

# Global instances
system_service = SystemService()
ws_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    print("Starting background services...")
    asyncio.create_task(system_service.start_monitoring(ws_manager))
    
    # Start scheduler service with default handlers
    scheduler = get_scheduler_service()
    from services.task_handlers import register_default_handlers
    register_default_handlers(scheduler)
    await scheduler.start()
    print("Scheduler service started with default handlers")
    
    yield
    
    # Shutdown
    print("Stopping background services...")
    system_service.stop_monitoring()
    await ws_manager.disconnect_all()
    
    # Stop scheduler
    await scheduler.stop()
    print("Scheduler service stopped")

# Create FastAPI app
app = FastAPI(
    title="Clippy Revival Backend",
    description="AI-powered desktop assistant backend API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Electron frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Dev server
        "http://127.0.0.1:5173",  # Dev server alt
    ],  # Note: file:// removed for security - Electron should use IPC
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(InputValidationMiddleware)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,  # 60 requests per minute
    burst_size=10  # Max 10 requests per second
)

# Include routers
app.include_router(ai_router, prefix="/ai", tags=["AI"])
app.include_router(system_router, prefix="/system", tags=["System"])
app.include_router(files_router, prefix="/files", tags=["Files"])
app.include_router(software_router, prefix="/software", tags=["Software"])
app.include_router(web_router, prefix="/web", tags=["Web Automation"])
app.include_router(characters_router, tags=["Characters"])
app.include_router(scheduler_router, tags=["Scheduler"])

# Mount static files for character assets
characters_dir = Path(__file__).parent.parent / "characters"
if characters_dir.exists():
    app.mount("/character-packs", StaticFiles(directory=str(characters_dir)), name="character-packs")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Clippy Revival Backend",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for real-time updates"""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle different message types
            import json
            message = json.loads(data)  # Safe JSON parsing
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif message.get("type") == "subscribe":
                # Handle subscription to specific event types
                event_types = message.get("events", [])
                ws_manager.subscribe(websocket, event_types)
            
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    # Check Python version
    if sys.version_info < (3, 12):
        print(f"Error: Python 3.12+ is required. You are using Python {sys.version_info.major}.{sys.version_info.minor}")
        sys.exit(1)
    elif sys.version_info >= (3, 14):
        print(f"Warning: Python {sys.version_info.major}.{sys.version_info.minor} may have compatibility issues")
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 43110))
    
    # Run the application
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=port,
        reload=os.environ.get("NODE_ENV") == "development"
    )