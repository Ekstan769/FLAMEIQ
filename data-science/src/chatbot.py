"""
FlameIQ Chatbot Service
=========================
LLM-powered chat brain for the FlameIQ widget, using Google Gemini.

Public entry point:
    handle_chat_message(user_message, conversation_history, household_profile) -> str

Design note
-----------
The LLM never supplies the numeric household/cylinder details itself — it
can't know them reliably, and users shouldn't have to retype their profile
into chat. Instead, `household_profile` is passed in by the caller (the
backend, which already has this stored per-user) and closed over by the
tool function below. The LLM only decides *when* to call the tool, not
*what values* to call it with.
"""

from __future__ import annotations

import os

from google import genai
from google.genai import types

from predict import predict_refill

GEMINI_MODEL = "gemini-2.5-flash"

SYSTEM_PROMPT = """You are the FlameIQ assistant — a friendly helper inside a household LPG \
(cooking gas) app used by Nigerian households.

FlameIQ predicts when a household is likely to need its next gas refill, based on \
their cylinder size, cooking habits, and refill history, and helps them schedule a \
refill before they run out unexpectedly.

Rules:
- If the user asks anything about when they'll need a refill, how much gas is left, \
whether they should order now, or similar, call get_my_refill_prediction. Never \
invent a specific number of days without calling it.
- This is a proof-of-concept estimate, not a certified measurement of remaining gas. \
Never claim certainty — always present it as an estimate.
- Keep replies short, warm, and in plain, everyday language. Avoid technical terms \
like "cold-start model" or "personalisation stage" — translate them into normal \
sentences instead.
- If the tool result's status is "overdue" or "refill_now", gently encourage the \
user to order soon. Don't be alarmist.
- If you don't have enough information to help, say so plainly rather than guessing.
"""


def _get_client() -> "genai.Client":
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set. "
            "Set it in Render's Environment Variables tab."
        )
    return genai.Client(api_key=api_key)


def handle_chat_message(
    user_message: str,
    conversation_history: list[dict],
    household_profile: dict,
) -> str:
    """
    Handle one turn of conversation and return the assistant's reply text.

    Args:
        user_message: the latest message from the user.
        conversation_history: prior turns, each a dict like
            {"role": "user" | "assistant", "text": "..."}. Pass [] for a
            fresh conversation.
        household_profile: the fields predict_refill() needs for this user
            (cylinder_size_kg, refill_quantity_kg, household_size,
            meals_per_day, cooking_days_per_week, lpg_primary_fuel,
            usage_change, last_refill_date, and optionally
            number_previous_cycles / previous_cycle_days /
            average_previous_cycle_days). This should come from the
            backend's stored user profile, not be asked from the user
            in chat.

    Returns:
        The assistant's reply as plain text.
    """

    def get_my_refill_prediction() -> dict:
        """Get this user's current LPG refill prediction, using their
        stored household profile and refill history. Call this whenever
        the user asks about their gas level, refill timing, how many days
        are left, or whether they should order a refill soon."""
        return predict_refill(household_profile)

    client = _get_client()

    contents: list[types.Content] = []
    for turn in conversation_history:
        role = "user" if turn.get("role") == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=turn["text"])])
        )
    contents.append(
        types.Content(role="user", parts=[types.Part.from_text(text=user_message)])
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            tools=[get_my_refill_prediction],
        ),
    )
    return response.text
