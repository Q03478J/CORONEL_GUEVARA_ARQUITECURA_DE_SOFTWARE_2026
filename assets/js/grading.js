/**
 * Grading System Module
 * Handles grading submissions and managing grades
 */

class GradingManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Load pending submissions (not graded yet)
     * @param {Object} filters - { unitId, studentId }
     */
    async loadPendingSubmissions(filters = {}) {
        try {
            let query = this.supabase
                .from('submissions')
                .select(`
                    *,
                    usuarios!submissions_user_id_fkey(id, full_name, email),
                    assignments(*, units(*))
                `)
                .eq('status', 'submitted')
                .order('submitted_at', { ascending: false });

            // Check if submission doesn't have a grade
            const { data: allSubmissions, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Filter out submissions that already have grades
            const { data: grades, error: gradesError } = await this.supabase
                .from('grades')
                .select('submission_id');

            if (gradesError) throw gradesError;

            const gradedSubmissionIds = new Set(grades.map(g => g.submission_id));
            const pendingSubmissions = allSubmissions.filter(
                sub => !gradedSubmissionIds.has(sub.id)
            );

            // Apply additional filters
            let filtered = pendingSubmissions;

            if (filters.unitId) {
                filtered = filtered.filter(
                    sub => sub.assignments?.unit_id === parseInt(filters.unitId)
                );
            }

            if (filters.studentId) {
                filtered = filtered.filter(sub => sub.user_id === filters.studentId);
            }

            return { success: true, data: filtered };
        } catch (error) {
            console.error('Error loading pending submissions:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Grade a submission
     * @param {Object} gradeData - { submissionId, grade, feedback, gradedBy }
     */
    async gradeSubmission(submissionId, grade, feedback, gradedBy) {
        try {
            // Get submission details
            const { data: submission, error: subError } = await this.supabase
                .from('submissions')
                .select('*, assignments(*)')
                .eq('id', submissionId)
                .single();

            if (subError) throw subError;

            // Insert grade
            const { data, error } = await this.supabase
                .from('grades')
                .insert({
                    submission_id: submissionId,
                    student_id: submission.user_id,
                    assignment_id: submission.assignment_id,
                    grade: parseFloat(grade),
                    feedback: feedback,
                    graded_by: gradedBy
                })
                .select();

            if (error) throw error;

            // Update submission status to completed
            await this.supabase
                .from('submissions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', submissionId);

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error grading submission:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get student grades
     * @param {string} studentId - Student UUID
     * @param {number} unitId - Optional unit filter
     */
    async getStudentGrades(studentId, unitId = null) {
        try {
            let query = this.supabase
                .from('grades')
                .select(`
                    *,
                    assignments(*, units(*)),
                    usuarios!grades_graded_by_fkey(full_name)
                `)
                .eq('student_id', studentId)
                .order('graded_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            let filtered = data;

            if (unitId) {
                filtered = data.filter(
                    grade => grade.assignments?.unit_id === parseInt(unitId)
                );
            }

            return { success: true, data: filtered };
        } catch (error) {
            console.error('Error getting student grades:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate unit average for student
     * @param {string} studentId - Student UUID
     * @param {number} unitId - Unit ID
     */
    async calculateUnitAverage(studentId, unitId) {
        try {
            const { data, error } = await this.supabase
                .from('grades')
                .select('grade, assignments!inner(unit_id)')
                .eq('student_id', studentId)
                .eq('assignments.unit_id', unitId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return { success: true, average: null, count: 0 };
            }

            const sum = data.reduce((acc, grade) => acc + parseFloat(grade.grade), 0);
            const average = sum / data.length;

            return {
                success: true,
                average: Math.round(average * 100) / 100,
                count: data.length
            };
        } catch (error) {
            console.error('Error calculating unit average:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate overall average for student
     * @param {string} studentId - Student UUID
     */
    async calculateOverallAverage(studentId) {
        try {
            const { data, error } = await this.supabase
                .from('grades')
                .select('grade')
                .eq('student_id', studentId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return { success: true, average: null, count: 0 };
            }

            const sum = data.reduce((acc, grade) => acc + parseFloat(grade.grade), 0);
            const average = sum / data.length;

            return {
                success: true,
                average: Math.round(average * 100) / 100,
                count: data.length
            };
        } catch (error) {
            console.error('Error calculating overall average:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Export grades to CSV
     * @param {Object} filters - { unitId, studentId }
     */
    async exportGradesToCSV(filters = {}) {
        try {
            let query = this.supabase
                .from('grades')
                .select(`
                    *,
                    usuarios!grades_student_id_fkey(full_name, email),
                    assignments(title, units(title)),
                    usuarios!grades_graded_by_fkey(full_name)
                `)
                .order('graded_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            // Apply filters
            let filtered = data;

            if (filters.unitId) {
                filtered = filtered.filter(
                    grade => grade.assignments?.units?.id === parseInt(filters.unitId)
                );
            }

            if (filters.studentId) {
                filtered = filtered.filter(grade => grade.student_id === filters.studentId);
            }

            // Generate CSV
            const headers = ['Estudiante', 'Email', 'Unidad', 'Tarea', 'Calificación', 'Feedback', 'Calificado por', 'Fecha'];
            const rows = filtered.map(grade => [
                grade.usuarios.full_name,
                grade.usuarios.email,
                grade.assignments?.units?.title || 'N/A',
                grade.assignments?.title || 'N/A',
                grade.grade,
                grade.feedback || '',
                grade.usuarios.full_name || 'N/A',
                new Date(grade.graded_at).toLocaleDateString('es-ES')
            ]);

            const csv = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Create download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `calificaciones_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            return { success: true, message: 'CSV exportado correctamente' };
        } catch (error) {
            console.error('Error exporting grades:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update grade
     * @param {string} gradeId - Grade UUID
     * @param {Object} updates - { grade, feedback }
     */
    async updateGrade(gradeId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('grades')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', gradeId)
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error updating grade:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get grading statistics
     */
    async getGradingStats() {
        try {
            const { count: totalGraded } = await this.supabase
                .from('grades')
                .select('*', { count: 'exact', head: true });

            const { count: totalSubmissions } = await this.supabase
                .from('submissions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'submitted');

            const { data: avgGrade } = await this.supabase
                .from('grades')
                .select('grade');

            let average = 0;
            if (avgGrade && avgGrade.length > 0) {
                const sum = avgGrade.reduce((acc, g) => acc + parseFloat(g.grade), 0);
                average = Math.round((sum / avgGrade.length) * 100) / 100;
            }

            return {
                success: true,
                data: {
                    totalGraded: totalGraded || 0,
                    pending: totalSubmissions || 0,
                    averageGrade: average
                }
            };
        } catch (error) {
            console.error('Error getting grading stats:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.GradingManager = GradingManager;
}
