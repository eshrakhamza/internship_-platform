import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import verify_internal_key
from groq import AsyncGroq

router = APIRouter()

MAX_TOOL_ROUNDS = 4

# NOTE: check_availability below is a placeholder — wire this to your real
# calendar/NestJS lookup (e.g. an internal HTTP call back to NestJS, which
# owns the Postgres schedule data). Keeping this file free of DB access
# preserves the "FastAPI stays stateless" rule from the architecture.
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "check_availability",
            "description": "Check available interview time slots for a given date range",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {"type": "string", "description": "YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "YYYY-MM-DD"},
                },
                "required": ["start_date", "end_date"],
            },
        },
    }
]


class SchedulingRequest(BaseModel):
    candidate_message: str
    context: str | None = None  # e.g. job title, interviewer name


class SchedulingResponse(BaseModel):
    reply: str
    proposed_slots: list[str] = []


async def check_availability(start_date: str, end_date: str) -> str:
    """Placeholder — replace with a call back to NestJS's calendar/schedule endpoint."""
    return json.dumps({"available_slots": [f"{start_date}T10:00", f"{start_date}T14:00"]})


TOOL_IMPLS = {"check_availability": check_availability}


@router.post("/interview", response_model=SchedulingResponse, dependencies=[Depends(verify_internal_key)])
async def schedule_interview(payload: SchedulingRequest) -> SchedulingResponse:
    client = AsyncGroq(api_key=settings.groq_api_key)

    messages = [
        {
            "role": "system",
            "content": (
                "You help schedule interviews. Use check_availability to find real "
                "slots before proposing times to the candidate. Be concise and concrete."
            ),
        },
        {"role": "user", "content": payload.candidate_message + (f"\nContext: {payload.context}" if payload.context else "")},
    ]

    for _ in range(MAX_TOOL_ROUNDS):
        response = await client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            tools=TOOLS,
        )
        message = response.choices[0].message

        if not message.tool_calls:
            return SchedulingResponse(reply=message.content or "")

        messages.append(message)
        for call in message.tool_calls:
            args = json.loads(call.function.arguments)
            result = await TOOL_IMPLS[call.function.name](**args)
            messages.append(
                {"role": "tool", "tool_call_id": call.id, "content": result}
            )

    # Bounded loop exhausted without a final answer — fail safe rather than spin forever
    return SchedulingResponse(reply="Could not finalize scheduling — please try rephrasing your request.")
