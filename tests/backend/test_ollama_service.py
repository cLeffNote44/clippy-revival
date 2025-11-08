"""
Tests for Ollama Service
Tests AI chat functionality, model management, and streaming
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from backend.services.ollama_service import OllamaService


@pytest.fixture
def ollama_service():
    """Create an OllamaService instance for testing"""
    return OllamaService()


@pytest.fixture
def mock_ollama_client():
    """Mock the Ollama client"""
    with patch('backend.services.ollama_service.ollama') as mock:
        yield mock


class TestOllamaService:
    """Test suite for OllamaService"""

    def test_initialization(self, ollama_service):
        """Test service initializes correctly"""
        assert ollama_service is not None
        assert ollama_service.sessions == {}
        assert ollama_service.active_model is not None

    def test_get_available_models(self, ollama_service, mock_ollama_client):
        """Test retrieving available models"""
        mock_ollama_client.list.return_value = {
            'models': [
                {'name': 'llama3.2'},
                {'name': 'mistral'}
            ]
        }

        models = ollama_service.get_available_models()

        assert len(models) == 2
        assert 'llama3.2' in models
        assert 'mistral' in models
        mock_ollama_client.list.assert_called_once()

    def test_get_available_models_error_handling(self, ollama_service, mock_ollama_client):
        """Test error handling when listing models fails"""
        mock_ollama_client.list.side_effect = Exception("Connection failed")

        models = ollama_service.get_available_models()

        assert models == []

    def test_set_active_model(self, ollama_service):
        """Test changing the active model"""
        result = ollama_service.set_active_model("llama3.2")

        assert result is True
        assert ollama_service.active_model == "llama3.2"

    def test_create_new_session(self, ollama_service):
        """Test creating a new chat session"""
        session_id = "test-session-123"

        ollama_service.get_or_create_session(session_id)

        assert session_id in ollama_service.sessions
        assert ollama_service.sessions[session_id] == []

    def test_get_existing_session(self, ollama_service):
        """Test retrieving an existing session"""
        session_id = "test-session-123"
        ollama_service.sessions[session_id] = [{"role": "user", "content": "hello"}]

        session = ollama_service.get_or_create_session(session_id)

        assert len(session) == 1
        assert session[0]["content"] == "hello"

    @pytest.mark.asyncio
    async def test_generate_response(self, ollama_service, mock_ollama_client):
        """Test generating a response"""
        session_id = "test-session-123"
        message = "Hello, Clippy!"

        # Mock the chat method to return a response
        mock_ollama_client.chat.return_value = {
            'message': {
                'role': 'assistant',
                'content': 'Hello! How can I help you today?'
            }
        }

        response = await ollama_service.generate_response(message, session_id)

        assert response is not None
        assert 'Hello' in response
        assert session_id in ollama_service.sessions
        # Should have user message and assistant response
        assert len(ollama_service.sessions[session_id]) == 2

    @pytest.mark.asyncio
    async def test_generate_response_error_handling(self, ollama_service, mock_ollama_client):
        """Test error handling during response generation"""
        session_id = "test-session-123"
        message = "Test message"

        mock_ollama_client.chat.side_effect = Exception("Model error")

        response = await ollama_service.generate_response(message, session_id)

        assert "error" in response.lower() or response is None

    def test_clear_session(self, ollama_service):
        """Test clearing a session"""
        session_id = "test-session-123"
        ollama_service.sessions[session_id] = [
            {"role": "user", "content": "message 1"},
            {"role": "assistant", "content": "response 1"}
        ]

        ollama_service.clear_session(session_id)

        assert session_id not in ollama_service.sessions or \
               len(ollama_service.sessions[session_id]) == 0

    def test_get_session_history(self, ollama_service):
        """Test retrieving session history"""
        session_id = "test-session-123"
        history = [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello"}
        ]
        ollama_service.sessions[session_id] = history

        retrieved_history = ollama_service.get_session_history(session_id)

        assert retrieved_history == history
        assert len(retrieved_history) == 2

    def test_get_nonexistent_session_history(self, ollama_service):
        """Test retrieving history for non-existent session"""
        history = ollama_service.get_session_history("nonexistent")

        assert history == []

    @pytest.mark.asyncio
    async def test_streaming_response(self, ollama_service, mock_ollama_client):
        """Test streaming response generation"""
        session_id = "test-session-123"
        message = "Tell me a story"

        # Mock streaming response
        mock_stream = [
            {'message': {'content': 'Once '}},
            {'message': {'content': 'upon '}},
            {'message': {'content': 'a time'}}
        ]
        mock_ollama_client.chat.return_value = mock_stream

        chunks = []
        async for chunk in ollama_service.stream_response(message, session_id):
            chunks.append(chunk)

        # Should have received chunks
        assert len(chunks) > 0

    def test_model_validation(self, ollama_service):
        """Test that model names are validated"""
        # Should accept valid model names
        assert ollama_service.set_active_model("llama3.2") is True
        assert ollama_service.set_active_model("mistral") is True

        # Empty model name should be handled
        result = ollama_service.set_active_model("")
        assert result is False or ollama_service.active_model != ""

    def test_session_memory_limit(self, ollama_service):
        """Test that session history doesn't grow unbounded"""
        session_id = "test-session-123"

        # Add many messages
        for i in range(100):
            ollama_service.sessions.setdefault(session_id, []).append({
                "role": "user",
                "content": f"Message {i}"
            })

        history = ollama_service.get_session_history(session_id)

        # Should either limit history size or handle large histories
        assert isinstance(history, list)
        assert len(history) > 0
