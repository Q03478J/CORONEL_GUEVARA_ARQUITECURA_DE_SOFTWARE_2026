// ===================================
// EDW CHATBOX - ASISTENTE VIRTUAL
// ===================================

class EDWChatbox {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.responses = {
            'hola': '¡Hola! Soy EDW BOT, tu asistente virtual. ¿En qué puedo ayudarte?',
            'ayuda': 'Puedo ayudarte con: \n• Información sobre las unidades del curso\n• Navegación por la plataforma\n• Dudas sobre tareas y fechas límite\n• Cómo subir archivos\n• Ver tu progreso\n• Contacto con el profesor',

            // Course structure
            'unidades': 'El curso tiene 4 unidades:\n1. Fundamentos de Arquitectura SW\n2. Patrones Arquitectónicos\n3. Diseño y Modelado\n4. Evaluación y Optimización\n\nCada unidad tiene 4 semanas de contenido.',
            'arquitectura': 'El curso de Arquitectura de Software cubre:\n• Unidad I: Fundamentos y estándares\n• Unidad II: Patrones y estilos arquitectónicos\n• Unidad III: Diseño y modelado (UML, C4)\n• Unidad IV: Evaluación y optimización\n\nTotal: 16 semanas',

            // Units detail
            'unidad1': 'UNIDAD I - Fundamentos:\n• Semana 1: Conceptos fundamentales\n• Semana 2: Estándares internacionales\n• Semana 3: Diseño arquitectónico\n• Semana 4: Evaluación de arquitectura',
            'unidad2': 'UNIDAD II - Patrones:\n• Semana 5-8: Patrones de diseño, estilos arquitectónicos, casos de uso y aplicación práctica',
            'unidad3': 'UNIDAD III - Diseño y Modelado:\n• Semana 9-12: UML avanzado, modelo C4, documentación arquitectónica y modelado completo',
            'unidad4': 'UNIDAD IV - Evaluación:\n• Semana 13-16: Métricas, rendimiento, escalabilidad y proyecto final',

            // File uploads
            'subir': 'Para subir archivos:\n1. Ve a la unidad correspondiente\n2. Busca "Material de apoyo" o "Subir tarea"\n3. Arrastra tu archivo o haz clic para seleccionar\n4. Verifica que se subió correctamente\n5. La fecha de subida se guarda automáticamente',
            'tareas': 'Para subir tus tareas:\n1. Inicia sesión en tu dashboard\n2. Ve a "Mis Asignaciones"\n3. Haz clic en "Subir archivo"\n4. Asegúrate de subir antes de la fecha límite\n\nFormatos: PDF, Word, PowerPoint, imágenes (Máx. 10MB)',
            'limite': 'El límite de archivos es 10MB por defecto.\n\nSi necesitas más espacio:\n• Comprime archivos en ZIP\n• Contacta al administrador para aumentar el límite\n• El admin puede configurar hasta 50MB',

            // Deadlines and completion
            'fechas': 'Las fechas límite se muestran en:\n• Tu dashboard de estudiante\n• Cada unidad muestra "Fecha límite"\n• El chatbot puede informarte según tu usuario\n\nSi tienes dudas sobre una fecha específica, contacta al profesor.',
            'completado': 'Si marcaste una tarea como completada por error:\n• Estudiantes: Contacta al administrador\n• El admin puede reabrir asignaciones\n• Una vez reabierta, podrás subir archivos nuevamente\n\n❌ No puedes desbloquear tareas tú mismo',
            'bloqueado': 'Las tareas se bloquean cuando:\n• Las marcas como completadas\n• El administrador las bloquea\n• Pasó la fecha límite (según configuración)\n\nSolución: Contacta al administrador para reabrir.',

            // Progress
            'progreso': 'Para ver tu progreso:\n• Dashboard: Muestra tu % general\n• Cada unidad muestra su % de completitud\n• Las barras visuales indican tu avance\n• Al completar 100% verás un trofeo 🏆\n\nEl progreso se calcula automáticamente.',
            'dashboard': 'Tu dashboard muestra:\n• Progreso general y por unidad\n• Asignaciones pendientes\n• Fechas límite próximas\n• Historial de uploads con fechas\n• Acceso rápido a todas las unidades',

            // Login and system
            'login': 'Para iniciar sesión:\n1. Haz clic en "Iniciar sesión"\n2. Ingresa tu correo y contraseña\n3. Si olvidaste tu contraseña, usa "¿Olvidaste tu contraseña?"\n\nNOTA: Los estudiantes nuevos deben ser creados por el administrador.',
            'cuenta': 'Solo el administrador puede crear cuentas.\n\nSi necesitas una cuenta:\n1. Contacta al profesor Edwin Ramirez\n2. Proporciona tu correo electrónico\n3. El admin creará tu cuenta de estudiante\n4. Recibirás tus credenciales',

            // Contact
            'contacto': 'Puedes contactar al profesor Edwin Ramirez:\n📧 edwramirezy@gmail.com\n📱 +51 967013078\n\nO al administrador:\n📧 dobleeimportaciones@gmail.com',
            'profesor': 'Profesor Edwin Ramirez\n📧 edwramirezy@gmail.com\n📱 +51 967013078\n\nHorario de atención: Consultar por correo',

            // Admin features
            'admin': 'Panel de administrador:\n• Crear y gestion ar estudiantes\n• Establecer fechas límite\n• Ver progreso de todos\n• Reabrir tareas completadas\n• Configurar tamaños de archivo\n• Exportar datos\n\n⚠️ Solo para dobleeimportaciones@gmail.com',
            'estudiantes': 'El administrador puede:\n• Ver todos los estudiantes\n• Crear nuevos usuarios\n• Ver progreso individual\n• Reabrir asignaciones bloqueadas\n• Cambiar configuraciones\n• Exportar reportes',

            // Troubleshooting
            'error': 'Si tienes problemas:\n1. Verifica tu conexión a internet\n2. Actualiza la página (F5)\n3. Cierra sesión y vuelve a entrar\n4. Limpia caché del navegador\n5. Contacta al administrador\n\nSi el error persiste, envía un correo con captura de pantalla.',
            'ayuda2': 'Preguntas frecuentes:\n• ¿No puedo subir? → Verifica fecha límite y estado\n• ¿Olvidé contraseña? → Usa recuperación en login\n• ¿No veo mis archivos? → Actualiza página\n• ¿Tarea bloqueada? → Contacta admin\n• ¿Cambiar contraseña? → Dashboard → Perfil',

            'default': 'Interesante pregunta. Para más información, contáctanos en edwramirezy@gmail.com o visita la sección de contacto.'
        };
        this.init();
    }

    init() {
        this.createChatboxHTML();
        this.setupEventListeners();
        this.loadFromStorage();
    }

    createChatboxHTML() {
        const chatboxHTML = `
            <div class="edw-chatbox" id="edwChatbox">
                <div class="chat-toggle" id="chatToggle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 11.5C21 16.75 16.75 21 11.5 21C10.39 21 9.33 20.81 8.34 20.46L3 22L4.54 16.66C4.19 15.67 4 14.61 4 13.5C4 8.25 8.25 4 13.5 4C16.73 4 19.55 5.68 21 8.23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="10" cy="12" r="1" fill="currentColor"/>
                        <circle cx="14" cy="12" r="1" fill="currentColor"/>
                        <circle cx="18" cy="12" r="1" fill="currentColor"/>
                    </svg>
                    <span class="chat-badge">EDW</span>
                </div>

                <div class="chat-window" id="chatWindow">
                    <div class="chat-header">
                        <div class="chat-header-info">
                            <div class="chat-avatar">
                                <img src="images/ed.jpg" alt="EDW" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                            </div>
                            <div>
                                <h4>EDW BOT</h4>
                                <span class="chat-status">Online</span>
                            </div>
                        </div>
                        <button class="chat-close" id="chatClose">×</button>
                    </div>

                    <div class="chat-messages" id="chatMessages">
                        <div class="chat-message bot-message">
                            <div class="message-content">
                                👋 ¡Hola! Soy EDW, tu asistente virtual. ¿En qué puedo ayudarte hoy?
                                <div class="quick-replies">
                                    <button class="quick-reply" data-message="hola">Saludar</button>
                                    <button class="quick-reply" data-message="ayuda">Ayuda</button>
                                    <button class="quick-reply" data-message="unidades">Ver Unidades</button>
                                    <button class="quick-reply" data-message="contacto">Contacto</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="chat-input-container">
                        <input type="text" id="chatInput" class="chat-input" placeholder="Escribe tu mensaje...">
                        <button class="chat-send" id="chatSend">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatboxHTML);
    }

    setupEventListeners() {
        const toggleBtn = document.getElementById('chatToggle');
        const closeBtn = document.getElementById('chatClose');
        const sendBtn = document.getElementById('chatSend');
        const input = document.getElementById('chatInput');

        toggleBtn.addEventListener('click', () => this.toggleChat());
        closeBtn.addEventListener('click', () => this.closeChat());
        sendBtn.addEventListener('click', () => this.sendMessage());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Quick replies
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-reply')) {
                const message = e.target.dataset.message;
                this.handleQuickReply(message);
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.classList.toggle('active');

        if (this.isOpen) {
            document.getElementById('chatInput').focus();
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('chatWindow').classList.remove('active');
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        this.addMessage(message, 'user');
        input.value = '';

        // Simulate typing
        setTimeout(() => {
            const response = this.getResponse(message);
            this.addMessage(response, 'bot');
        }, 500);
    }

    handleQuickReply(keyword) {
        const response = this.responses[keyword] || this.responses.default;
        this.addMessage(keyword, 'user');
        setTimeout(() => {
            this.addMessage(response, 'bot');
        }, 500);
    }

    addMessage(text, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}-message`;

        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(text)}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ text, type, timestamp: new Date() });
        this.saveToStorage();
    }

    formatMessage(text) {
        return text.replace(/\n/g, '<br>');
    }

    getResponse(message) {
        const lowerMessage = message.toLowerCase();

        // Check for keywords
        for (const [keyword, response] of Object.entries(this.responses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }

        // Default response
        return this.responses.default;
    }

    saveToStorage() {
        localStorage.setItem('edw_chat_messages', JSON.stringify(this.messages));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('edw_chat_messages');
        if (saved) {
            this.messages = JSON.parse(saved);
            // Optionally restore messages to UI
        }
    }
}

// Initialize chatbox when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.edwChatbox = new EDWChatbox();

    // Export to ERY namespace
    window.ERY = window.ERY || {};
    window.ERY.chatbox = window.edwChatbox;
});
