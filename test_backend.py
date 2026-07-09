#!/usr/bin/env python3
"""
Script de prueba para el backend del Chatbot AI.
Ejecutar DESPUES de iniciar el servidor: python main.py
"""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import httpx

BASE_URL = "http://127.0.0.1:8000"


def print_separator(title: str):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def test_health():
    print_separator("TEST: Health Check")
    try:
        r = httpx.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"  Status: {r.status_code}")
        print(f"  Response: {r.json()}")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"
        print("  [OK] Health OK")
        return True
    except Exception as e:
        print(f"  [ERR] Error: {e}")
        return False


def test_models():
    print_separator("TEST: Listar Modelos")
    try:
        r = httpx.get(f"{BASE_URL}/api/models", timeout=5)
        print(f"  Status: {r.status_code}")
        data = r.json()
        print(f"  Modelo actual: {data.get('current')}")
        print(f"  Modelos disponibles: {json.dumps(data.get('available', {}), indent=4)}")
        assert r.status_code == 200
        print("  [OK] Models OK")
        return True
    except Exception as e:
        print(f"  [ERR] Error: {e}")
        return False


def test_chat_simple():
    print_separator("TEST: Chat simple (REST)")
    try:
        payload = {"message": "Que es la inteligencia artificial?", "model": "fast", "stream": False}
        r = httpx.post(f"{BASE_URL}/api/chat", json=payload, timeout=120)
        print(f"  Status: {r.status_code}")
        data = r.json()
        print(f"  Modelo usado: {data.get('model_used')}")
        resp = data.get('response', '')
        print(f"  Respuesta: {resp[:200]}...")
        assert r.status_code == 200
        assert len(resp) > 0
        print("  [OK] Chat simple OK")
        return True
    except Exception as e:
        print(f"  [ERR] Error: {e}")
        return False


def test_memory():
    print_separator("TEST: Memoria")
    try:
        r = httpx.post(f"{BASE_URL}/api/memory", json={
            "action": "add",
            "content": "mi nombre es TestUser",
            "category": "personal"
        }, timeout=5)
        print(f"  Add: {r.status_code} {r.json()}")

        r = httpx.post(f"{BASE_URL}/api/memory", json={"action": "get"}, timeout=5)
        print(f"  Get: {r.status_code}")
        data = r.json()
        memories = data.get("memories", [])
        print(f"  Memorias: {len(memories)}")
        for m in memories:
            print(f"    - [{m.get('category')}] {m.get('content')}")

        assert r.status_code == 200
        print("  [OK] Memory OK")
        return True
    except Exception as e:
        print(f"  [ERR] Error: {e}")
        return False


def test_tools():
    print_separator("TEST: Listar Herramientas")
    try:
        r = httpx.get(f"{BASE_URL}/api/tools", timeout=5)
        print(f"  Status: {r.status_code}")
        data = r.json()
        tools = data.get("tools", [])
        print(f"  Herramientas registradas: {len(tools)}")
        for t in tools:
            print(f"    - {t['name']}: {t['description'][:60]}...")
        assert r.status_code == 200
        assert len(tools) >= 7
        print("  [OK] Tools OK")
        return True
    except Exception as e:
        print(f"  [ERR] Error: {e}")
        return False


def test_history():
    print_separator("TEST: Historial")
    try:
        r = httpx.get(f"{BASE_URL}/api/history?days=30", timeout=5)
        print(f"  Status: {r.status_code}")
        data = r.json()
        stats = data.get("stats", {})
        print(f"  Archivos: {stats.get('files', 0)}")
        print(f"  Mensajes totales: {stats.get('total_messages', 0)}")
        assert r.status_code == 200
        print("  [OK] History OK")
        return True
    except Exception as e:
        print(f"  [ERR] Error: {e}")
        return False


def main():
    print("\n" + "=" * 60)
    print("  TEST DEL BACKEND - CHATBOT AI")
    print("  " + "=" * 60)
    print(f"\n  Asegurate de que el servidor este corriendo en {BASE_URL}")
    print(f"  Si no, ejecuta: python main.py\n")

    results = []

    results.append(("Health", test_health()))
    results.append(("Models", test_models()))
    results.append(("Tools", test_tools()))
    results.append(("Chat simple", test_chat_simple()))
    results.append(("Memory", test_memory()))
    results.append(("History", test_history()))

    print("\n" + "=" * 60)
    print("  RESUMEN DE PRUEBAS")
    print("=" * 60)
    all_ok = True
    for name, ok in results:
        icon = "[OK]" if ok else "[ERR]"
        print(f"  {icon} {name}")
        if not ok:
            all_ok = False

    print("")
    if all_ok:
        print("  TODAS LAS PRUEBAS PASARON")
    else:
        print("  Algunas pruebas fallaron")
    print("=" * 60)


if __name__ == "__main__":
    main()