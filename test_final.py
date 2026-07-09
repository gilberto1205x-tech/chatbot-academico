#!/usr/bin/env python3
"""Test final del proyecto completo: inicia servidor, prueba todo, reporta resultados."""
import subprocess, sys, time, httpx, os, json

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Arrancar servidor
proc = subprocess.Popen(
    [sys.executable, 'main.py'],
    stdout=open('srv_final_out.log', 'w', encoding='utf-8'),
    stderr=open('srv_final_err.log', 'w', encoding='utf-8'),
    creationflags=subprocess.CREATE_NO_WINDOW
)
time.sleep(10)

BASE = 'http://127.0.0.1:8000'
results = []

# Frontend
r = httpx.get(f'{BASE}/', timeout=5)
results.append(('Frontend HTML', r.status_code, len(r.content)))

r = httpx.get(f'{BASE}/static/style.css', timeout=5)
results.append(('Frontend CSS', r.status_code, len(r.content)))

r = httpx.get(f'{BASE}/static/app.js', timeout=5)
results.append(('Frontend JS', r.status_code, len(r.content)))

# API Models
r = httpx.get(f'{BASE}/api/models', timeout=5)
avail = r.json().get('available', {})
results.append(('Models API', r.status_code, list(avail.keys())))
print('  Modelos detectados:')
for k, v in avail.items():
    print(f'    {k}: {v}')

# API Tools
r = httpx.get(f'{BASE}/api/tools', timeout=5)
tools_count = len(r.json().get('tools', []))
results.append(('Tools API', r.status_code, tools_count))

# API Health
r = httpx.get(f'{BASE}/api/health', timeout=5)
results.append(('Health API', r.status_code, r.json().get('version')))

# API Chat
r = httpx.post(f'{BASE}/api/chat',
    json={'message': 'Hola, responde en 5 palabras', 'model': 'fast', 'stream': False},
    timeout=120)
resp = r.json().get('response', '')[:80] if r.status_code == 200 else ''
results.append(('Chat API', r.status_code, resp))

# API Memory
r = httpx.post(f'{BASE}/api/memory', json={'action': 'get'}, timeout=5)
mem_count = len(r.json().get('memories', []))
results.append(('Memory API', r.status_code, f'{mem_count} entries'))

# API History
r = httpx.get(f'{BASE}/api/history', timeout=5)
stats = r.json().get('stats', {})
results.append(('History API', r.status_code, f'{stats.get("total_messages", 0)} msgs'))

# Resumen
print()
print('=' * 50)
print('  RESULTADOS')
print('=' * 50)
all_ok = True
for name, code, detail in results:
    ok = code == 200
    icon = 'OK' if ok else 'ERR'
    print(f'  [{icon}] {name}: status={code}')
    if not ok:
        all_ok = False

print()
if all_ok:
    print('  TODAS LAS PRUEBAS PASARON')
else:
    print('  ALGUNAS PRUEBAS FALLARON')
print('=' * 50)

# Limpiar
proc.terminate()
proc.wait(timeout=5)
