import json
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple


DATA_FILE = Path(__file__).parent.parent / "data" / "qa_data.json"


def _tokenize(text: str) -> List[str]:
    """Convierte texto a lista de palabras clave normalizadas."""
    text = text.lower()
    text = re.sub(r"[¿?¡!.,;:()\"'\-]", " ", text)
    return [w.strip() for w in text.split() if len(w.strip()) > 2]


def _score(pregunta: str, qa: Dict) -> Tuple[int, str]:
    """Calcula qué tanto coincide una pregunta con un par Q&A.
    Retorna (puntaje, respuesta)."""
    q_tokens = set(_tokenize(pregunta))
    a_tokens = set(_tokenize(qa["question"]))

    # Palabras en común
    common = q_tokens & a_tokens
    if not common:
        return 0, qa["answer"]

    # Puntaje: proporción de tokens de la pregunta que coinciden
    score = len(common) / max(len(q_tokens), 1)
    return score, qa["answer"]


def find_answer(question: str, threshold: float = 0.4) -> Optional[Dict]:
    """Busca la mejor respuesta para una pregunta.
    
    Args:
        question: Pregunta del usuario.
        threshold: Puntaje mínimo (0-1) para considerar match.
    
    Returns:
        Dict con "answer" y "matched_question", o None si no hay match.
    """
    data = load_qa()
    best_score = 0
    best_answer = None
    best_question = None

    for qa in data:
        score, answer = _score(question, qa)
        if score > best_score:
            best_score = score
            best_answer = answer
            best_question = qa["question"]

    if best_score >= threshold:
        return {"answer": best_answer, "matched_question": best_question, "score": best_score}
    return None


def load_qa() -> List[Dict]:
    """Carga todas las preguntas/respuestas del archivo."""
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def add_qa(question: str, answer: str):
    """Agrega un nuevo par Q&A al archivo."""
    data = load_qa()
    data.append({"question": question, "answer": answer})
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
