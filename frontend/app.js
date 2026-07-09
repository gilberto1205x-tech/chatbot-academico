class ChatApp {
    constructor() {
        this.isProcessing = false;
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
        this.checkConfig();
    }

    setupListeners() {
        this.elements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
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

    async checkConfig() {
        try {
            const r = await fetch('/api/config/ai');
            const data = await r.json();
            if (data.configured) {
                this.elements.aiStatus.textContent = `IA: ${data.provider} (${data.model})`;
                this.elements.aiStatus.className = 'status-connected';
            } else {
                this.elements.aiStatus.textContent = 'IA no configurada';
                this.elements.aiStatus.className = 'status-disconnected';
            }
        } catch {}
    }

    setLoading(on) {
        if (on) {
            this.elements.sendBtn.disabled = true;
            this.elements.sendBtn.innerHTML = '<span class="spinner"></span>';
        } else {
            this.elements.sendBtn.disabled = false;
            this.elements.sendBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13"></path>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                </svg>`;
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

        // Show thinking
        const thinkingId = this.addThinking();

        const mode = this.elements.modeSelect.value;
        // For Q&A mode, always try Q&A first
        // For AI mode, only use AI
        // For Auto mode, try Q&A then AI

        try {
            const r = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: text}),
            });
            const data = await r.json();

            this.removeThinking(thinkingId);

            if (data.mode === 'qa') {
                this.addMessage('assistant', data.answer, {
                    tag: 'Q&A',
                    tagClass: 'qa',
                    extra: `Coincidencia: "${data.matched_question}" (${Math.round(data.confidence * 100)}%)`,
                });
            } else if (data.mode === 'ai') {
                this.addMessage('assistant', data.answer, {tag: 'IA', tagClass: 'ai'});
            } else {
                this.addMessage('assistant', data.answer, {tag: 'Sin respuesta', tagClass: ''});
            }

            // In IA/Auto mode, if Q&A returned "none", retry with AI
            if (data.mode === 'none' && (mode === 'ai' || mode === 'auto')) {
                const r2 = await fetch('/api/config/ai');
                const config = await r2.json();
                if (config.configured) {
                    const aiR = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({message: text}),
                    });
                    const aiData = await aiR.json();
                    if (aiData.mode === 'ai') {
                        // Replace the last message
                        this.removeLastAssistant();
                        this.addMessage('assistant', aiData.answer, {tag: 'IA', tagClass: 'ai'});
                    }
                }
            }

        } catch (e) {
            this.removeThinking(thinkingId);
            this.addMessage('assistant', `Error: ${e.message}`, {tag: 'Error', tagClass: ''});
        }

        this.isProcessing = false;
        this.setLoading(false);
        this.elements.input.focus();
    }

    addMessage(role, content, opts = {}) {
        const div = document.createElement('div');
        div.className = `message ${role}`;

        const avatar = role === 'user' ? 'TÚ' : 'AI';
        const avatarClass = role === 'user' ? 'user-avatar' : 'bot-avatar';

        let extraHtml = '';
        if (opts.tag) {
            extraHtml += `<span class="mode-badge ${opts.tagClass}">${opts.tag}</span>`;
        }

        // Escape HTML in content
        const safeContent = this.escapeHtml(content).replace(/\n/g, '<br>');

        div.innerHTML = `
            <div class="avatar ${avatarClass}">${avatar}</div>
            <div class="message-content">
                ${extraHtml}
                ${safeContent}
                ${opts.extra ? `<span class="confidence">${this.escapeHtml(opts.extra)}</span>` : ''}
            </div>
        `;

        this.elements.messages.appendChild(div);
        this.scrollBottom();
        return div;
    }

    addThinking() {
        const div = document.createElement('div');
        div.className = 'message assistant';
        div.id = 'thinking-' + Date.now();
        div.innerHTML = `
            <div class="avatar bot-avatar">AI</div>
            <div class="message-content">
                <div class="thinking-indicator"><span></span><span></span><span></span></div>
            </div>
        `;
        this.elements.messages.appendChild(div);
        this.scrollBottom();
        return div.id;
    }

    removeThinking(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    removeLastAssistant() {
        const msgs = this.elements.messages.querySelectorAll('.message.assistant');
        if (msgs.length > 0) msgs[msgs.length - 1].remove();
    }

    scrollBottom() {
        setTimeout(() => {
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 10);
    }

    newChat() {
        if (this.isProcessing) return;
        this.elements.messages.innerHTML = `
            <div class="message welcome">
                <div class="avatar bot-avatar">AI</div>
                <div class="message-content">
                    <p>Bienvenido al Chatbot Académico.</p>
                    <p>Puedo responder preguntas preconfiguradas y, si configuras una API key, también preguntas generales vía IA.</p>
                    <p><em>Escribe tu pregunta para empezar.</em></p>
                </div>
            </div>
        `;
        this.elements.input.value = '';
        this.elements.input.focus();
    }

    async showQA() {
        try {
            const r = await fetch('/api/qa/all');
            const data = await r.json();
            const qa = data.qa || [];
            if (qa.length === 0) {
                this.openModal('Q&A', '<p><em>No hay preguntas configuradas.</em></p>');
                return;
            }
            const html = '<ul>' + qa.map(q =>
                `<li><strong>${this.escapeHtml(q.question)}</strong><small>${this.escapeHtml(q.answer)}</small></li>`
            ).join('') + '</ul>';
            this.openModal(`Q&A (${qa.length})`, html);
        } catch (e) {
            this.openModal('Error', `<p>${e.message}</p>`);
        }
    }

    showConfig() {
        const html = `
            <label>Proveedor IA</label>
            <select id="cfg-provider">
                <option value="openai">OpenAI</option>
                <option value="claude">Claude (Anthropic)</option>
            </select>

            <label>API Key</label>
            <input type="password" id="cfg-apikey" placeholder="sk-...">

            <label>Modelo (opcional)</label>
            <input type="text" id="cfg-model" placeholder="vacio = por defecto">

            <button class="modal-btn" id="cfg-save-ai">Guardar configuración IA</button>

            <hr style="border-color: var(--border); margin: 20px 0;">

            <label>Agregar nueva pregunta/respuesta</label>
            <input type="text" id="qa-new-q" placeholder="Pregunta">
            <textarea id="qa-new-a" placeholder="Respuesta"></textarea>
            <button class="modal-btn secondary" id="qa-save">Agregar Q&A</button>

            <div id="config-status"></div>
        `;

        this.openModal('Configuración', html);

        document.getElementById('cfg-save-ai').addEventListener('click', async () => {
            const provider = document.getElementById('cfg-provider').value;
            const apikey = document.getElementById('cfg-apikey').value.trim();
            const model = document.getElementById('cfg-model').value.trim();

            if (!apikey) {
                document.getElementById('config-status').textContent = 'Ingresa una API key';
                document.getElementById('config-status').className = 'msg-error';
                return;
            }

            try {
                const r = await fetch('/api/config/ai', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({provider, api_key: apikey, model}),
                });
                if (r.ok) {
                    document.getElementById('config-status').textContent = 'IA configurada correctamente';
                    document.getElementById('config-status').className = 'msg-success';
                    this.checkConfig();
                }
            } catch (e) {
                document.getElementById('config-status').textContent = `Error: ${e.message}`;
                document.getElementById('config-status').className = 'msg-error';
            }
        });

        document.getElementById('qa-save').addEventListener('click', async () => {
            const question = document.getElementById('qa-new-q').value.trim();
            const answer = document.getElementById('qa-new-a').value.trim();

            if (!question || !answer) {
                document.getElementById('config-status').textContent = 'Completa ambos campos';
                document.getElementById('config-status').className = 'msg-error';
                return;
            }

            try {
                const r = await fetch('/api/qa/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({question, answer}),
                });
                if (r.ok) {
                    document.getElementById('config-status').textContent = 'Q&A agregado';
                    document.getElementById('config-status').className = 'msg-success';
                    document.getElementById('qa-new-q').value = '';
                    document.getElementById('qa-new-a').value = '';
                }
            } catch (e) {
                document.getElementById('config-status').textContent = `Error: ${e.message}`;
                document.getElementById('config-status').className = 'msg-error';
            }
        });

        // Load current config
        fetch('/api/config/ai').then(r => r.json()).then(data => {
            if (data.provider) document.getElementById('cfg-provider').value = data.provider;
            if (data.model) document.getElementById('cfg-model').value = data.model;
        }).catch(() => {});
    }

    openModal(title, bodyHtml) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalBody.innerHTML = bodyHtml;
        this.elements.modalOverlay.classList.remove('hidden');
    }

    closeModal() {
        this.elements.modalOverlay.classList.add('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});
