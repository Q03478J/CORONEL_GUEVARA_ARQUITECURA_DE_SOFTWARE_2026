/**
 * Admin Assignments Module - Deadline Management
 * Handles setting and updating assignment deadlines
 */

class AdminAssignmentsManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Load all assignments with deadlines
     */
    async loadAssignmentsWithDeadlines() {
        try {
            const { data, error } = await this.supabase
                .from('assignments')
                .select('*, units(*)')
                .order('unit_id', { ascending: true })
                .order('week_number', { ascending: true });

            if (error) throw error;

            // Add status to each assignment
            const now = new Date();
            const assignmentsWithStatus = data.map(assignment => {
                let status = 'no-deadline';

                if (assignment.deadline) {
                    const deadline = new Date(assignment.deadline);
                    const daysUntil = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

                    if (daysUntil < 0) {
                        status = 'overdue';
                    } else if (daysUntil <= 3) {
                        status = 'upcoming';
                    } else {
                        status = 'active';
                    }
                }

                return { ...assignment, status };
            });

            return { success: true, data: assignmentsWithStatus };
        } catch (error) {
            console.error('Error loading assignments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update assignment deadline
     * @param {string} assignmentId - Assignment UUID
     * @param {string} newDeadline - ISO date string
     */
    async updateDeadline(assignmentId, newDeadline) {
        try {
            const { data, error } = await this.supabase
                .from('assignments')
                .update({ deadline: newDeadline })
                .eq('id', assignmentId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error updating deadline:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Bulk update deadlines
     * @param {Array} assignments - Array of { id, deadline }
     */
    async bulkUpdateDeadlines(assignments) {
        try {
            const results = [];

            for (const assignment of assignments) {
                const result = await this.updateDeadline(assignment.id, assignment.deadline);
                results.push(result);
            }

            const allSuccess = results.every(r => r.success);

            return {
                success: allSuccess,
                results,
                message: allSuccess ? 'Todas las fechas actualizadas' : 'Algunas fechas no se actualizaron'
            };
        } catch (error) {
            console.error('Error bulk updating deadlines:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get upcoming deadlines (next 7 days)
     */
    async getUpcomingDeadlines() {
        try {
            const now = new Date();
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);

            const { data, error } = await this.supabase
                .from('assignments')
                .select('*, units(*)')
                .gte('deadline', now.toISOString())
                .lte('deadline', nextWeek.toISOString())
                .order('deadline', { ascending: true });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error getting upcoming deadlines:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get overdue assignments
     */
    async getOverdueAssignments() {
        try {
            const now = new Date();

            const { data, error } = await this.supabase
                .from('assignments')
                .select('*, units(*)')
                .lt('deadline', now.toISOString())
                .order('deadline', { ascending: false });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error getting overdue assignments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Set deadlines for entire unit (4 weeks with incremental dates)
     * @param {number} unitId - Unit ID
     * @param {string} startDate - Start date for week 1
     * @param {number} daysBetween - Days between each week (default 7)
     */
    async setUnitDeadlines(unitId, startDate, daysBetween = 7) {
        try {
            const { data: assignments, error: fetchError } = await this.supabase
                .from('assignments')
                .select('*')
                .eq('unit_id', unitId)
                .order('week_number', { ascending: true });

            if (fetchError) throw fetchError;

            const updates = [];
            const baseDate = new Date(startDate);

            for (let i = 0; i < assignments.length; i++) {
                const deadline = new Date(baseDate);
                deadline.setDate(deadline.getDate() + (i * daysBetween));

                updates.push({
                    id: assignments[i].id,
                    deadline: deadline.toISOString()
                });
            }

            return await this.bulkUpdateDeadlines(updates);
        } catch (error) {
            console.error('Error setting unit deadlines:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear deadline for assignment
     * @param {string} assignmentId - Assignment UUID
     */
    async clearDeadline(assignmentId) {
        try {
            const { data, error } = await this.supabase
                .from('assignments')
                .update({ deadline: null })
                .eq('id', assignmentId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error clearing deadline:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.AdminAssignmentsManager = AdminAssignmentsManager;
}
