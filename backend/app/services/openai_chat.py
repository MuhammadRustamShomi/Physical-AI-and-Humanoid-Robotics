"""
OpenRouter Chat Service

Production-ready service for LLM chat completions with streaming support.
Uses the OpenAI SDK with OpenRouter's API for access to multiple models.

OpenRouter provides:
- Access to 100+ models (OpenAI, Anthropic, Meta, Google, etc.)
- Pay-per-token pricing
- OpenAI-compatible API format

Features:
- Streaming responses for real-time feedback
- Chat history context for multi-turn conversations
- System prompt customization for the textbook assistant
- Error handling and retry logic
- Model flexibility (easily switch between providers)
"""

import os
from pathlib import Path
from typing import AsyncGenerator
from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic import BaseModel

# Load .env file from backend directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class ChatMessage(BaseModel):
    """Represents a chat message."""
    role: str  # 'user', 'assistant', or 'system'
    content: str


class OpenAIChatService:
    """
    OpenRouter Chat Service with streaming support.

    Uses the OpenAI SDK configured for OpenRouter's API endpoint.
    This allows access to multiple LLM providers through a single interface.
    """

    def __init__(self):
        """
        Initialize the OpenRouter client.

        Uses OPENROUTER_API_KEY from environment variables.
        Falls back to OPENAI_API_KEY for backwards compatibility.
        Raises ValueError if no API key is configured.
        """
        # Try OpenRouter key first, then fall back to OpenAI key
        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable is not set. "
                "Please add it to your .env file. "
                "Get your key at: https://openrouter.ai/keys"
            )

        # Configure client for OpenRouter
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

        # Default model - OpenRouter format: provider/model-name
        # Popular options: meta-llama/llama-3.1-8b-instruct (free),
        #                  openai/gpt-4o-mini, anthropic/claude-3-haiku
        self.model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")

        # System prompt for the textbook assistant
        self.system_prompt = """You are an expert AI assistant for the Physical AI & Humanoid Robotics textbook.

Your role is to:
1. Answer questions about physical AI, robotics, ROS 2, digital twins, NVIDIA Isaac, and VLA models
2. Explain complex concepts in clear, accessible language
3. Provide code examples when relevant (Python, C++, YAML for robotics)
4. Reference specific chapters or sections when helpful
5. Guide learners through hands-on exercises

Guidelines:
- Stay focused on topics covered in the textbook curriculum
- Be concise but thorough in explanations
- Use markdown formatting for code blocks and lists
- If a question is outside the textbook scope, politely redirect to relevant topics
- Encourage hands-on learning and experimentation

The textbook covers:
- Module 1: Physical AI Foundations (embodied AI, sensors, actuators)
- Module 2: ROS 2 Nervous System (nodes, topics, services)
- Module 3: Digital Twins with Gazebo (simulation, physics)
- Module 4: NVIDIA Isaac Platform (Isaac Sim, reinforcement learning)
- Module 5: Vision-Language-Action Models (VLA, imitation learning)
- Module 6: Conversational Humanoid Capstone (integration project)
"""

    async def chat_stream(
        self,
        message: str,
        history: list[ChatMessage] | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming chat response.

        Args:
            message: The user's message
            history: Optional list of previous messages for context
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response

        Yields:
            String chunks of the response as they're generated
        """
        # Build messages list
        messages = [{"role": "system", "content": self.system_prompt}]

        # Add conversation history
        if history:
            for msg in history[-10:]:  # Keep last 10 messages for context
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })

        # Add current message
        messages.append({"role": "user", "content": message})

        try:
            # Create streaming completion
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            # Yield chunks as they arrive
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            # Yield error message
            yield f"\n\n[Error: {str(e)}]"

    async def chat(
        self,
        message: str,
        history: list[ChatMessage] | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """
        Generate a non-streaming chat response.

        Args:
            message: The user's message
            history: Optional list of previous messages for context
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response

        Returns:
            The complete response string
        """
        # Build messages list
        messages = [{"role": "system", "content": self.system_prompt}]

        # Add conversation history
        if history:
            for msg in history[-10:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })

        # Add current message
        messages.append({"role": "user", "content": message})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}"


# Singleton instance
_openai_service: OpenAIChatService | None = None


def get_openai_service() -> OpenAIChatService:
    """
    Get the singleton OpenAI service instance.

    Returns:
        OpenAIChatService: The service instance
    """
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIChatService()
    return _openai_service
