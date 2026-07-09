from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from backend.qa_engine import find_answer, load_qa, add_qa
from backend.ai_provider import ai_provider

app = FastAPI(title="Chatbot Académico", version="2.0.0")

frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")


class ChatRequest(BaseModel):
    message: str


class ConfigRequest(BaseModel):
    provider: str
    api_key: str
    model: str = ""


class QAAddRequest(BaseModel):
    question: str
    answer: str


@app.get("/")
async def root():
    index_path = frontend_path / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse("<h1>Frontend no encontrado</h1>")


@app.get("/api/qa/all")
async def get_all_qa():
    return {"qa": load_qa()}


@app.post("/api/qa/add")
async def add_qa_pair(req: QAAddRequest):
    add_qa(req.question, req.answer)
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    # 1) Intentar Q&A preconfigurado
    match = find_answer(req.message)
    if match:
        return {
            "mode": "qa",
            "answer": match["answer"],
            "matched_question": match["matched_question"],
            "confidence": round(match["score"], 2),
        }

    # 2) Si no hay match y hay AI configurado, usarlo
    if ai_provider.is_configured():
        full_response = ""
        async for chunk in ai_provider.chat(req.message):
            full_response += chunk
        return {"mode": "ai", "answer": full_response}

    # 3) Sin match y sin AI
    return {
        "mode": "none",
        "answer": "No encontré una respuesta para esa pregunta. "
                  "Puedes agregar la pregunta y respuesta en Configuración, "
                  "o configurar una API de IA (OpenAI/Claude) para respuestas automáticas.",
    }


@app.post("/api/config/ai")
async def configure_ai(req: ConfigRequest):
    ai_provider.configure(req.provider, req.api_key, req.model)
    return {"status": "ok", "provider": req.provider, "model": ai_provider.model}


@app.get("/api/config/ai")
async def get_ai_config():
    return {
        "configured": ai_provider.is_configured(),
        "provider": ai_provider.provider or "",
        "model": ai_provider.model or "",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
