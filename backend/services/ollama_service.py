import ollama
from typing import Dict, List, Optional, AsyncGenerator
import json

class OllamaService:
    def __init__(self, agent_service=None):
        self.active_model = "llama3.2"
        self.conversations: Dict[str, List[Dict]] = {}
        self.agent_service = agent_service
        
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
    
    def _get_system_prompt(self) -> str:
        """Get system prompt with tool schemas"""
        prompt = self.base_prompt
        
        if self.agent_service:
            prompt += "\n\n" + self.agent_service.get_tool_schemas_for_ai()
        
        return prompt

    async def list_models(self) -> List[str]:
        """List available Ollama models"""
        try:
            models = ollama.list()
            return [model['name'] for model in models.get('models', [])]
        except Exception as e:
            print(f"Error listing models: {e}")
            return []

    async def set_model(self, model_name: str) -> bool:
        """Set the active model"""
        try:
            # Verify model exists
            models = await self.list_models()
            if model_name in models:
                self.active_model = model_name
                return True
            return False
        except Exception as e:
            print(f"Error setting model: {e}")
            return False

    async def chat(
        self, 
        message: str, 
        session_id: str = "default",
        tools_allowed: bool = True
    ) -> Dict:
        """Send a chat message and get response"""
        try:
            # Initialize conversation if needed
            if session_id not in self.conversations:
                self.conversations[session_id] = []
            
            # Add user message
            self.conversations[session_id].append({
                "role": "user",
                "content": message
            })
            
            # Prepare messages with system prompt
            messages = [
                {"role": "system", "content": self._get_system_prompt()}
            ] + self.conversations[session_id]
            
            # Get response from Ollama
            response = ollama.chat(
                model=self.active_model,
                messages=messages
            )
            
            assistant_message = response['message']['content']
            
            # Add assistant response to conversation
            self.conversations[session_id].append({
                "role": "assistant",
                "content": assistant_message
            })
            
            # Check if response contains a tool call
            tool_call = self._extract_tool_call(assistant_message)
            
            return {
                "role": "assistant",
                "content": assistant_message,
                "tool_call": tool_call,
                "session_id": session_id
            }
            
        except Exception as e:
            print(f"Error in chat: {e}")
            return {
                "role": "assistant",
                "content": f"I encountered an error: {str(e)}",
                "error": True
            }

    async def chat_stream(
        self,
        message: str,
        session_id: str = "default"
    ) -> AsyncGenerator[str, None]:
        """Stream chat responses"""
        try:
            if session_id not in self.conversations:
                self.conversations[session_id] = []
            
            self.conversations[session_id].append({
                "role": "user",
                "content": message
            })
            
            messages = [
                {"role": "system", "content": self._get_system_prompt()}
            ] + self.conversations[session_id]
            
            full_response = ""
            
            stream = ollama.chat(
                model=self.active_model,
                messages=messages,
                stream=True
            )
            
            for chunk in stream:
                content = chunk['message']['content']
                full_response += content
                yield content
            
            # Save complete response
            self.conversations[session_id].append({
                "role": "assistant",
                "content": full_response
            })
            
        except Exception as e:
            yield f"Error: {str(e)}"

    def _extract_tool_call(self, response: str) -> Optional[Dict]:
        """Extract tool call from response if present"""
        try:
            # Look for JSON-formatted tool calls
            if "ACTION:" in response or "{" in response:
                # Try to parse JSON
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

    async def pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama library"""
        try:
            ollama.pull(model_name)
            return True
        except Exception as e:
            print(f"Error pulling model: {e}")
            return False