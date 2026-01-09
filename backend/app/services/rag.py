"""RAG (Retrieval-Augmented Generation) query engine."""
from dataclasses import dataclass
from typing import Any

from anthropic import Anthropic
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.config import get_settings
from app.models.message import Source
from app.services.embeddings import get_embeddings_service


@dataclass
class RAGResult:
    """Result from RAG query."""

    response: str
    sources: list[Source]
    context_used: list[dict[str, Any]]


class RAGQueryEngine:
    """
    RAG Query Engine for the Physical AI Textbook.

    This engine:
    1. Embeds the user's question
    2. Retrieves relevant chunks from Qdrant
    3. Builds context from retrieved chunks
    4. Generates a response using Claude
    5. Includes source citations
    """

    def __init__(self):
        """Initialize the RAG engine."""
        self.settings = get_settings()
        self.embeddings = get_embeddings_service()
        self.qdrant = QdrantClient(
            url=self.settings.qdrant_url,
            api_key=self.settings.qdrant_api_key,
        )
        self.anthropic = Anthropic(api_key=self.settings.anthropic_api_key)
        self.collection_name = "textbook_chunks"

    async def query(
        self,
        question: str,
        chapter_id: str | None = None,
        selected_text: str | None = None,
        conversation_history: list[dict] | None = None,
    ) -> RAGResult:
        """
        Process a user query and generate a response.

        Args:
            question: User's question
            chapter_id: Current chapter context (optional)
            selected_text: Highlighted text context (optional)
            conversation_history: Previous messages for context

        Returns:
            RAGResult with response, sources, and context
        """
        # Build query with context
        query_text = self._build_query(question, selected_text)

        # Generate query embedding
        query_embedding = self.embeddings.embed_query(query_text)

        # Build search filter
        search_filter = None
        if chapter_id:
            search_filter = Filter(
                must=[FieldCondition(key="chapter_id", match=MatchValue(value=chapter_id))]
            )

        # Search Qdrant
        search_results = self.qdrant.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            query_filter=search_filter,
            limit=self.settings.top_k_results,
            with_payload=True,
        )

        # If no results with chapter filter, try without
        if not search_results and chapter_id:
            search_results = self.qdrant.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=self.settings.top_k_results,
                with_payload=True,
            )

        # Build context from search results
        context_chunks = []
        sources = []

        for result in search_results:
            payload = result.payload
            context_chunks.append({
                "content": payload.get("content", ""),
                "section": payload.get("section", ""),
                "chapter_id": payload.get("chapter_id", ""),
                "score": result.score,
            })

            sources.append(
                Source(
                    chunk_id=result.id,
                    chapter_id=payload.get("chapter_id", ""),
                    section=payload.get("section", ""),
                    excerpt=payload.get("content", "")[:200] + "...",
                    relevance_score=result.score,
                )
            )

        # Generate response with Claude
        response = await self._generate_response(
            question=question,
            selected_text=selected_text,
            context_chunks=context_chunks,
            conversation_history=conversation_history,
        )

        return RAGResult(
            response=response,
            sources=sources,
            context_used=context_chunks,
        )

    def _build_query(self, question: str, selected_text: str | None) -> str:
        """Build the query text with optional selected text context."""
        if selected_text:
            return f"Context: {selected_text}\n\nQuestion: {question}"
        return question

    async def _generate_response(
        self,
        question: str,
        selected_text: str | None,
        context_chunks: list[dict],
        conversation_history: list[dict] | None,
    ) -> str:
        """Generate a response using Claude."""
        # Build system prompt
        system_prompt = """You are a helpful tutor for the Physical AI & Humanoid Robotics textbook.

Your role:
- Answer questions ONLY based on the provided textbook content
- If the answer is not in the provided context, say so clearly
- Cite specific sections when referencing information
- Be educational and encouraging
- Explain technical concepts clearly

Important:
- Do NOT make up information not in the context
- Do NOT answer questions unrelated to physical AI, robotics, ROS 2, simulation, or VLA
- If asked about topics outside the textbook scope, politely redirect to the textbook content

Format guidelines:
- Use markdown for formatting when helpful
- Include code examples if relevant to the question
- Keep responses focused and concise"""

        # Build context section
        context_text = "\n\n---\n\n".join(
            f"**{chunk['section']}** (Chapter: {chunk['chapter_id']})\n{chunk['content']}"
            for chunk in context_chunks
        )

        # Build user message with context
        user_message = f"""## Textbook Context

{context_text}

---

## Question

{question}"""

        if selected_text:
            user_message = f"""## Highlighted Text

{selected_text}

{user_message}"""

        # Build conversation messages
        messages = []

        # Add conversation history if available (last 6 messages for context)
        if conversation_history:
            for msg in conversation_history[-6:]:
                role = msg.get("role", "user")
                if role in ["user", "assistant"]:
                    messages.append({
                        "role": role,
                        "content": msg.get("content", ""),
                    })

        # Add current question
        messages.append({
            "role": "user",
            "content": user_message,
        })

        # Call Claude
        response = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )

        return response.content[0].text


# Singleton instance
_rag_engine: RAGQueryEngine | None = None


def get_rag_engine() -> RAGQueryEngine:
    """Get or create the RAG engine singleton."""
    global _rag_engine
    if _rag_engine is None:
        _rag_engine = RAGQueryEngine()
    return _rag_engine
