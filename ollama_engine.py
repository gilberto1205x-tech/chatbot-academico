import json
import urllib.request
import urllib.error


OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "gemma3:4b"


SYSTEM_PROMPT = """
Eres Chatbot AI Académico, un asistente de inteligencia artificial para un proyecto universitario.

Reglas obligatorias:
1. Responde siempre en español.
2. Responde directo a la pregunta del usuario.
3. No hagas preguntas innecesarias.
4. Si hay información de internet, úsala para responder.
5. No escribas frases como "esta información se encuentra en la página web".
6. No escribas URLs dentro de tu respuesta.
7. No inventes enlaces.
8. No menciones páginas web específicas dentro de la respuesta principal.
9. El programa de Python mostrará las fuentes reales aparte.
10. No repitas enlaces antiguos de la conversación.
11. Si no estás seguro, responde con la mejor información disponible y aclara brevemente.
12. Sé claro, breve y útil.

Formato:
Primero da la respuesta directa.
Después agrega 1 o 2 detalles importantes.
No pongas enlaces ni fuentes dentro de tu respuesta.
No termines preguntando si el usuario necesita más ayuda.
"""


def ask_ollama(user_message, memory_text, recent_conversation, internet_context=""):
    prompt = f"""
MEMORIA DEL USUARIO:
{memory_text}

CONVERSACIÓN RECIENTE:
{recent_conversation}

INFORMACIÓN DE INTERNET DISPONIBLE:
{internet_context}

PREGUNTA DEL USUARIO:
{user_message}

INSTRUCCIÓN FINAL:
Responde ahora de forma directa. No pidas más información. No digas que necesitas más datos si puedes responder con lo anterior.
"""

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 450,
            "num_ctx": 4096
        }
    }

    data = json.dumps(payload).encode("utf-8")

    request = urllib.request.Request(
        OLLAMA_URL,
        data=data,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result["message"]["content"]

    except urllib.error.URLError:
        return (
            "No pude conectarme con Ollama. Verifica que Ollama esté abierto "
            "y que el modelo qwen2.5:1.5b esté instalado."
        )

    except Exception as error:
        return f"Ocurrió un error al generar la respuesta: {error}"