"""
Content personalization and translation service.

Provides:
- AI-powered chapter personalization based on user profile
- Urdu translation with caching
"""

import os
import hashlib
from typing import Optional

from openai import AsyncOpenAI
from dotenv import load_dotenv

from app.models.user import UserProfile
from app.services.database import get_database_service

# Load environment
load_dotenv()


class ContentService:
    """
    Content personalization and translation service.

    Uses OpenRouter for AI operations.
    """

    def __init__(self):
        """Initialize the content service."""
        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("Warning: No API key configured for content service")
            self.client = None
        else:
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1"
            )

        self.model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")

    async def personalize_chapter(
        self,
        content: str,
        user_profile: UserProfile,
        chapter_title: str = "Chapter"
    ) -> str:
        """
        Personalize chapter content based on user profile.

        Args:
            content: Original chapter content (markdown)
            user_profile: User's background profile
            chapter_title: Title of the chapter

        Returns:
            Personalized markdown content
        """
        if not self.client:
            return content

        # Build personalization prompt based on profile
        level_descriptions = {
            "beginner": "a beginner with limited programming experience",
            "intermediate": "an intermediate developer with some experience",
            "advanced": "an advanced developer with extensive experience"
        }

        software_level = level_descriptions.get(
            user_profile.software_background.value,
            "a developer"
        )

        ai_level = level_descriptions.get(
            user_profile.ai_ml_experience.value,
            "someone learning AI"
        )

        languages = ", ".join(user_profile.programming_languages) if user_profile.programming_languages else "Python"

        hardware_info = f"using a {user_profile.system_type}"
        if user_profile.hardware_gpu:
            hardware_info += f" with {user_profile.hardware_gpu} GPU"

        system_prompt = f"""You are an expert technical writer adapting educational content about Physical AI and Robotics.

Your task is to personalize the following chapter for a reader with this profile:
- Software experience: {software_level}
- AI/ML experience: {ai_level}
- Preferred programming languages: {languages}
- Hardware setup: {hardware_info}

Personalization guidelines:
1. For beginners: Add more explanations, analogies, and step-by-step breakdowns
2. For advanced: Add more technical depth, optimization tips, and advanced concepts
3. Adapt code examples to use the reader's preferred languages when possible
4. Reference their hardware setup when discussing requirements
5. Keep all factual information accurate
6. Maintain the original structure (headings, code blocks, etc.)
7. Keep the markdown formatting intact
8. DO NOT add any commentary about the personalization itself

Output ONLY the personalized content in the same markdown format."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Personalize this chapter:\n\n{content}"}
                ],
                temperature=0.7,
                max_tokens=4000
            )

            return response.choices[0].message.content or content

        except Exception as e:
            print(f"Personalization error: {e}")
            return content

    async def translate_to_urdu(self, content: str, use_cache: bool = True) -> str:
        """
        Translate chapter content to Urdu.

        Args:
            content: Original content (markdown)
            use_cache: Whether to check cache first

        Returns:
            Urdu translated content
        """
        if not self.client:
            return content

        db = get_database_service()

        # Check cache
        if use_cache:
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            cached = db.get_cached_translation(content_hash, "ur")
            if cached:
                return cached

        system_prompt = """You are an expert translator specializing in technical content translation to Urdu.

Translate the following content into clear, professional Urdu.

Translation guidelines:
1. Use natural Urdu vocabulary (avoid Hindi loanwords where pure Urdu alternatives exist)
2. Keep technical terms in English with Urdu transliteration in parentheses when helpful
3. ALL code blocks must remain UNCHANGED - do not translate code
4. Maintain heading structure (#, ##, ###)
5. Keep markdown formatting intact (bold, italic, lists, links)
6. Translate image alt text but keep image URLs unchanged
7. Keep proper nouns and brand names in English
8. Use formal/professional register appropriate for educational content

Output ONLY the translated content in the same markdown format."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Translate to Urdu:\n\n{content}"}
                ],
                temperature=0.3,
                max_tokens=4000
            )

            translated = response.choices[0].message.content or content

            # Cache the translation
            if use_cache:
                db.cache_translation(content, translated, "ur")

            return translated

        except Exception as e:
            print(f"Translation error: {e}")
            return content


# Singleton instance
_content_service: ContentService | None = None


def get_content_service() -> ContentService:
    """Get the singleton content service instance."""
    global _content_service
    if _content_service is None:
        _content_service = ContentService()
    return _content_service
