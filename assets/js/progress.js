// ===================================
// PROGRESS TRACKING SYSTEM - BACKEND DRIVEN
// PRODUCTION READY - SUPABASE INTEGRATION
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

    // Initialize connection
    async init() {
        // Get Supabase client
        const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
        const supabaseKey = document.querySelector('meta[name="supabase-key"]')?.content;

        if (supabaseUrl && supabaseKey && window.supabase) {
            this.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✓ Progress Tracker: Supabase connected');

            // Wait for auth and load progress
            await this.loadProgressFromDatabase();
        } else {
            console.warn('⚠️ Progress Tracker: Fallback to localStorage');
            this.loadProgressFromStorage();
        }

        this.setupEventListeners();
        this.updateUI();
    }

    // Load progress from Supabase database (BACKEND-DRIVEN)
    async loadProgressFromDatabase() {
        try {
            // Wait for auth manager
            await this.waitForAuth();

            if (!window.authManager || !window.authManager.isAuthenticated()) {
                console.log('Not authenticated, using localStorage');
                this.loadProgressFromStorage();
                return;
            }

            const profile = window.authManager.getProfile();
            if (!profile) {
                this.loadProgressFromStorage();
                return;
            }

            this.currentUserId = profile.id;

            // Use database function to calculate progress
            for (const unitKey in this.unitMap) {
                const unitId = this.unitMap[unitKey];
                const progress = await this.calculateUnitProgressFromDB(this.currentUserId, unitId);

                // Get completed assignments
                const completed = await this.getCompletedAssignments(this.currentUserId, unitId);

                this.progress[unitKey] = {
                    completed: completed,
                    progress: progress,
                    total: 4
                };
            }

            console.log('✓ Progress loaded from database:', this.progress);
            this.updateUI();
        } catch (error) {
            console.error('Failed to load progress from database:', error);
            this.loadProgressFromStorage();
        }
    }

    // Wait for auth manager to be ready
    async waitForAuth() {
        let attempts = 0;
        while (!window.authManager && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    // Calculate unit progress using database function
    async calculateUnitProgressFromDB(userId, unitId) {
        try {
            const { data, error } = await this.supabaseClient
                .rpc('calculate_unit_progress', {
                    p_user_id: userId,
                    p_unit_id: unitId
                });

            if (error) throw error;

            // Ensure progress is between 0 and 100, rounded to integer
            const progress = Math.min(Math.max(Math.round(data), 0), 100);

            console.log(`Unit ${unitId} progress: ${progress}%`);
            return progress;
        } catch (error) {
            console.error(`Error calculating progress for unit ${unitId}:`, error);
            return 0;
        }
    }

    // Get completed assignments for a unit
    async getCompletedAssignments(userId, unitId) {
        try {
            const { data, error } = await this.supabaseClient
                .from('progress_tracking')
                .select('assignment_id, assignments!inner(assignment_key)')
                .eq('user_id', userId)
                .eq('unit_id', unitId)
                .eq('completed', true);

            if (error) throw error;

            // Extract assignment keys (e.g., "semana1", "semana2")
            const completed = data.map(item => {
                const key = item.assignments.assignment_key;
                const match = key.match(/semana(\d+)/);
                return match ? `semana${match[1]}` : null;
            }).filter(Boolean);

            return completed;
        } catch (error) {
            console.error(`Error getting completed assignments for unit ${unitId}:`, error);
            return [];
        }
    }

    // Load progress from localStorage (fallback)
    loadProgressFromStorage() {
        const stored = localStorage.getItem('ery_course_progress');
        if (stored) {
            this.progress = JSON.parse(stored);
        }
        console.log('✓ Progress loaded from localStorage');
    }

    // Save progress to localStorage (cache)
    saveToStorage() {
        localStorage.setItem('ery_course_progress', JSON.stringify(this.progress));
    }

    // Mark lesson as completed
    async completeLesson(unit, lessonId) {
        try {
            if (!this.currentUserId) {
                // Fallback to localStorage
                return this.completeLessonLocally(unit, lessonId);
            }

            const unitId = this.unitMap[unit];
            const assignmentKey = `${unit}_${lessonId}`;

            // Get assignment ID
            const { data: assignment, error: assignmentError } = await this.supabaseClient
                .from('assignments')
                .select('id')
                .eq('assignment_key', assignmentKey)
                .single();

            if (assignmentError) throw assignmentError;

            // Insert or update progress
            const { error: progressError } = await this.supabaseClient
                .from('progress_tracking')
                .upsert({
                    user_id: this.currentUserId,
                    unit_id: unitId,
                    assignment_id: assignment.id,
                    completed: true,
                    completed_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,assignment_id'
                });

            if (progressError) throw progressError;

            // Recalculate progress from database
            const newProgress = await this.calculateUnitProgressFromDB(this.currentUserId, unitId);
            const completed = await this.getCompletedAssignments(this.currentUserId, unitId);

            this.progress[unit].progress = newProgress;
            this.progress[unit].completed = completed;

            this.saveToStorage();
            this.updateUI();

            return true;
        } catch (error) {
            console.error('Failed to complete lesson:', error);
            return this.completeLessonLocally(unit, lessonId);
        }
    }

    // Mark lesson as incomplete
    async uncompleteLesson(unit, lessonId) {
        try {
            if (!this.currentUserId) {
                return this.uncompleteLessonLocally(unit, lessonId);
            }

            const unitId = this.unitMap[unit];
            const assignmentKey = `${unit}_${lessonId}`;

            // Get assignment ID
            const { data: assignment, error: assignmentError } = await this.supabaseClient
                .from('assignments')
                .select('id')
                .eq('assignment_key', assignmentKey)
                .single();

            if (assignmentError) throw assignmentError;

            // Update progress to not completed
            const { error: progressError } = await this.supabaseClient
                .from('progress_tracking')
                .upsert({
                    user_id: this.currentUserId,
                    unit_id: unitId,
                    assignment_id: assignment.id,
                    completed: false,
                    completed_at: null
                }, {
                    onConflict: 'user_id,assignment_id'
                });

            if (progressError) throw progressError;

            // Recalculate progress from database
            const newProgress = await this.calculateUnitProgressFromDB(this.currentUserId, unitId);
            const completed = await this.getCompletedAssignments(this.currentUserId, unitId);

            this.progress[unit].progress = newProgress;
            this.progress[unit].completed = completed;

            this.saveToStorage();
            this.updateUI();

            return true;
        } catch (error) {
            console.error('Failed to uncomplete lesson:', error);
            return this.uncompleteLessonLocally(unit, lessonId);
        }
    }

    // Local completion (fallback)
    completeLessonLocally(unit, lessonId) {
        if (!this.progress[unit].completed.includes(lessonId)) {
            this.progress[unit].completed.push(lessonId);

            // Calculate progress: (completed / total) * 100
            const completedCount = this.progress[unit].completed.length;
            const total = this.progress[unit].total;
            const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            // Ensure not over 100%
            this.progress[unit].progress = Math.min(progressPercent, 100);

            this.saveToStorage();
            this.updateUI();
            return true;
        }
        return false;
    }

    // Local uncompletion (fallback)
    uncompleteLessonLocally(unit, lessonId) {
        const index = this.progress[unit].completed.indexOf(lessonId);
        if (index > -1) {
            this.progress[unit].completed.splice(index, 1);

            // Calculate progress: (completed / total) * 100
            const completedCount = this.progress[unit].completed.length;
            const total = this.progress[unit].total;
            const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            this.progress[unit].progress = Math.min(progressPercent, 100);

            this.saveToStorage();
            this.updateUI();
            return true;
        }
        return false;
    }

    // Toggle lesson completion
    async toggleLesson(unit, lessonId) {
        if (this.isCompleted(unit, lessonId)) {
            return await this.uncompleteLesson(unit, lessonId);
        } else {
            return await this.completeLesson(unit, lessonId);
        }
    }

    // Check if lesson is completed
    isCompleted(unit, lessonId) {
        return this.progress[unit].completed.includes(lessonId);
    }

    // Get unit progress
    getUnitProgress(unit) {
        return this.progress[unit];
    }

    // Get overall progress
    async getOverallProgress() {
        if (this.currentUserId && this.supabaseClient) {
            try {
                const { data, error } = await this.supabaseClient
                    .rpc('calculate_overall_progress', {
                        p_user_id: this.currentUserId
                    });

                if (error) throw error;
                return Math.min(Math.max(Math.round(data), 0), 100);
            } catch (error) {
                console.error('Error calculating overall progress:', error);
            }
        }

        // Fallback to local calculation
        const units = Object.keys(this.progress);
        const totalProgress = units.reduce((sum, unit) => sum + this.progress[unit].progress, 0);
        return Math.round(totalProgress / units.length);
    }

    // Update UI elements
    updateUI() {
        // Update progress text elements
        document.querySelectorAll('[id$="-progress-text"]').forEach(el => {
            const unitMatch = el.id.match(/unit(\d+)-progress-text/);
            if (unitMatch) {
                const unitKey = `unidad${unitMatch[1]}`;
                const progress = this.progress[unitKey].progress;
                el.textContent = `${progress}%`;
            }
        });

        // Update progress bars - ENSURE EXACT WIDTH
        document.querySelectorAll('.progress-bar').forEach(bar => {
            const unit = bar.dataset.unit;
            if (unit && this.progress[unit]) {
                const progress = this.progress[unit].progress;

                // Set width to EXACT progress percentage
                bar.style.width = `${progress}%`;

                // Add completion class if 100%
                if (progress === 100) {
                    bar.classList.add('progress-complete');

                    // Show trophy celebration
                    if (this.progress[unit].completed.length > 0) {
                        this.showTrophyCelebration(unit);
                    }
                } else {
                    bar.classList.remove('progress-complete');
                }
            }
        });

        // Update checkboxes
        document.querySelectorAll('.lesson-checkbox').forEach(checkbox => {
            const unit = checkbox.dataset.unit;
            const lessonId = checkbox.dataset.lessonId;
            if (unit && lessonId) {
                checkbox.checked = this.isCompleted(unit, lessonId);
            }
        });

        // Update unit cards
        document.querySelectorAll('.unit-card').forEach(card => {
            const unitLink = card.getAttribute('href');
            if (unitLink) {
                const unitMatch = unitLink.match(/unidad(\d+)/);
                if (unitMatch) {
                    const unitKey = `unidad${unitMatch[1]}`;
                    const progressEl = card.querySelector('.unit-progress');
                    if (progressEl) {
                        const progress = this.progress[unitKey].progress;
                        progressEl.textContent = `${progress}% completado`;

                        if (progress === 100) {
                            progressEl.innerHTML = `<span class="badge badge-success">✓ Completado</span>`;
                        } else if (progress > 0) {
                            progressEl.innerHTML = `<span class="badge badge-info">${progress}% en progreso</span>`;
                        }
                    }
                }
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for lesson completion clicks
        document.addEventListener('click', async (e) => {
            const checkbox = e.target.closest('.lesson-checkbox');
            if (checkbox) {
                const unit = checkbox.dataset.unit;
                const lessonId = checkbox.dataset.lessonId;
                if (unit && lessonId) {
                    await this.toggleLesson(unit, lessonId);

                    const isCompleted = this.isCompleted(unit, lessonId);
                    if (window.ERY?.utils?.showNotification) {
                        if (isCompleted) {
                            window.ERY.utils.showNotification('¡Lección completada! 🎉', 'success');
                        } else {
                            window.ERY.utils.showNotification('Lección marcada como pendiente', 'info');
                        }
                    }
                }
            }
        });
    }

    // Show trophy celebration at 100%
    showTrophyCelebration(unit) {
        const celebrationKey = `celebration_${unit}`;
        if (sessionStorage.getItem(celebrationKey)) {
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'trophy-modal';
        modal.innerHTML = `
            <div class="trophy-container">
                <div class="trophy-content">
                    <div class="trophy-icon">🏆</div>
                    <h2 class="trophy-title">¡Felicitaciones!</h2>
                    <p class="trophy-message">Has completado el 100% de ${unit.toUpperCase().replace('UNIDAD', 'UNIDAD ')}</p>
                    <button class="btn btn-primary trophy-close">Continuar</button>
                </div>
                <div class="confetti"></div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        this.createConfetti(modal.querySelector('.confetti'));

        modal.querySelector('.trophy-close').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });

        sessionStorage.setItem(celebrationKey, 'true');
        this.playSuccessSound();
    }

    // Create confetti effect
    createConfetti(container) {
        const colors = ['#FF7A48', '#0593A2', '#103778', '#E3371E', '#FFD700'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            container.appendChild(confetti);
        }
    }

    // Play success sound
    playSuccessSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt5qxxHwUthssx');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (e) {
            // Silent fail
        }
    }
}

// Initialize progress tracker
document.addEventListener('DOMContentLoaded', () => {
    window.progressTracker = new ProgressTracker();

    window.ERY = window.ERY || {};
    window.ERY.progressTracker = window.progressTracker;

    console.log('✨ Progress Tracker initialized (Backend-driven)');
});
