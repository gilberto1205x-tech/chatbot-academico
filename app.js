const QA_DATA = [
    {"q": "que es la inteligencia artificial", "a": "La inteligencia artificial (IA) es una rama de la informatica que busca crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana, como el aprendizaje, el razonamiento, la percepcion y la toma de decisiones."},
    {"q": "que es python", "a": "Python es un lenguaje de programacion interpretado, de alto nivel y multiproposito. Se destaca por su sintaxis clara y legible, ideal para ciencia de datos, machine learning, desarrollo web y automatizacion."},
    {"q": "cual es la capital de francia", "a": "La capital de Francia es Paris."},
    {"q": "que es github", "a": "GitHub es una plataforma de desarrollo colaborativo que usa Git para control de versiones. Permite alojar codigo, gestionar proyectos y colaborar con otros desarrolladores."},
    {"q": "como se dice hello en espanol", "a": "'Hello' en espanol se dice 'hola'."},
    {"q": "que es un algoritmo", "a": "Un algoritmo es un conjunto de pasos ordenados y finitos para resolver un problema o realizar una tarea. Es la base de la programacion."},
    {"q": "que es una base de datos", "a": "Una base de datos es un sistema para almacenar, gestionar y recuperar informacion de forma eficiente. Puede ser relacional (SQL) o no relacional (NoSQL)."},
    {"q": "que significa html", "a": "HTML significa HyperText Markup Language. Es el lenguaje estandar para crear paginas web definiendo su estructura y contenido."},
    {"q": "cuantos dias tiene un ano bisiesto", "a": "Un ano bisiesto tiene 366 dias (uno mas que los 365 habituales). Ocurre cada 4 anos para ajustar el calendario al ano solar."},
    {"q": "que es machine learning", "a": "El machine learning (aprendizaje automatico) es una rama de la IA que permite a los sistemas aprender y mejorar con la experiencia usando datos y algoritmos, sin ser programados explicitamente."},
    {"q": "que es fastapi", "a": "FastAPI es un framework moderno para crear APIs con Python. Ofrece validacion automatica, documentacion Swagger y soporte nativo para asincronia."},
    {"q": "que es el cambio climatico", "a": "El cambio climatico es la variacion a largo plazo de las temperaturas y patrones climaticos. Las actividades humanas, especialmente la quema de combustibles fosiles, lo aceleran."},
    {"q": "cual es el oceano mas grande del mundo", "a": "El oceano Pacifico es el mas grande, cubriendo unos 165 millones de km, mas del 30% de la superficie terrestre."},
    {"q": "que es un servidor", "a": "Un servidor es un sistema que provee recursos, datos o servicios a otros sistemas (clientes) a traves de una red. Puede ser hardware o software."},
    {"q": "que es internet de las cosas", "a": "El Internet de las Cosas (IoT) conecta objetos fisicos a internet para recopilar y compartir datos: electrodomesticos inteligentes, sensores, wearables, etc."},
];

function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2);
}

function findQA(input) {
    const inputTokens = tokenize(input);
    if (inputTokens.length === 0) return null;
    let best = { score: 0, match: null };
    for (const qa of QA_DATA) {
        const qTokens = tokenize(qa.q);
        const common = inputTokens.filter(t => qTokens.includes(t));
        const score = common.length / Math.max(inputTokens.length, 1);
        if (score > best.score) {
            best = { score, match: qa };
        }
    }
    if (best.score >= 0.3) return { answer: best.match.a, matched: best.match.q, score: best.score };
    return null;
}

// ---- Chat App ----
class ChatApp {
    constructor() {
        this.isProcessing = false;
        this.isStreaming = false;
        this.abortController = null;
        this.elements = {
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('chat-input'),
            sendBtn: document.getElementById('btn-send'),
            modeSelect: document.getElementById('mode-select'),
            newChat: document.getElementById('btn-new'),
            qaList: document.getElementById('btn-qa-list'),
            config: document.getElementById('btn-config'),
            modalOverlay: document.getElementById('modal-overlay'),
            modalTitle: document.getElementById('modal-title'),
            modalBody: document.getElementById('modal-body'),
            modalClose: document.getElementById('modal-close'),
            aiStatus: document.getElementById('ai-status'),
        };
        this.init();
    }

    init() {
        this.setupListeners();
        this.updateAIStatus();
        // Load custom QA from localStorage
        this.customQA = JSON.parse(localStorage.getItem('customQA') || '[]');
    }

    setupListeners() {
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
            setTimeout(() => {
                this.elements.input.style.height = 'auto';
                this.elements.input.style.height = Math.min(this.elements.input.scrollHeight, 200) + 'px';
            }, 0);
        });
        this.elements.sendBtn.addEventListener('click', () => this.send());
        this.elements.newChat.addEventListener('click', () => this.newChat());
        this.elements.qaList.addEventListener('click', () => this.showQA());
        this.elements.config.addEventListener('click', () => this.showConfig());
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    }

    updateAIStatus() {
        const cfg = this.getAIConfig();
        if (cfg.key) {
            this.elements.aiStatus.textContent = `IA: ${cfg.provider} lista`;
            this.elements.aiStatus.className = 'status-connected';
        } else {
            this.elements.aiStatus.textContent = 'IA no configurada';
            this.elements.aiStatus.className = 'status-disconnected';
        }
    }

    getAIConfig() {
        return {
            provider: localStorage.getItem('ai_provider') || 'openai',
            key: localStorage.getItem('ai_key') || '',
            model: localStorage.getItem('ai_model') || '',
        };
    }

    setAIConfig(provider, key, model) {
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('ai_key', key);
        localStorage.setItem('ai_model', model);
        this.updateAIStatus();
    }

    setLoading(on) {
        if (on) {
            this.elements.sendBtn.disabled = true;
            this.elements.sendBtn.innerHTML = '<span class="spinner"></span>';
        } else {
            this.elements.sendBtn.disabled = false;
            this.elements.sendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>`;
        }
    }

    async send() {
        const text = this.elements.input.value.trim();
        if (!text || this.isProcessing) return;
        this.isProcessing = true;
        this.setLoading(true);
        this.elements.input.value = '';
        this.elements.input.style.height = 'auto';
        this.addMessage('user', text);

        const mode = this.elements.modeSelect.value;

        // Try Q&A first
        if (mode === 'qa' || mode === 'auto') {
            const match = findQA(text);
            // Also check custom QA
            let customMatch = null;
            for (const c of this.customQA) {
                const m = findQA(text);
                if (m) { customMatch = m; break; }
            }
            const result = customMatch || match;
            if (result) {
                const extra = result.matched ? `Coincide con: "${result.matched}"` : '';
                this.addMessage('assistant', result.answer, { tag: 'Q&A', tagClass: 'qa', extra });
                this.isProcessing = false;
                this.setLoading(false);
                this.elements.input.focus();
                return;
            }
        }

        // Try AI (only if mode is ai or auto)
        if (mode === 'ai' || mode === 'auto') {
            const cfg = this.getAIConfig();
            if (cfg.key) {
                await this.callAI(text, cfg);
                this.isProcessing = false;
                this.setLoading(false);
                this.elements.input.focus();
                return;
            }
        }

        // No answer
        this.addMessage('assistant', 'No encontre respuesta para esa pregunta. Puedes agregarla en Configuracion o configurar una API de IA (OpenAI/Claude).', { tag: 'Sin respuesta', tagClass: '' });
        this.isProcessing = false;
        this.setLoading(false);
        this.elements.input.focus();
    }

    async callAI(text, cfg) {
        this.isStreaming = true;
        this.abortController = new AbortController();

        const assistantDiv = this.addMessage('assistant', '', { tag: 'IA', tagClass: 'ai' });
        const contentDiv = assistantDiv.querySelector('.message-content');

        let fullResponse = '';

        try {
            if (cfg.provider === 'openai') {
                const model = cfg.model || 'gpt-4o-mini';
                const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${cfg.key}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: 'Eres un asistente util. Responde en espanol de forma clara y concisa.' },
                            { role: 'user', content: text },
                        ],
                        stream: true,
                    }),
                    signal: this.abortController.signal,
                });
                if (!resp.ok) {
                    const err = await resp.text();
                    this.addMessage('assistant', `Error OpenAI: ${resp.status} - ${err}`, { tag: 'Error', tagClass: '' });
                    assistantDiv.remove();
                    this.isStreaming = false;
                    return;
                }
                const reader = resp.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();
                            if (data === '[DONE]') break;
                            try {
                                const json = JSON.parse(data);
                                const delta = json.choices?.[0]?.delta?.content || '';
                                if (delta) {
                                    fullResponse += delta;
                                    contentDiv.innerHTML = fullResponse.replace(/\n/g, '<br>');
                                    this.scrollBottom();
                                }
                            } catch {}
                        }
                    }
                }
            } else if (cfg.provider === 'claude') {
                const model = cfg.model || 'claude-3-haiku-20240307';
                const resp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': cfg.key,
                        'anthropic-version': '2023-06-01',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model,
                        max_tokens: 1024,
                        messages: [{ role: 'user', content: text }],
                        stream: true,
                    }),
                    signal: this.abortController.signal,
                });
                if (!resp.ok) {
                    const err = await resp.text();
                    this.addMessage('assistant', `Error Claude: ${resp.status} - ${err}`, { tag: 'Error', tagClass: '' });
                    assistantDiv.remove();
                    this.isStreaming = false;
                    return;
                }
                const reader = resp.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(line.slice(6));
                                if (json.type === 'content_block_delta') {
                                    const delta = json.delta?.text || '';
                                    if (delta) {
                                        fullResponse += delta;
                                        contentDiv.innerHTML = fullResponse.replace(/\n/g, '<br>');
                                        this.scrollBottom();
                                    }
                                }
                            } catch {}
                        }
                    }
                }
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                contentDiv.innerHTML += `<br><em style="color:var(--error)">Error: ${e.message}</em>`;
            }
        }

        this.isStreaming = false;
        this.scrollBottom();
    }

    addMessage(role, content, opts = {}) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        const avatar = role === 'user' ? 'TU' : 'AI';
        const avatarClass = role === 'user' ? 'user-avatar' : 'bot-avatar';
        let extra = '';
        if (opts.tag) extra += `<span class="mode-badge ${opts.tagClass}">${opts.tag}</span>`;
        const safe = this.escapeHtml(content).replace(/\n/g, '<br>');
        div.innerHTML = `<div class="avatar ${avatarClass}">${avatar}</div><div class="message-content">${extra}${safe}${opts.extra ? '<br><span class="confidence">' + this.escapeHtml(opts.extra) + '</span>' : ''}</div>`;
        this.elements.messages.appendChild(div);
        this.scrollBottom();
        return div;
    }

    scrollBottom() {
        setTimeout(() => { this.elements.messages.scrollTop = this.elements.messages.scrollHeight; }, 10);
    }

    newChat() {
        if (this.isProcessing) return;
        this.elements.messages.innerHTML = `<div class="message welcome"><div class="avatar bot-avatar">AI</div><div class="message-content"><p>Bienvenido al Chatbot Academico.</p><p>Puedo responder preguntas preconfiguradas y, si configuras una API key, tambien preguntas generales via IA.</p><p><em>Escribe tu pregunta para empezar.</em></p></div></div>`;
        this.elements.input.value = '';
        this.elements.input.focus();
    }

    showQA() {
        const allQA = [...QA_DATA, ...this.customQA.map(c => ({ q: c.q, a: c.a }))];
        if (allQA.length === 0) {
            this.openModal('Q&A', '<p><em>No hay preguntas configuradas.</em></p>');
            return;
        }
        const html = '<ul>' + allQA.map(qa => `<li><strong>${this.escapeHtml(qa.q)}</strong><small>${this.escapeHtml(qa.a)}</small></li>`).join('') + '</ul>';
        this.openModal(`Q&A (${allQA.length})`, html);
    }

    showConfig() {
        const cfg = this.getAIConfig();
        const html = `
            <label>Proveedor IA</label>
            <select id="cfg-provider"><option value="openai" ${cfg.provider === 'openai' ? 'selected' : ''}>OpenAI</option><option value="claude" ${cfg.provider === 'claude' ? 'selected' : ''}>Claude (Anthropic)</option></select>
            <label>API Key</label>
            <input type="password" id="cfg-apikey" value="${this.escapeHtml(cfg.key)}" placeholder="sk-...">
            <label>Modelo (opcional)</label>
            <input type="text" id="cfg-model" value="${this.escapeHtml(cfg.model)}" placeholder="vacio = por defecto">
            <button class="modal-btn" id="cfg-save-ai">Guardar configuracion IA</button>
            <hr style="border-color:var(--border);margin:20px 0;">
            <label>Agregar pregunta/respuesta nueva</label>
            <input type="text" id="qa-new-q" placeholder="Pregunta">
            <textarea id="qa-new-a" placeholder="Respuesta"></textarea>
            <button class="modal-btn secondary" id="qa-save">Agregar Q&A</button>
            <div id="config-status"></div>`;
        this.openModal('Configuracion', html);

        document.getElementById('cfg-save-ai').addEventListener('click', () => {
            const p = document.getElementById('cfg-provider').value;
            const k = document.getElementById('cfg-apikey').value.trim();
            const m = document.getElementById('cfg-model').value.trim();
            if (!k) { document.getElementById('config-status').textContent = 'Ingresa una API key'; document.getElementById('config-status').className = 'msg-error'; return; }
            this.setAIConfig(p, k, m);
            document.getElementById('config-status').textContent = 'IA configurada correctamente';
            document.getElementById('config-status').className = 'msg-success';
        });

        document.getElementById('qa-save').addEventListener('click', () => {
            const q = document.getElementById('qa-new-q').value.trim();
            const a = document.getElementById('qa-new-a').value.trim();
            if (!q || !a) { document.getElementById('config-status').textContent = 'Completa ambos campos'; document.getElementById('config-status').className = 'msg-error'; return; }
            this.customQA.push({ q: q.toLowerCase(), a });
            localStorage.setItem('customQA', JSON.stringify(this.customQA));
            document.getElementById('config-status').textContent = 'Q&A agregado';
            document.getElementById('config-status').className = 'msg-success';
            document.getElementById('qa-new-q').value = '';
            document.getElementById('qa-new-a').value = '';
        });
    }

    openModal(title, bodyHtml) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalBody.innerHTML = bodyHtml;
        this.elements.modalOverlay.classList.remove('hidden');
    }

    closeModal() { this.elements.modalOverlay.classList.add('hidden'); }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => { new ChatApp(); });
