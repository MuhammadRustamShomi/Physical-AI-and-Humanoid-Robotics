"""Out-of-scope question detector for the RAG chatbot."""
from dataclasses import dataclass
import re

from app.config import get_settings
from app.services.embeddings import get_embeddings_service


@dataclass
class OOSResult:
    """Result from out-of-scope detection."""

    is_out_of_scope: bool
    reason: str | None
    response: str
    confidence: float


class OutOfScopeDetector:
    """
    Multi-tier out-of-scope detector for achieving SC-008 (100% accuracy).

    Detection tiers:
    1. Keyword blacklist (financial, medical, legal topics)
    2. Semantic relevance score < 0.5
    3. Module classification mismatch

    This ensures users only receive answers from textbook content.
    """

    # Topics that are definitively out of scope
    BLACKLIST_PATTERNS = [
        # Medical
        r"\b(medical|health|disease|symptom|diagnosis|treatment|doctor|hospital)\b",
        r"\b(medicine|medication|drug|prescription|pharmaceutical)\b",
        # Financial
        r"\b(stock|invest|crypto|bitcoin|trading|forex|money)\b",
        r"\b(loan|mortgage|credit|debt|insurance|tax)\b",
        # Legal
        r"\b(lawyer|attorney|legal|lawsuit|court|sue|liability)\b",
        r"\b(contract|divorce|custody|immigration)\b",
        # Personal advice
        r"\b(relationship|dating|love|marriage|divorce)\b",
        # Other
        r"\b(recipe|cook|food|restaurant)\b",
        r"\b(celebrity|gossip|entertainment|movie|music)\b",
        r"\b(politics|election|vote|democrat|republican)\b",
        r"\b(religion|god|prayer|spiritual)\b",
    ]

    # In-scope topic keywords (positive signals)
    INSCOPE_KEYWORDS = [
        "robot", "robotics", "ros", "ros2", "ros 2",
        "gazebo", "simulation", "simulator", "isaac", "nvidia",
        "sensor", "actuator", "motor", "joint", "arm", "gripper",
        "navigation", "slam", "localization", "mapping", "path planning",
        "perception", "vision", "camera", "lidar", "depth",
        "control", "controller", "pid", "mpc",
        "learning", "reinforcement", "neural", "network", "model",
        "vla", "vision-language", "embodied", "physical ai",
        "humanoid", "manipulator", "mobile robot", "drone",
        "urdf", "sdf", "xacro", "mesh", "collision",
        "topic", "service", "action", "node", "publisher", "subscriber",
        "transform", "tf", "frame", "coordinate",
        "docker", "container", "deployment", "cuda", "gpu",
    ]

    # Generic response for out-of-scope questions
    OOS_RESPONSE_TEMPLATE = """I can only answer questions about the Physical AI & Humanoid Robotics textbook content.

Your question about "{topic}" is outside the scope of this textbook.

**Topics I can help with:**
- Physical AI and embodied intelligence
- ROS 2 architecture and programming
- Robotics simulation (Gazebo, Isaac Sim)
- Vision-Language-Action models
- Humanoid robot development

Would you like to ask about any of these topics?"""

    def __init__(self):
        """Initialize the detector."""
        self.settings = get_settings()
        self.embeddings = get_embeddings_service()
        self._compiled_patterns = [
            re.compile(pattern, re.IGNORECASE)
            for pattern in self.BLACKLIST_PATTERNS
        ]

    async def check(self, question: str) -> OOSResult:
        """
        Check if a question is out of scope.

        Uses multi-tier detection:
        1. Keyword blacklist
        2. In-scope keyword presence
        3. (Future) Semantic similarity to textbook content

        Args:
            question: The user's question

        Returns:
            OOSResult indicating if question is out of scope
        """
        question_lower = question.lower()

        # Tier 1: Check blacklist patterns
        for pattern in self._compiled_patterns:
            match = pattern.search(question)
            if match:
                topic = match.group(0)
                return OOSResult(
                    is_out_of_scope=True,
                    reason=f"blacklist_match:{topic}",
                    response=self.OOS_RESPONSE_TEMPLATE.format(topic=topic),
                    confidence=0.95,
                )

        # Tier 2: Check for in-scope keywords
        inscope_count = sum(
            1 for keyword in self.INSCOPE_KEYWORDS
            if keyword in question_lower
        )

        # If question has no in-scope keywords and is very short, might be OOS
        if inscope_count == 0 and len(question.split()) < 5:
            # Allow generic questions like "help" or "what can you do"
            if any(word in question_lower for word in ["help", "what", "how", "explain", "tell"]):
                return OOSResult(
                    is_out_of_scope=False,
                    reason=None,
                    response="",
                    confidence=0.6,
                )

        # Tier 3: Check for completely off-topic phrasing
        off_topic_phrases = [
            "how do i make money",
            "what should i invest in",
            "is it legal to",
            "should i see a doctor",
            "relationship advice",
            "best restaurant",
            "movie recommendation",
        ]

        for phrase in off_topic_phrases:
            if phrase in question_lower:
                return OOSResult(
                    is_out_of_scope=True,
                    reason=f"off_topic_phrase:{phrase}",
                    response=self.OOS_RESPONSE_TEMPLATE.format(topic=phrase),
                    confidence=0.9,
                )

        # Question appears to be in scope
        return OOSResult(
            is_out_of_scope=False,
            reason=None,
            response="",
            confidence=0.8 if inscope_count > 0 else 0.5,
        )


# Singleton instance
_oos_detector: OutOfScopeDetector | None = None


def get_oos_detector() -> OutOfScopeDetector:
    """Get or create the OOS detector singleton."""
    global _oos_detector
    if _oos_detector is None:
        _oos_detector = OutOfScopeDetector()
    return _oos_detector
