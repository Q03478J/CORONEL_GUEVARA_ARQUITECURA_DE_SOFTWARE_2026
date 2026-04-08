// ===================================
// AUTHENTICATION SYSTEM - PRODUCTION READY
// ERY CURSOS - SUPABASE AUTH
// ===================================

class AuthManager {
    constructor() {
        this.supabaseClient = null;
        this.currentUser = null;
        this.currentProfile = null;
        this.ADMIN_EMAIL = 'dobleeimportaciones@gmail.com';
        this.STUDENT_EMAIL = 'cordedwinegsep@gmail.com';
        this.init();
    }

    // Initialize Supabase client
    async init() {
        const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
        const supabaseKey = document.querySelector('meta[name="supabase-key"]')?.content;

        if (!supabaseUrl || !supabaseKey || !window.supabase) {
            console.error('❌ Supabase not configured');
            return false;
        }

        try {
            this.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            console.log('✓ Auth Manager initialized');

            // Check current session
            await this.checkSession();

            // Listen for auth changes
            this.supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                if (event === 'SIGNED_IN') {
                    this.handleSignIn(session);
                } else if (event === 'SIGNED_OUT') {
                    this.handleSignOut();
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to initialize Auth:', error);
            return false;
        }
    }

    // Check current session
    async checkSession() {
        try {
            const { data: { session }, error } = await this.supabaseClient.auth.getSession();

            if (error) throw error;

            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile();
                return true;
            }

            return false;
        } catch (error) {
            console.error('Session check failed:', error);
            return false;
        }
    }

    // Load user profile from database
    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabaseClient
                .from('usuarios')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error) throw error;

            this.currentProfile = data;
            console.log('✓ User profile loaded:', this.currentProfile);
            return data;
        } catch (error) {
            console.error('Failed to load profile:', error);
            return null;
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            await this.loadUserProfile();

            // Log audit
            await this.logAudit('SIGN_IN', 'auth', null);

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign in failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign up (create new user - admin only in production)
    async signUp(email, password, fullName, role = 'student') {
        try {
            // Validate role and email combination
            if (role === 'administrator' && email !== this.ADMIN_EMAIL) {
                throw new Error('Only dobleeimportaciones@gmail.com can be administrator');
            }

            if (role === 'student' && email === this.ADMIN_EMAIL) {
                throw new Error('This email is reserved for administrator');
            }

            // Save current session
            const { data: { session: currentSession } } = await this.supabaseClient.auth.getSession();

            // Create auth user
            const { data: authData, error: authError } = await this.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    },
                    emailRedirectTo: undefined // Don't send confirmation email redirect
                }
            });

            if (authError) throw authError;

            // IMPORTANT: Restore the admin session immediately
            if (currentSession) {
                await this.supabaseClient.auth.setSession(currentSession);
                console.log('✓ Admin session restored after user creation');
            }

            // Create profile in usuarios table
            const { data: profileData, error: profileError } = await this.supabaseClient
                .from('usuarios')
                .insert([{
                    user_id: authData.user.id,
                    email: email,
                    full_name: fullName,
                    role: role,
                    active: true
                }])
                .select()
                .single();

            if (profileError) throw profileError;

            console.log('✓ User created:', profileData);
            return { success: true, user: authData.user, profile: profileData };
        } catch (error) {
            console.error('Sign up failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            // Log audit before signing out
            await this.logAudit('SIGN_OUT', 'auth', null);

            const { error } = await this.supabaseClient.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.currentProfile = null;

            console.log('✓ Signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign out failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });

            if (error) throw error;

            console.log('✓ Password reset email sent');
            return { success: true };
        } catch (error) {
            console.error('Password reset failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Update password
    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabaseClient.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            console.log('✓ Password updated');
            return { success: true };
        } catch (error) {
            console.error('Password update failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get current user
    getUser() {
        return this.currentUser;
    }

    // Get current profile
    getProfile() {
        return this.currentProfile;
    }

    // Get user role
    getRole() {
        return this.currentProfile?.role || null;
    }

    // Check if user is admin
    isAdmin() {
        return this.currentProfile?.role === 'administrator' &&
            this.currentProfile?.email === this.ADMIN_EMAIL;
    }

    // Check if user is student
    isStudent() {
        return this.currentProfile?.role === 'student';
    }

    // Check if user is evaluator
    isEvaluator() {
        return this.currentProfile?.role === 'evaluator';
    }

    // Check if user is assistant
    isAssistant() {
        return this.currentProfile?.role === 'assistant';
    }

    // Check if user has permission for action
    hasPermission(action) {
        const role = this.getRole();
        const permissions = {
            administrator: ['all'],
            evaluator: ['view_users', 'view_submissions', 'grade_submissions', 'view_grades', 'view_stats'],
            assistant: ['view_users', 'create_students', 'update_students', 'manage_deadlines', 'view_submissions'],
            student: ['view_own_profile', 'submit_assignments', 'view_own_grades']
        };

        if (role === 'administrator') return true;

        return permissions[role]?.includes(action) || false;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.currentProfile !== null;
    }

    // Protect route - redirect if not authenticated or wrong role
    protectRoute(requiredRole = null) {
        if (!this.isAuthenticated()) {
            console.log('⚠️ Not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }

        // Allow array of roles or single role
        if (requiredRole) {
            const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            if (!allowedRoles.includes(this.getRole())) {
                console.log('⚠️ Wrong role, redirecting');
                this.redirectToDashboard();
                return false;
            }
        }

        return true;
    }

    // Redirect to appropriate dashboard based on role
    redirectToDashboard() {
        const role = this.getRole();

        if (role === 'administrator') {
            window.location.href = 'dashboard-admin.html';
        } else if (role === 'evaluator') {
            window.location.href = 'dashboard-evaluator.html';
        } else if (role === 'assistant') {
            window.location.href = 'dashboard-assistant.html';
        } else if (role === 'student') {
            window.location.href = 'dashboard-student.html';
        } else {
            window.location.href = 'index.html';
        }
    }

    // Handle sign in event
    async handleSignIn(session) {
        this.currentUser = session.user;
        await this.loadUserProfile();

        // Redirect if on login page
        if (window.location.pathname.includes('login.html')) {
            this.redirectToDashboard();
        }
    }

    // Handle sign out event
    handleSignOut() {
        this.currentUser = null;
        this.currentProfile = null;

        // Redirect to home if on protected page
        const protectedPages = ['dashboard', 'admin'];
        const currentPath = window.location.pathname;

        if (protectedPages.some(page => currentPath.includes(page))) {
            window.location.href = 'index.html';
        }
    }

    // Log audit trail
    async logAudit(action, tableName = null, recordId = null, oldValues = null, newValues = null) {
        try {
            const userId = this.currentProfile?.id || null;

            await this.supabaseClient
                .from('audit_log')
                .insert([{
                    user_id: userId,
                    action: action,
                    table_name: tableName,
                    record_id: recordId,
                    old_values: oldValues,
                    new_values: newValues,
                    ip_address: await this.getClientIP(),
                    user_agent: navigator.userAgent
                }]);
        } catch (error) {
            console.error('Audit log failed:', error);
        }
    }

    // Get client IP (simplified)
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }

    // Create user (admin only)
    async createUser(email, password, fullName, role = 'student') {
        if (!this.isAdmin()) {
            return { success: false, error: 'Only administrators can create users' };
        }

        return await this.signUp(email, password, fullName, role);
    }

    // Get all users (admin only)
    async getAllUsers() {
        if (!this.isAdmin()) {
            return { success: false, error: 'Only administrators can view all users' };
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, users: data };
        } catch (error) {
            console.error('Failed to get users:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user (admin only)
    async updateUser(userId, updates) {
        if (!this.isAdmin()) {
            return { success: false, error: 'Only administrators can update users' };
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('usuarios')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            await this.logAudit('UPDATE_USER', 'usuarios', userId, null, updates);

            return { success: true, user: data };
        } catch (error) {
            console.error('Failed to update user:', error);
            return { success: false, error: error.message };
        }
    }

    // Deactivate user (admin only)
    async deactivateUser(userId) {
        return await this.updateUser(userId, { active: false });
    }

    // Activate user (admin only)
    async activateUser(userId) {
        return await this.updateUser(userId, { active: true });
    }
}

// Initialize auth manager globally
let authManager = null;

document.addEventListener('DOMContentLoaded', async () => {
    authManager = new AuthManager();
    await authManager.init();

    // Export to window for global access
    window.authManager = authManager;
    window.ERY = window.ERY || {};
    window.ERY.auth = authManager;

    console.log('✨ Authentication system ready');
});

// Export
window.AuthManager = AuthManager;
