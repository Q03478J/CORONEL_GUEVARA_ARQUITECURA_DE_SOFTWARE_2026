// ===================================
// AUTHENTICATION SYSTEM - FIREBASE
// Reemplaza a Supabase Auth
// ===================================

class AuthManager {
    constructor() {
        this.firebaseAuth = null;
        this.firebaseDb = null;
        this.currentUser = null;
        this.currentProfile = null;
        this.ADMIN_EMAIL = 'dobleeimportaciones@gmail.com';
    }

    async init() {
        // Esperar a que Firebase esté listo
        if (!window.firebase) {
            console.error('❌ Firebase no está inicializado');
            return false;
        }

        try {
            this.firebaseAuth = window.firebase.auth;
            this.firebaseDb = window.firebase.db;

            // ✅ Exponer para otros scripts
            window.ERY.auth = this;
            console.log('✅ Auth: Firebase listo');

            // Verificar sesión al cargar
            await this.checkSession();

            // Escuchar cambios de autenticación
            this.firebaseAuth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.loadUserProfile();
                    document.dispatchEvent(new Event('authStateChanged'));
                } else {
                    this.currentUser = null;
                    this.currentProfile = null;
                    document.dispatchEvent(new Event('authStateChanged'));
                }
            });

            return true;
        } catch (error) {
            console.error('Error inicializando Auth:', error);
            return false;
        }
    }

    // --- SESIÓN Y PERFIL ---
    async checkSession() {
        return new Promise((resolve) => {
            this.firebaseAuth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.currentUser = user;
                    await this.loadUserProfile();
                    document.dispatchEvent(new Event('authStateChanged'));
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });
    }

    async loadUserProfile() {
        if (!this.currentUser) return null;
        try {
            const userDoc = await this.firebaseDb.collection('usuarios').doc(this.currentUser.uid).get();
            
            if (userDoc.exists) {
                this.currentProfile = userDoc.data();
                return this.currentProfile;
            } else {
                console.warn('⚠️ Perfil de usuario no encontrado en Firestore');
                return null;
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
            return null;
        }
    }

    // --- ACCIONES DE USUARIO ---
    async signIn(email, password) {
        try {
            const result = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
            await this.loadUserProfile();
            await this.logAudit('SIGN_IN', 'auth');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signUp(email, password, role = 'student') {
        try {
            const result = await this.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const uid = result.user.uid;

            // Crear perfil en Firestore
            await this.firebaseDb.collection('usuarios').doc(uid).set({
                user_id: uid,
                email: email,
                role: role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            this.currentUser = result.user;
            await this.loadUserProfile();
            await this.logAudit('SIGN_UP', 'auth');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await this.firebaseAuth.signOut();
            this.currentUser = null;
            this.currentProfile = null;
            document.dispatchEvent(new Event('authStateChanged'));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async resetPassword(email) {
        try {
            await this.firebaseAuth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // --- ROLES Y PERMISOS ---
    hasRole(role) {
        if (!this.currentProfile) return false;
        return this.currentProfile.role === role;
    }

    isAdmin() {
        return this.currentUser?.email === this.ADMIN_EMAIL || this.hasRole('admin');
    }

    isTeacher() {
        return this.hasRole('teacher') || this.isAdmin();
    }

    isStudent() {
        return this.hasRole('student');
    }

    // --- AUDITORÍA ---
    async logAudit(action, category) {
        if (!this.currentUser) return;
        try {
            await this.firebaseDb.collection('audit_logs').add({
                user_id: this.currentUser.uid,
                email: this.currentUser.email,
                action: action,
                category: category,
                timestamp: new Date().toISOString(),
                ip_info: 'logged_from_client'
            });
        } catch (error) {
            console.warn('⚠️ Error logging audit:', error);
        }
    }

    // --- UTILIDADES ---
    isLoggedIn() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentProfile() {
        return this.currentProfile;
    }
}

// Inicialización global
window.ERY = window.ERY || {};

// Esperar a que Firebase esté listo antes de inicializar Auth
const waitForFirebase = setInterval(async () => {
    if (window.firebase && window.firebase.auth) {
        clearInterval(waitForFirebase);
        const authManager = new AuthManager();
        await authManager.init();
    }
}, 100);
