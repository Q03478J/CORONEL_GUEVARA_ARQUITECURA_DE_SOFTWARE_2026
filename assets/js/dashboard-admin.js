/**
 * Admin Dashboard Main Script
 * Integrates all admin modules and handles UI interactions
 */

// Global managers
let usersManager, assignmentsManager, gradingManager, notificationsManager;
let supabase, currentUser;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for auth manager
    while (!window.authManager) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Protect route - only admin
    if (!window.authManager.protectRoute('administrator')) {
        return;
    }

    supabase = window.authManager.supabaseClient;
    currentUser = window.authManager.getProfile();

    // Initialize managers
    usersManager = new AdminUsersManager(supabase);
    assignmentsManager = new AdminAssignmentsManager(supabase);
    gradingManager = new GradingManager(supabase);
    notificationsManager = new NotificationsManager(supabase);

    // Set welcome text
    document.getElementById('welcomeText').textContent = `Bienvenido, ${currentUser.full_name}`;

    // Load dashboard data
    await loadStats();
    await loadStudents();
    await loadAssignments();
    await loadGradingStats();
    await loadNotifications();
    await loadSettings();

    // Setup event listeners
    setupEventListeners();

    console.log('✓ Admin Dashboard ready');
});

// =================================
// SETUP EVENT LISTENERS
// =================================
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

            btn.classList.add('active');
            document.getElementById(`${tab}-tab`).style.display = 'block';

            // Load tab-specific data
            switch (tab) {
                case 'students':
                    loadStudents();
                    break;
                case 'assignments':
                    loadAssignments();
                    break;
                case 'grades':
                    loadPendingSubmissions();
                    break;
                case 'notifications':
                    loadNotifications();
                    break;
            }
        });
    });

    // Create user modal
    document.getElementById('createStudentBtn').addEventListener('click', () => {
        document.getElementById('createStudentModal').style.display = 'flex';
    });

    document.getElementById('cancelModalBtn').addEventListener('click', () => {
        document.getElementById('createStudentModal').style.display = 'none';
    });

    document.getElementById('createStudentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createUser();
    });

    // Edit user modal
    document.getElementById('cancelEditModalBtn').addEventListener('click', () => {
        document.getElementById('editUserModal').style.display = 'none';
    });

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUserEdits();
    });

    // Grading modal
    document.getElementById('cancelGradeModalBtn').addEventListener('click', () => {
        document.getElementById('gradeModal').style.display = 'none';
    });

    document.getElementById('gradeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitGrade();
    });

    // Notification modal
    document.getElementById('sendNotificationBtn').addEventListener('click', () => {
        document.getElementById('notificationModal').style.display = 'flex';
    });

    document.getElementById('cancelNotificationModalBtn').addEventListener('click', () => {
        document.getElementById('notificationModal').style.display = 'none';
    });

    document.getElementById('notificationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendNotification();
    });

    // Deadline modal
    document.getElementById('cancelDeadlineModalBtn').addEventListener('click', () => {
        document.getElementById('deadlineModal').style.display = 'none';
    });

    document.getElementById('removeDeadlineBtn').addEventListener('click', async () => {
        await removeDeadline();
    });

    document.getElementById('deadlineForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveDeadline();
    });

    // Export grades
    document.getElementById('exportGradesBtn').addEventListener('click', async () => {
        const unitId = document.getElementById('gradeUnitFilter').value;
        await gradingManager.exportGradesToCSV({ unitId });
    });

    // Grade filter
    document.getElementById('gradeUnitFilter').addEventListener('change', () => {
        loadPendingSubmissions();
    });

    // Update file size
    document.getElementById('updateFileSizeBtn').addEventListener('click', async () => {
        await updateFileSize();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await window.authManager.signOut();
        window.location.href = 'index.html';
    });
}

// =================================
// LOAD STATISTICS
// =================================
async function loadStats() {
    try {
        // Total students
        const { count: studentCount } = await supabase
            .from('usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');

        document.getElementById('totalStudents').textContent = studentCount || 0;

        // Total submissions
        const { count: submissionCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true });

        document.getElementById('totalSubmissions').textContent = submissionCount || 0;

        // Total files
        const { count: fileCount } = await supabase
            .from('files')
            .select('*', { count: 'exact', head: true });

        document.getElementById('totalFiles').textContent = fileCount || 0;

        // Average progress (simplified)
        document.getElementById('avgProgress').textContent = '0%';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// =================================
// USER MANAGEMENT
// =================================
async function loadStudents() {
    try {
        const result = await usersManager.loadUsers();

        if (!result.success) {
            showError('Error al cargar usuarios:', result.error);
            return;
        }

        const table = document.getElementById('studentsTable');

        if (!result.data || result.data.length === 0) {
            table.innerHTML = '<p>No hay usuarios registrados.</p>';
            return;
        }

        const roleLabels = {
            'student': 'Estudiante',
            'evaluator': 'Evaluador',
            'assistant': 'Asistente',
            'administrator': 'Administrador'
        };

        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.data.map(user => `
                        <tr>
                            <td>${user.full_name}</td>
                            <td>${user.email}</td>
                            <td>${roleLabels[user.role] || user.role}</td>
                            <td>${user.active ? '<span style="color: var(--color-success)">✅ Activo</span>' : '<span style="color: var(--color-error)">❌ Inactivo</span>'}</td>
                            <td>${new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                            <td>
                                <div style="display: flex; gap: var(--spacing-xs);">
                                    <button class="btn btn-sm btn-secondary" onclick="editUser('${user.id}')">✏️</button>
                                    <button class="btn btn-sm ${user.active ? 'btn-warning' : 'btn-success'}" 
                                        onclick="toggleUserStatus('${user.id}', ${user.active})">
                                        ${user.active ? '🔒' : '🔓'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading students:', error);
        showError('Error al cargar la lista de usuarios');
    }
}

async function createUser() {
    const email = document.getElementById('studentEmail').value.trim();
    const name = document.getElementById('studentName').value.trim();
    const role = document.getElementById('studentRole').value;
    const password = document.getElementById('studentPassword').value;

    if (!email || !name || !password || !role) {
        alert('Por favor, completa todos los campos');
        return;
    }

    try {
        const result = await window.authManager.createUser(email, password, name, role);

        if (result.success) {
            alert('✓ Usuario creado exitosamente');
            document.getElementById('createStudentModal').style.display = 'none';
            document.getElementById('createStudentForm').reset();
            await loadStudents();
            await loadStats();
        } else {
            alert('✗ Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('✗ Error al crear usuario');
    }
}

async function editUser(userId) {
    const result = await usersManager.getUserById(userId);

    if (!result.success) {
        showError('Error al cargar usuario');
        return;
    }

    const user = result.data;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserName').value = user.full_name;
    document.getElementById('editUserRole').value = user.role;

    document.getElementById('editUserModal').style.display = 'flex';
}

async function saveUserEdits() {
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.trim();
    const role = document.getElementById('editUserRole').value;

    if (!name || !role) {
        alert('Por favor, completa todos los campos');
        return;
    }

    const result = await usersManager.updateUser(userId, {
        full_name: name,
        role: role
    });

    if (result.success) {
        alert('✓ Usuario actualizado exitosamente');
        document.getElementById('editUserModal').style.display = 'none';
        await loadStudents();
    } else {
        alert('✗ Error: ' + result.error);
    }
}

async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'desactivar' : 'activar';

    if (!confirm(`¿Estás seguro de ${action} este usuario?`)) {
        return;
    }

    const result = currentStatus
        ? await usersManager.deactivateUser(userId)
        : await usersManager.activateUser(userId);

    if (result.success) {
        alert(`✓ Usuario ${action === 'desactivar' ? 'desactivado' : 'activado'} exitosamente`);
        await loadStudents();
        await loadStats();
    } else {
        alert('✗ Error: ' + result.error);
    }
}

// Make functions globally accessible
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;

// =================================
// ASSIGNMENT MANAGEMENT
// =================================
async function loadAssignments() {
    try {
        const result = await assignmentsManager.loadAssignmentsWithDeadlines();

        if (!result.success) {
            showError('Error al cargar asignaciones');
            return;
        }

        const table = document.getElementById('assignmentsTable');

        const statusColors = {
            'no-deadline': 'var(--color-text-secondary)',
            'active': 'var(--color-success)',
            'upcoming': 'var(--color-warning)',
            'overdue': 'var(--color-error)'
        };

        const statusLabels = {
            'no-deadline': '⚪ Sin fecha',
            'active': '✅ Activa',
            'upcoming': '⚠️ Próxima',
            'overdue': '❌ Vencida'
        };

        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Unidad</th>
                        <th>Semana</th>
                        <th>Título</th>
                        <th>Fecha Límite</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.data.map(assignment => `
                        <tr>
                            <td>Unidad ${assignment.units.unit_number}</td>
                            <td>Semana ${assignment.week_number}</td>
                            <td>${assignment.title}</td>
                            <td>${assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                            <td><span style="color: ${statusColors[assignment.status]}">${statusLabels[assignment.status]}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="editDeadline('${assignment.id}', '${assignment.title}', '${assignment.deadline || ''}')">
                                    📅 ${assignment.deadline ? 'Editar' : 'Establecer'}
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading assignments:', error);
        showError('Error al cargar asignaciones');
    }
}

async function editDeadline(assignmentId, title, currentDeadline) {
    document.getElementById('deadlineAssignmentId').value = assignmentId;
    document.getElementById('deadlineAssignmentInfo').textContent = title;

    if (currentDeadline) {
        // Convert UTC to local datetime-local format
        const date = new Date(currentDeadline);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        document.getElementById('deadlineValue').value = localDate.toISOString().slice(0, 16);
    } else {
        document.getElementById('deadlineValue').value = '';
    }

    document.getElementById('deadlineModal').style.display = 'flex';
}

async function saveDeadline() {
    const assignmentId = document.getElementById('deadlineAssignmentId').value;
    const deadline = document.getElementById('deadlineValue').value;

    if (!deadline) {
        alert('Por favor, selecciona una fecha');
        return;
    }

    const result = await assignmentsManager.updateDeadline(assignmentId, new Date(deadline).toISOString());

    if (result.success) {
        alert('✓ Fecha límite actualizada');
        document.getElementById('deadlineModal').style.display = 'none';
        await loadAssignments();
    } else {
        alert('✗ Error: ' + result.error);
    }
}

async function removeDeadline() {
    const assignmentId = document.getElementById('deadlineAssignmentId').value;

    if (!confirm('¿Estás seguro de quitar la fecha límite?')) {
        return;
    }

    const result = await assignmentsManager.clearDeadline(assignmentId);

    if (result.success) {
        alert('✓ Fecha límite eliminada');
        document.getElementById('deadlineModal').style.display = 'none';
        await loadAssignments();
    } else {
        alert('✗ Error: ' + result.error);
    }
}

// Make functions globally accessible
window.editDeadline = editDeadline;

// =================================
// GRADING MANAGEMENT
// =================================
async function loadGradingStats() {
    const stats = await gradingManager.getGradingStats();

    if (stats.success) {
        document.getElementById('totalGraded').textContent = stats.data.totalGraded;
        document.getElementById('pendingGrades').textContent = stats.data.pending;
        document.getElementById('averageGrade').textContent = stats.data.averageGrade.toFixed(2);
    }
}

async function loadPendingSubmissions() {
    const unitId = document.getElementById('gradeUnitFilter').value;
    const filters = unitId ? { unitId } : {};

    const result = await gradingManager.loadPendingSubmissions(filters);

    const table = document.getElementById('pendingSubmissionsTable');

    if (!result.success || !result.data || result.data.length === 0) {
        table.innerHTML = '<p>No hay entregas pendientes de calificar.</p>';
        return;
    }

    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Estudiante</th>
                    <th>Unidad</th>
                    <th>Tarea</th>
                    <th>Fecha Entrega</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
                ${result.data.map(sub => `
                    <tr>
                        <td>${sub.usuarios?.full_name || 'N/A'}</td>
                        <td>Unidad ${sub.assignments?.units?.unit_number || 'N/A'}</td>
                        <td>${sub.assignments?.title || 'N/A'}</td>
                        <td>${new Date(sub.submitted_at).toLocaleDateString('es-ES')}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="openGradeModal('${sub.id}', '${sub.usuarios?.full_name}', '${sub.assignments?.title}')">
                                📝 Calificar
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function openGradeModal(submissionId, studentName, assignmentTitle) {
    document.getElementById('gradeSubmissionId').value = submissionId;
    document.getElementById('gradeSubmissionInfo').innerHTML = `
        <strong>Estudiante:</strong> ${studentName}<br>
        <strong>Tarea:</strong> ${assignmentTitle}
    `;
    document.getElementById('gradeValue').value = '';
    document.getElementById('gradeFeedback').value = '';

    document.getElementById('gradeModal').style.display = 'flex';
}

async function submitGrade() {
    const submissionId = document.getElementById('gradeSubmissionId').value;
    const grade = document.getElementById('gradeValue').value;
    const feedback = document.getElementById('gradeFeedback').value;

    if (!grade) {
        alert('Por favor, ingresa una calificación');
        return;
    }

    const result = await gradingManager.gradeSubmission(
        submissionId,
        grade,
        feedback,
        currentUser.id
    );

    if (result.success) {
        alert('✓ Calificación guardada exitosamente');
        document.getElementById('gradeModal').style.display = 'none';
        await loadPendingSubmissions();
        await loadGradingStats();
    } else {
        alert('✗ Error: ' + result.error);
    }
}

// Make function globally accessible
window.openGradeModal = openGradeModal;

// =================================
// NOTIFICATIONS MANAGEMENT
// =================================
async function loadNotifications() {
    const result = await notificationsManager.getNotificationHistory({ limit: 20 });

    const table = document.getElementById('notificationHistoryTable');

    if (!result.success || !result.data || result.data.length === 0) {
        table.innerHTML = '<p>No hay notificaciones enviadas.</p>';
        return;
    }

    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Destinatarios</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${result.data.map(notif => `
                    <tr>
                        <td>${notif.title}</td>
                        <td>${notif.recipients.join(', ')}</td>
                        <td><span class="badge badge-${notif.type}">${notif.type}</span></td>
                        <td>${new Date(notif.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function sendNotification() {
    const title = document.getElementById('notificationTitle').value.trim();
    const message = document.getElementById('notificationMessage').value.trim();
    const recipients = document.getElementById('notificationRecipients').value;
    const type = document.getElementById('notificationType').value;

    if (!title || !message) {
        alert('Por favor, completa todos los campos');
        return;
    }

    const result = await notificationsManager.sendNotification(
        title,
        message,
        [recipients],
        type,
        currentUser.id
    );

    if (result.success) {
        alert('✓ Notificación enviada exitosamente');
        document.getElementById('notificationModal').style.display = 'none';
        document.getElementById('notificationForm').reset();
        await loadNotifications();
    } else {
        alert('✗ Error: ' + result.error);
    }
}

// =================================
// SETTINGS
// =================================
async function loadSettings() {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*');

        if (error) throw error;

        data.forEach(setting => {
            if (setting.key === 'max_file_size_mb') {
                document.getElementById('maxFileSizeInput').value = setting.value;
            } else if (setting.key === 'allow_late_submissions') {
                document.getElementById('allowLateSubmissions').checked = setting.value === 'true';
            }
        });
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updateFileSize() {
    const newSize = document.getElementById('maxFileSizeInput').value;

    try {
        const { error } = await supabase
            .from('settings')
            .update({ value: newSize })
            .eq('key', 'max_file_size_mb');

        if (error) throw error;

        alert('✓ Tamaño máximo actualizado');
    } catch (error) {
        console.error('Error updating file size:', error);
        alert('✗ Error al actualizar');
    }
}

// =================================
// UTILITIES
// =================================
function showError(message, details = '') {
    console.error(message, details);
    alert(`${message}${details ? ': ' + details : ''}`);
}
