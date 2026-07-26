from groq import AsyncGroq

from app.core.config import settings
from app.services.llm.base import LLMProvider


class GroqProvider(LLMProvider):
    def __init__(self) -> None:
        self._client = AsyncGroq(api_key=settings.groq_api_key)
        self._model = settings.groq_model

    async def complete(
        self,
        prompt: str,
        system: str | None = None,
        json_mode: bool = False,
    ) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            response_format={"type": "json_object"} if json_mode else None,
            temperature=0.3,
        )
        return response.choices[0].message.content


def get_groq_provider() -> GroqProvider:
    return GroqProvider()
