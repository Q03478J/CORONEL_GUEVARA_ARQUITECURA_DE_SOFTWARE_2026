/**
 * Admin Users Module - CRUD Operations for User Management
 * Handles creating, reading, updating, and deactivating users
 */

class AdminUsersManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Load users with optional filters
     * @param {Object} filters - { role, active, search }
     */
    async loadUsers(filters = {}) {
        try {
            let query = this.supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.role && filters.role !== 'all') {
                query = query.eq('role', filters.role);
            }

            if (filters.active !== undefined && filters.active !== 'all') {
                query = query.eq('active', filters.active === 'true');
            }

            if (filters.search) {
                query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error loading users:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new user (any role)
     * @param {Object} userData - { email, name, password, role }
     */
    async createUser(email, password, name, role) {
        try {
            // Use authManager if available
            if (window.authManager) {
                return await window.authManager.createUser(email, password, name, role);
            }

            // Fallback: manual creation (requires admin privileges)
            throw new Error('AuthManager not available');
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update user information
     * @param {string} userId - UUID from usuarios table
     * @param {Object} updates - { full_name, role, email }
     */
    async updateUser(userId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deactivate user (soft delete)
     * @param {string} userId - UUID from usuarios table
     */
    async deactivateUser(userId) {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .update({
                    active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error deactivating user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Activate user
     * @param {string} userId - UUID from usuarios table
     */
    async activateUser(userId) {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .update({
                    active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error activating user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Search users in real-time
     * @param {string} query - Search query
     */
    async searchUsers(query) {
        if (!query || query.trim() === '') {
            return this.loadUsers();
        }

        return this.loadUsers({ search: query.trim() });
    }

    /**
     * Get user by ID
     * @param {string} userId - UUID from usuarios table
     */
    async getUserById(userId) {
        try {
            const { data, error } = await this.supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user statistics
     */
    async getUserStats() {
        try {
            const { count: totalUsers } = await this.supabase
                .from('usuarios')
                .select('*', { count: 'exact', head: true });

            const { count: activeUsers } = await this.supabase
                .from('usuarios')
                .select('*', { count: 'exact', head: true })
                .eq('active', true);

            const { count: students } = await this.supabase
                .from('usuarios')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');

            const { count: evaluators } = await this.supabase
                .from('usuarios')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'evaluator');

            const { count: assistants } = await this.supabase
                .from('usuarios')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'assistant');

            return {
                success: true,
                data: {
                    total: totalUsers || 0,
                    active: activeUsers || 0,
                    students: students || 0,
                    evaluators: evaluators || 0,
                    assistants: assistants || 0
                }
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminUsersManager = AdminUsersManager;
}
