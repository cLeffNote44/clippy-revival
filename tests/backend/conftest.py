"""Pytest configuration and fixtures for backend tests."""

import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app import app


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create test client for FastAPI app."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_ollama(monkeypatch):
    """Mock Ollama service responses."""
    async def mock_list_models():
        return {"models": [{"name": "llama3.2", "size": "4B"}]}
    
    async def mock_chat(model, messages):
        return {
            "model": model,
            "message": {"role": "assistant", "content": "Test response"},
            "done": True
        }
    
    monkeypatch.setattr("services.ollama_service.OllamaService.list_models", mock_list_models)
    monkeypatch.setattr("services.ollama_service.OllamaService.chat", mock_chat)


@pytest.fixture
def auth_headers():
    """Provide auth headers for protected endpoints."""
    # In a real app, this would generate a valid JWT token
    return {"Authorization": "Bearer test-token"}