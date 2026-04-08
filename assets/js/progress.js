// ===================================
// PROGRESS TRACKING SYSTEM - ERY CURSOS
// INTEGRACIÓN SUPABASE & UI SYNC
// ===================================

class ProgressTracker {
    constructor() {
        this.supabaseClient = null;
        this.currentUserId = null;
        this.progress = {
            unidad1: { completed: [], progress: 0, total: 4 },
            unidad2: { completed: [], progress: 0, total: 4 },
            unidad3: { completed: [], progress: 0, total: 4 },
            unidad4: { completed: [], progress: 0, total: 4 }
        };
        this.unitMap = {
            'unidad1': 1,
            'unidad2': 2,
            'unidad3': 3,
            'unidad4': 4
        };
        this.init();
    }

    async init() {
        // Capturar credenciales de Supabase desde los Meta Tags (asegúrate de tenerlos en el index.html)
        const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
        const supabaseKey = document.querySelector('meta[name="supabase-key"]')?.content;

        if (supabaseUrl && supabaseKey && window.supabase) {
            this.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✓ Supabase conectado');
            await this.loadProgressFromDatabase();
        } else {
            console.warn('⚠️ Fallback a localStorage (Modo Offline)');
            this.loadProgressFromStorage();
        }

        this.setupEventListeners();
        this.updateUI();
    }

    // --- CARGA DE DATOS ---
    async loadProgressFromDatabase() {
        try {
            await this.waitForAuth();
            if (!window.authManager || !window.authManager.isAuthenticated()) {
                this.loadProgressFromStorage();
                return;
            }

            const profile = window.authManager.getProfile();
            this.currentUserId = profile.id;

            for (const unitKey in this.unitMap) {
                const unitId = this.unitMap[unitKey];
                
                // RPC: Llama a una función de base de datos para obtener el %
                const { data: progressData } = await this.supabaseClient.rpc('calculate_unit_progress', {
                    p_user_id: this.currentUserId,
                    p_unit_id: unitId
                });

                // Obtener IDs específicos de lecciones completadas
                const { data: completedData } = await this.supabaseClient
                    .from('progress_tracking')
                    .select('assignment_key')
                    .eq('user_id', this.currentUserId)
                    .eq('unit_id', unitId)
                    .eq('completed', true);

                this.progress[unitKey] = {
                    completed: completedData?.map(d => d.assignment_key) || [],
                    progress: Math.min(Math.max(Math.round(progressData || 0), 0), 100),
                    total: 4
                };
            }
            this.updateUI();
        } catch (error) {
            console.error('Error cargando desde DB:', error);
            this.loadProgressFromStorage();
        }
    }

    // --- LÓGICA DE COMPLETADO ---
    async toggleLesson(unit, lessonId) {
        const isCurrentlyCompleted = this.isCompleted(unit, lessonId);
        const newState = !isCurrentlyCompleted;

        try {
            if (this.currentUserId) {
                // Actualizar en Supabase
                await this.supabaseClient
                    .from('progress_tracking')
                    .upsert({
                        user_id: this.currentUserId,
                        unit_id: this.unitMap[unit],
                        assignment_key: lessonId,
                        completed: newState,
                        updated_at: new Date().toISOString()
                    });
            }

            // Actualizar estado local
            if (newState) {
                if (!this.progress[unit].completed.includes(lessonId)) {
                    this.progress[unit].completed.push(lessonId);
                }
            } else {
                this.progress[unit].completed = this.progress[unit].completed.filter(id => id !== lessonId);
            }

            // Recalcular % localmente para respuesta inmediata
            const count = this.progress[unit].completed.length;
            this.progress[unit].progress = Math.round((count / this.progress[unit].total) * 100);

            this.saveToStorage();
            this.updateUI();
            
            // Notificación visual
            this.notify(newState ? '¡Lección completada! 🎉' : 'Lección pendiente', newState ? 'success' : 'info');

            return true;
        } catch (error) {
            console.error('Error al cambiar estado de lección:', error);
            return false;
        }
    }

    // --- ACTUALIZACIÓN DE UI ---
    updateUI() {
        // 1. Actualizar textos de porcentaje (ej: unit1-progress-text)
        Object.keys(this.progress).forEach(unitKey => {
            const unitNumber = unitKey.replace('unidad', '');
            const textEl = document.getElementById(`unit${unitNumber}-progress-text`);
            if (textEl) textEl.textContent = `${this.progress[unitKey].progress}%`;

            // 2. Actualizar Barras de Progreso
            const bar = document.querySelector(`.progress-bar[data-unit="${unitKey}"]`);
            if (bar) {
                const p = this.progress[unitKey].progress;
                bar.style.width = `${p}%`;
                bar.classList.toggle('progress-complete', p === 100);
                
                if (p === 100) this.showTrophyCelebration(unitKey);
            }
        });

        // 3. Sincronizar Checkboxes
        document.querySelectorAll('.lesson-checkbox').forEach(cb => {
            const { unit, lessonId } = cb.dataset;
            if (unit && lessonId) {
                cb.checked = this.isCompleted(unit, lessonId);
            }
        });
    }

    // --- UTILIDADES ---
    isCompleted(unit, lessonId) {
        return this.progress[unit]?.completed.includes(lessonId);
    }

    notify(msg, type) {
        if (window.ERY?.utils?.showNotification) {
            window.ERY.utils.showNotification(msg, type);
        }
    }

    loadProgressFromStorage() {
        const stored = localStorage.getItem('ery_course_progress');
        if (stored) this.progress = JSON.parse(stored);
    }

    saveToStorage() {
        localStorage.setItem('ery_course_progress', JSON.stringify(this.progress));
    }

    async waitForAuth() {
        let attempts = 0;
        while (!window.authManager && attempts < 30) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
    }

    setupEventListeners() {
        document.addEventListener('change', async (e) => {
            if (e.target.classList.contains('lesson-checkbox')) {
                const { unit, lessonId } = e.target.dataset;
                await this.toggleLesson(unit, lessonId);
            }
        });
    }

    showTrophyCelebration(unit) {
        const key = `celebrated_${unit}`;
        if (sessionStorage.getItem(key)) return;

        const overlay = document.createElement('div');
        overlay.className = 'trophy-modal show';
        overlay.innerHTML = `
            <div class="trophy-container">
                <div class="trophy-icon">🏆</div>
                <h2>¡Excelente trabajo!</h2>
                <p>Has completado todos los temas de la ${unit.toUpperCase()}</p>
                <button class="btn btn-primary" onclick="this.closest('.trophy-modal').remove()">Continuar aprendiendo</button>
            </div>
        `;
        document.body.appendChild(overlay);
        sessionStorage.setItem(key, 'true');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.progressTracker = new ProgressTracker();
});
