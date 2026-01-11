"""
Embeddings Service for RAG

Uses Cohere for high-quality text embeddings.
Falls back to OpenAI if Cohere is not configured.
"""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class EmbeddingsService:
    """
    Service for generating text embeddings.

    Uses Cohere's embed-english-v3.0 model by default.
    Falls back to OpenAI if Cohere API key is not configured.
    """

    def __init__(self):
        """Initialize the embeddings service with Cohere or OpenAI."""
        self.cohere_key = os.getenv("COHERE_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        self.provider = None

        # Try Cohere first
        if self.cohere_key and self.cohere_key != "your-cohere-api-key":
            try:
                import cohere
                self.client = cohere.Client(self.cohere_key)
                self.model = os.getenv("COHERE_EMBED_MODEL", "embed-english-v3.0")
                self.dimensions = 1024  # embed-english-v3.0 dimension
                self.provider = "cohere"
                print(f"Embeddings: Using Cohere ({self.model})")
            except Exception as e:
                print(f"Cohere init failed: {e}")

        # Fall back to OpenAI
        if self.provider is None and self.openai_key and self.openai_key != "sk-your-openai-api-key":
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.openai_key)
                self.model = "text-embedding-3-small"
                self.dimensions = 768
                self.provider = "openai"
                print(f"Embeddings: Using OpenAI ({self.model})")
            except Exception as e:
                print(f"OpenAI init failed: {e}")

        if self.provider is None:
            print("Warning: No embedding service configured. Set COHERE_API_KEY or OPENAI_API_KEY in .env")

    def embed_text(self, text: str) -> list[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector
        """
        if self.provider == "cohere":
            response = self.client.embed(
                texts=[text],
                model=self.model,
                input_type="search_document",
            )
            return response.embeddings[0]

        elif self.provider == "openai":
            response = self.client.embeddings.create(
                input=text,
                model=self.model,
                dimensions=self.dimensions,
            )
            return response.data[0].embedding

        else:
            raise RuntimeError("No embedding service configured")

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed

        Returns:
            List of embedding vectors
        """
        if not texts:
            return []

        if self.provider == "cohere":
            response = self.client.embed(
                texts=texts,
                model=self.model,
                input_type="search_document",
            )
            return response.embeddings

        elif self.provider == "openai":
            response = self.client.embeddings.create(
                input=texts,
                model=self.model,
                dimensions=self.dimensions,
            )
            embeddings = sorted(response.data, key=lambda x: x.index)
            return [e.embedding for e in embeddings]

        else:
            raise RuntimeError("No embedding service configured")

    def embed_query(self, query: str) -> list[float]:
        """
        Generate embedding for a search query.

        Args:
            query: Search query text

        Returns:
            Query embedding vector
        """
        if self.provider == "cohere":
            # Cohere uses different input_type for queries
            response = self.client.embed(
                texts=[query],
                model=self.model,
                input_type="search_query",
            )
            return response.embeddings[0]

        elif self.provider == "openai":
            response = self.client.embeddings.create(
                input=query,
                model=self.model,
                dimensions=self.dimensions,
            )
            return response.data[0].embedding

        else:
            raise RuntimeError("No embedding service configured")


# Singleton instance
_embeddings_service: EmbeddingsService | None = None


def get_embeddings_service() -> EmbeddingsService:
    """Get or create the embeddings service singleton."""
    global _embeddings_service
    if _embeddings_service is None:
        _embeddings_service = EmbeddingsService()
    return _embeddings_service
