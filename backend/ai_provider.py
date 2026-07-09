import json
import httpx
from typing import AsyncGenerator, Optional


class AIProvider:
    """Proveedor de IA vía API (OpenAI o Claude)."""

    def __init__(self):
        self.provider: str = ""  # "openai" o "claude"
        self.api_key: str = ""
        self.model: str = ""

    def configure(self, provider: str, api_key: str, model: str = ""):
        self.provider = provider.lower()
        self.api_key = api_key
        if provider == "openai":
            self.model = model or "gpt-4o-mini"
        elif provider == "claude":
            self.model = model or "claude-3-haiku-20240307"

    def is_configured(self) -> bool:
        return bool(self.provider and self.api_key)

    async def chat(self, message: str) -> AsyncGenerator[str, None]:
        if not self.is_configured():
            yield "AI no configurado. Ve a Configuración e ingresa tu API key."
            return

        try:
            if self.provider == "openai":
                async for chunk in self._chat_openai(message):
                    yield chunk
            elif self.provider == "claude":
                async for chunk in self._chat_claude(message):
                    yield chunk
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    async def _chat_openai(self, message: str) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": "Eres un asistente útil. Responde en español de forma clara y concisa."},
                        {"role": "user", "content": message},
                    ],
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data: "):
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue

    async def _chat_claude(self, message: str) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 1024,
                    "messages": [{"role": "user", "content": message}],
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith("data: "):
                        data = line[6:]
                        try:
                            chunk = json.loads(data)
                            if chunk.get("type") == "content_block_delta":
                                content = chunk.get("delta", {}).get("text", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue


ai_provider = AIProvider()
