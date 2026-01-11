"""
Cohere Embeddings Service

Production-ready service for generating text embeddings using Cohere's API.
Used for RAG (Retrieval Augmented Generation) to find relevant textbook content.

Features:
- High-quality embeddings using Cohere's embed-english-v3.0 model
- Batch processing for efficiency
- Support for both documents and queries
- Async interface for FastAPI integration
"""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
import cohere

# Load .env file from backend directory
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class CohereEmbeddingService:
    """
    Cohere Embeddings Service.

    Generates high-quality text embeddings for semantic search
    and RAG applications using Cohere's embedding models.
    """

    def __init__(self):
        """
        Initialize the Cohere client.

        Uses COHERE_API_KEY from environment variables.
        Raises ValueError if the API key is not configured.
        """
        api_key = os.getenv("COHERE_API_KEY")
        if not api_key:
            raise ValueError(
                "COHERE_API_KEY environment variable is not set. "
                "Please add it to your .env file. "
                "Get your free key at: https://dashboard.cohere.com/api-keys"
            )

        self.client = cohere.Client(api_key)

        # Default model - embed-english-v3.0 is recommended for English text
        self.model = os.getenv("COHERE_EMBED_MODEL", "embed-english-v3.0")

        # Embedding dimensions (1024 for embed-english-v3.0)
        self.dimensions = 1024

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for documents (textbook content).

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors (list of floats)
        """
        if not texts:
            return []

        # Cohere recommends using input_type="search_document" for documents
        response = self.client.embed(
            texts=texts,
            model=self.model,
            input_type="search_document",
        )

        return response.embeddings

    def embed_query(self, query: str) -> List[float]:
        """
        Generate embedding for a search query.

        Args:
            query: The search query text

        Returns:
            Embedding vector (list of floats)
        """
        # Cohere recommends using input_type="search_query" for queries
        response = self.client.embed(
            texts=[query],
            model=self.model,
            input_type="search_query",
        )

        return response.embeddings[0]

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Async version of embed_documents.

        Args:
            texts: List of text strings to embed

        Returns:
            List of embedding vectors
        """
        # Cohere's client is synchronous, but we wrap it for async interface
        return self.embed_documents(texts)

    async def aembed_query(self, query: str) -> List[float]:
        """
        Async version of embed_query.

        Args:
            query: The search query text

        Returns:
            Embedding vector
        """
        return self.embed_query(query)


# Singleton instance
_cohere_service: CohereEmbeddingService | None = None


def get_cohere_service() -> CohereEmbeddingService:
    """
    Get the singleton Cohere service instance.

    Returns:
        CohereEmbeddingService: The service instance
    """
    global _cohere_service
    if _cohere_service is None:
        _cohere_service = CohereEmbeddingService()
    return _cohere_service
