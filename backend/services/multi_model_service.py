"""
Multi-Model AI Service
Supports Ollama (local), Anthropic Claude, and OpenAI GPT models
"""

import os
from typing import Dict, List, Optional, AsyncGenerator
from enum import Enum
import json

# Conditional imports based on availability
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

from services.conversation_db import get_conversation_db
from services.logger import get_logger

logger = get_logger("multi_model")


class ModelProvider(str, Enum):
    """AI model providers"""
    OLLAMA = "ollama"
    ANTHROPIC = "anthropic"
    OPENAI = "openai"


class MultiModelService:
    """
    Unified AI service supporting multiple providers:
    - Ollama (local, free, private)
    - Anthropic Claude (API key required)
    - OpenAI GPT (API key required)
    """

    def __init__(self, agent_service=None, use_persistence=True):
        self.conversations: Dict[str, List[Dict]] = {}
        self.agent_service = agent_service
        self.use_persistence = use_persistence

        # Current provider and model
        self.provider = ModelProvider.OLLAMA
        self.active_model = "llama3.2"

        # API keys (loaded from environment)
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

        # Initialize clients
        self._init_clients()

        # Initialize database if persistence is enabled
        if self.use_persistence:
            self.db = get_conversation_db()
            logger.info("MultiModelService initialized with persistent storage")

        # Base system prompt for Clippy
        self.base_prompt = """You are Clippy, a helpful AI assistant integrated into Windows.
You can help users with:
- System monitoring and optimization
- File management and organization
- Software installation via winget
- Web automation tasks
- General computer assistance

Be friendly, concise, and helpful. When you need to perform actions, use the tool format.
Keep responses brief unless asked for details."""

    def _init_clients(self):
        """Initialize API clients"""
        # Anthropic client
        if ANTHROPIC_AVAILABLE and self.anthropic_api_key:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic client: {e}")
                self.anthropic_client = None
        else:
            self.anthropic_client = None
            if not ANTHROPIC_AVAILABLE:
                logger.info("Anthropic SDK not installed (pip install anthropic)")

        # OpenAI client
        if OPENAI_AVAILABLE and self.openai_api_key:
            try:
                openai.api_key = self.openai_api_key
                self.openai_client = openai
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
                self.openai_client = None
        else:
            self.openai_client = None
            if not OPENAI_AVAILABLE:
                logger.info("OpenAI SDK not installed (pip install openai)")

    def _get_system_prompt(self) -> str:
        """Get system prompt with tool schemas"""
        prompt = self.base_prompt

        if self.agent_service:
            prompt += "\n\n" + self.agent_service.get_tool_schemas_for_ai()

        return prompt

    async def list_providers(self) -> List[Dict]:
        """List available AI providers and their status"""
        providers = []

        # Ollama
        providers.append({
            "name": "ollama",
            "display_name": "Ollama (Local)",
            "available": OLLAMA_AVAILABLE,
            "requires_api_key": False,
            "description": "Free local AI models, fully private"
        })

        # Anthropic
        providers.append({
            "name": "anthropic",
            "display_name": "Anthropic Claude",
            "available": ANTHROPIC_AVAILABLE and bool(self.anthropic_api_key),
            "requires_api_key": True,
            "api_key_set": bool(self.anthropic_api_key),
            "description": "Claude 3.5 Sonnet, Opus, and Haiku models"
        })

        # OpenAI
        providers.append({
            "name": "openai",
            "display_name": "OpenAI GPT",
            "available": OPENAI_AVAILABLE and bool(self.openai_api_key),
            "requires_api_key": True,
            "api_key_set": bool(self.openai_api_key),
            "description": "GPT-4, GPT-4 Turbo, and GPT-3.5 models"
        })

        return providers

    async def list_models(self, provider: Optional[str] = None) -> List[Dict]:
        """List available models for a provider"""
        if provider is None:
            provider = self.provider

        try:
            if provider == ModelProvider.OLLAMA and OLLAMA_AVAILABLE:
                models_list = ollama.list()
                return [{
                    "id": model['name'],
                    "name": model['name'],
                    "provider": "ollama",
                    "size": model.get('size', 'unknown')
                } for model in models_list.get('models', [])]

            elif provider == ModelProvider.ANTHROPIC:
                # Anthropic models (as of 2025)
                return [
                    {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "provider": "anthropic"},
                    {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku", "provider": "anthropic"},
                    {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "provider": "anthropic"}
                ]

            elif provider == ModelProvider.OPENAI:
                # OpenAI models
                return [
                    {"id": "gpt-4-turbo-preview", "name": "GPT-4 Turbo", "provider": "openai"},
                    {"id": "gpt-4", "name": "GPT-4", "provider": "openai"},
                    {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "provider": "openai"}
                ]

            return []

        except Exception as e:
            logger.error(f"Error listing models for {provider}: {e}")
            return []

    async def set_provider_and_model(self, provider: str, model: str) -> bool:
        """Set the active provider and model"""
        try:
            # Validate provider
            if provider not in [p.value for p in ModelProvider]:
                return False

            # Check if provider is available
            if provider == ModelProvider.OLLAMA and not OLLAMA_AVAILABLE:
                return False
            elif provider == ModelProvider.ANTHROPIC and not self.anthropic_client:
                return False
            elif provider == ModelProvider.OPENAI and not self.openai_client:
                return False

            # Verify model exists for provider
            models = await self.list_models(provider)
            model_ids = [m['id'] for m in models]

            if provider == ModelProvider.OLLAMA:
                # For Ollama, model might not be in list if not downloaded
                self.provider = provider
                self.active_model = model
                return True
            elif model in model_ids:
                self.provider = provider
                self.active_model = model
                logger.info(f"Switched to {provider} - {model}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error setting provider/model: {e}")
            return False

    async def chat(
        self,
        message: str,
        session_id: str = "default",
        tools_allowed: bool = True
    ) -> Dict:
        """Send a chat message and get response (unified interface)"""
        try:
            # Initialize conversation if needed
            if session_id not in self.conversations:
                if self.use_persistence:
                    history = self.db.get_session_history(session_id)
                    if not history:
                        self.db.create_session(session_id, f"{self.provider}:{self.active_model}")
                    self.conversations[session_id] = history
                else:
                    self.conversations[session_id] = []

            # Save user message
            if self.use_persistence:
                self.db.add_message(session_id, "user", message)

            self.conversations[session_id].append({
                "role": "user",
                "content": message
            })

            # Route to appropriate provider
            if self.provider == ModelProvider.OLLAMA:
                response = await self._chat_ollama(session_id, message)
            elif self.provider == ModelProvider.ANTHROPIC:
                response = await self._chat_anthropic(session_id, message)
            elif self.provider == ModelProvider.OPENAI:
                response = await self._chat_openai(session_id, message)
            else:
                raise ValueError(f"Unknown provider: {self.provider}")

            # Save assistant message
            if self.use_persistence:
                self.db.add_message(session_id, "assistant", response["content"])

            self.conversations[session_id].append({
                "role": "assistant",
                "content": response["content"]
            })

            response["session_id"] = session_id
            response["provider"] = self.provider
            response["model"] = self.active_model

            return response

        except Exception as e:
            logger.error(f"Error in chat: {e}", exc_info=True)
            return {
                "role": "assistant",
                "content": f"I encountered an error: {str(e)}",
                "error": True
            }

    async def _chat_ollama(self, session_id: str, message: str) -> Dict:
        """Chat using Ollama"""
        messages = [
            {"role": "system", "content": self._get_system_prompt()}
        ] + self.conversations[session_id]

        response = ollama.chat(
            model=self.active_model,
            messages=messages
        )

        content = response['message']['content']
        tool_call = self._extract_tool_call(content)

        return {
            "role": "assistant",
            "content": content,
            "tool_call": tool_call
        }

    async def _chat_anthropic(self, session_id: str, message: str) -> Dict:
        """Chat using Anthropic Claude"""
        # Convert conversation format for Anthropic
        messages = []
        for msg in self.conversations[session_id]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        response = self.anthropic_client.messages.create(
            model=self.active_model,
            max_tokens=4096,
            system=self._get_system_prompt(),
            messages=messages
        )

        content = response.content[0].text
        tool_call = self._extract_tool_call(content)

        return {
            "role": "assistant",
            "content": content,
            "tool_call": tool_call
        }

    async def _chat_openai(self, session_id: str, message: str) -> Dict:
        """Chat using OpenAI GPT"""
        messages = [
            {"role": "system", "content": self._get_system_prompt()}
        ] + self.conversations[session_id]

        response = self.openai_client.chat.completions.create(
            model=self.active_model,
            messages=messages,
            max_tokens=4096
        )

        content = response.choices[0].message.content
        tool_call = self._extract_tool_call(content)

        return {
            "role": "assistant",
            "content": content,
            "tool_call": tool_call
        }

    def _extract_tool_call(self, response: str) -> Optional[Dict]:
        """Extract tool call from response if present"""
        try:
            if "ACTION:" in response or "{" in response:
                start = response.find("{")
                end = response.rfind("}") + 1

                if start != -1 and end > start:
                    json_str = response[start:end]
                    tool_data = json.loads(json_str)

                    if "action" in tool_data and "arguments" in tool_data:
                        return tool_data

            return None
        except:
            return None

    def clear_conversation(self, session_id: str = "default"):
        """Clear conversation history"""
        if session_id in self.conversations:
            del self.conversations[session_id]

        if self.use_persistence:
            self.db.delete_session(session_id)
            logger.info(f"Cleared conversation {session_id}")

    def get_conversation_stats(self, session_id: str) -> Optional[Dict]:
        """Get statistics for a conversation"""
        if self.use_persistence:
            return self.db.get_session_stats(session_id)
        return None

    def list_conversations(self, limit: int = 50) -> List[Dict]:
        """List all conversations"""
        if self.use_persistence:
            return self.db.list_sessions(limit)
        return []

    async def pull_model(self, model_name: str) -> bool:
        """Pull a model (Ollama only)"""
        if self.provider == ModelProvider.OLLAMA and OLLAMA_AVAILABLE:
            try:
                ollama.pull(model_name)
                return True
            except Exception as e:
                logger.error(f"Error pulling model: {e}")
                return False
        return False
