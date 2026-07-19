"""
Chatbot connector for the APSM ML suggestion engine.

This module keeps chatbot logic isolated from the main backend/frontend. It
converts a user message into an ML input dictionary, calls run_suggestion_engine,
and returns a chatbot-friendly response.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

try:
    from ml_engine.ml_pipeline import run_suggestion_engine
except ImportError:
    from ml_pipeline import run_suggestion_engine


PLATFORM_ALIASES = {
    "youtube": ["youtube", "yt", "shorts", "short"],
    "instagram": ["instagram", "insta", "reel", "reels"],
    "linkedin": ["linkedin", "linked in"],
    "facebook": ["facebook", "fb"],
}

CONTENT_TYPES = ["short", "reel", "video", "carousel", "image", "post"]


def build_input_from_message(user_message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Extract model-ready fields from natural language and optional context."""
    context = context or {}
    message = (user_message or "").lower()

    input_dict: Dict[str, Any] = {
        "platform": context.get("platform") or detect_platform(message) or "youtube",
        "posting_hour": context.get("posting_hour") or detect_hour(message) or 18,
        "contentType": context.get("contentType") or detect_content_type(message) or "short",
        "hashtagsCount": context.get("hashtagsCount") or detect_hashtag_count(message) or 8,
        "titleLength": context.get("titleLength") or detect_title_length(user_message) or 45,
    }

    return input_dict


def detect_platform(message: str) -> Optional[str]:
    for platform, aliases in PLATFORM_ALIASES.items():
        if any(alias in message for alias in aliases):
            return platform
    return None


def detect_content_type(message: str) -> Optional[str]:
    for content_type in CONTENT_TYPES:
        if content_type in message:
            if content_type == "reel":
                return "short"
            return content_type
    return None


def detect_hour(message: str) -> Optional[int]:
    named_times = {
        "morning": 9,
        "afternoon": 14,
        "evening": 18,
        "night": 21,
        "noon": 12,
    }
    for word, hour in named_times.items():
        if word in message:
            return hour

    match = re.search(r"\b([01]?\d|2[0-3])\s*(am|pm)?\b", message)
    if not match:
        return None

    hour = int(match.group(1))
    meridiem = match.group(2)
    if meridiem == "pm" and hour < 12:
        hour += 12
    if meridiem == "am" and hour == 12:
        hour = 0
    return hour


def detect_hashtag_count(message: str) -> Optional[int]:
    match = re.search(r"\b(\d{1,2})\s*(hashtags|tags|#)\b", message)
    if match:
        return max(0, int(match.group(1)))
    return None


def detect_title_length(user_message: str) -> Optional[int]:
    quoted = re.search(r'"([^"]+)"', user_message or "")
    if quoted:
        return len(quoted.group(1))
    if user_message:
        return min(max(len(user_message.strip()), 20), 120)
    return None


def get_chatbot_suggestion(user_message: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Return a complete chatbot response backed by the trained ML model."""
    input_dict = build_input_from_message(user_message, context)
    suggestion = run_suggestion_engine(input_dict)
    reply = format_chatbot_reply(input_dict, suggestion)

    return {
        "reply": reply,
        "input": input_dict,
        "suggestion": suggestion,
    }


def format_chatbot_reply(input_dict: Dict[str, Any], suggestion: Dict[str, Any]) -> str:
    if "error" in suggestion:
        return (
            "I could not generate a model-backed suggestion right now. "
            f"Reason: {suggestion['error']}"
        )

    best = suggestion.get("best_configuration", {})
    metrics = suggestion.get("predicted_metrics", {})
    score = suggestion.get("score", 0)

    performance_score = metrics.get("performance_score", score)
    platform = best.get("platform", input_dict.get("platform", "selected platform"))
    content_type = best.get("contentType", input_dict.get("contentType", "post"))
    hour = best.get("posting_hour", input_dict.get("posting_hour", 18))
    hashtags = best.get("hashtagsCount", input_dict.get("hashtagsCount", 8))

    return (
        f"For {platform}, I suggest a {content_type} around {hour}:00 with about "
        f"{hashtags} hashtags. The current model score is {performance_score}. "
        "The model is connected and will become more accurate as more non-zero "
        "analytics data is collected."
    )


if __name__ == "__main__":
    sample = "Suggest a YouTube short for tonight with 8 hashtags"
    print(get_chatbot_suggestion(sample))
