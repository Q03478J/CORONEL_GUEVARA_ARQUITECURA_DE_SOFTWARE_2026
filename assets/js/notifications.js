/**
 * Notifications System Module
 * Handles sending and managing notifications
 */

class NotificationsManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Send notification
     * @param {Object} notificationData - { title, message, recipients, type }
     */
    async sendNotification(title, message, recipients, type = 'info', createdBy) {
        try {
            // Convert recipients to array if string
            let recipientsArray = Array.isArray(recipients) ? recipients : [recipients];

            const { data, error } = await this.supabase
                .from('notifications')
                .insert({
                    title,
                    message,
                    recipients: recipientsArray,
                    type,
                    created_by: createdBy,
                    sent: true,
                    sent_at: new Date().toISOString()
                })
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error sending notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Schedule notification for later
     * @param {Object} notificationData - { title, message, recipients, type, scheduledFor }
     */
    async scheduleNotification(title, message, recipients, scheduledFor, type = 'info', createdBy) {
        try {
            let recipientsArray = Array.isArray(recipients) ? recipients : [recipients];

            const { data, error } = await this.supabase
                .from('notifications')
                .insert({
                    title,
                    message,
                    recipients: recipientsArray,
                    type,
                    created_by: createdBy,
                    scheduled_for: scheduledFor,
                    sent: false
                })
                .select();

            if (error) throw error;

            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get notification history
     * @param {Object} filters - { sent, limit }
     */
    async getNotificationHistory(filters = {}) {
        try {
            let query = this.supabase
                .from('notifications')
                .select('*, usuarios(full_name)')
                .order('created_at', { ascending: false });

            if (filters.sent !== undefined) {
                query = query.eq('sent', filters.sent);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error getting notification history:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get notifications for current user
     * @param {string} userRole - User role
     */
    async getMyNotifications(userRole) {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .or(`recipients.cs.{${userRole}},recipients.cs.{all}`)
                .eq('sent', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error getting my notifications:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get notification templates
     */
    getNotificationTemplates() {
        return [
            {
                id: 'deadline_reminder',
                title: 'Recordatorio de Fecha Límite',
                message: 'Recuerda que la fecha límite para [TAREA] es [FECHA]. ¡No olvides entregar tu trabajo!',
                type: 'warning',
                recipients: ['student']
            },
            {
                id: 'new_assignment',
                title: 'Nueva Asignación Disponible',
                message: 'Se ha publicado una nueva tarea: [TAREA]. Revisa los detalles en tu dashboard.',
                type: 'info',
                recipients: ['student']
            },
            {
                id: 'grade_published',
                title: 'Calificación Publicada',
                message: 'Tu calificación para [TAREA] ha sido publicada. Revisa tus notas en el dashboard.',
                type: 'success',
                recipients: ['student']
            },
            {
                id: 'system_maintenance',
                title: 'Mantenimiento del Sistema',
                message: 'El sistema estará en mantenimiento el [FECHA] de [HORA] a [HORA]. Planifica tu trabajo en consecuencia.',
                type: 'warning',
                recipients: ['all']
            },
            {
                id: 'course_update',
                title: 'Actualización del Curso',
                message: 'Se ha actualizado el contenido de [UNIDAD]. Revisa los nuevos materiales disponibles.',
                type: 'info',
                recipients: ['student']
            }
        ];
    }

    /**
     * Send bulk notification to all students
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {string} createdBy - Creator UUID
     */
    async sendToAllStudents(title, message, type, createdBy) {
        return await this.sendNotification(title, message, ['student'], type, createdBy);
    }

    /**
     * Send notification to specific students
     * @param {Array} studentIds - Array of student UUIDs
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {string} createdBy - Creator UUID
     */
    async sendToStudents(studentIds, title, message, type, createdBy) {
        try {
            // For now, we'll send one notification per student
            // In a real system, you might want to batch this differently
            const results = [];

            for (const studentId of studentIds) {
                const result = await this.sendNotification(
                    title,
                    message,
                    [`student_${studentId}`],
                    type,
                    createdBy
                );
                results.push(result);
            }

            const allSuccess = results.every(r => r.success);

            return {
                success: allSuccess,
                results,
                message: allSuccess ? 'Notificaciones enviadas' : 'Algunas notificaciones fallaron'
            };
        } catch (error) {
            console.error('Error sending to students:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete notification
     * @param {string} notificationId - Notification UUID
     */
    async deleteNotification(notificationId) {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.NotificationsManager = NotificationsManager;
}
