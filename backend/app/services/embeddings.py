"""OpenAI embeddings service for RAG."""
from typing import List

from openai import OpenAI

from app.config import get_settings


class EmbeddingsService:
    """Service for generating text embeddings using OpenAI."""

    def __init__(self):
        """Initialize the embeddings service."""
        self.settings = get_settings()
        self.client = OpenAI(api_key=self.settings.openai_api_key)
        self.model = self.settings.embedding_model
        self.dimensions = self.settings.embedding_dimensions

    def embed_text(self, text: str) -> list[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector
        """
        response = self.client.embeddings.create(
            input=text,
            model=self.model,
            dimensions=self.dimensions,
        )
        return response.data[0].embedding

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

        # OpenAI API allows batch embedding
        response = self.client.embeddings.create(
            input=texts,
            model=self.model,
            dimensions=self.dimensions,
        )

        # Sort by index to maintain order
        embeddings = sorted(response.data, key=lambda x: x.index)
        return [e.embedding for e in embeddings]

    def embed_query(self, query: str) -> list[float]:
        """
        Generate embedding for a search query.

        This is an alias for embed_text but semantically indicates
        the embedding will be used for similarity search.

        Args:
            query: Search query text

        Returns:
            Query embedding vector
        """
        return self.embed_text(query)


# Singleton instance
_embeddings_service: EmbeddingsService | None = None


def get_embeddings_service() -> EmbeddingsService:
    """Get or create the embeddings service singleton."""
    global _embeddings_service
    if _embeddings_service is None:
        _embeddings_service = EmbeddingsService()
    return _embeddings_service
