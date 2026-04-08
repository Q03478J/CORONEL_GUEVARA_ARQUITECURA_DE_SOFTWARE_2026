// ===================================
// FILE UPLOAD SYSTEM WITH SUPABASE
// ===================================

class FileUploadManager {
    constructor(supabaseUrl = null, supabaseKey = null) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.supabaseClient = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/zip'
        ];
        this.uploadedFiles = [];
        this.init();
    }

    // Initialize Supabase client if credentials provided
    initSupabase() {
        if (this.supabaseUrl && this.supabaseKey && window.supabase) {
            try {
                this.supabaseClient = window.supabase.createClient(
                    this.supabaseUrl,
                    this.supabaseKey
                );
                console.log('✓ Supabase connected for file uploads');
                return true;
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                return false;
            }
        }
        console.log('ℹ Using localStorage for file metadata (Supabase not configured)');
        return false;
    }

    // Initialize file upload areas
    async init() {
        this.initSupabase();

        // Load files from Supabase database if connected
        if (this.supabaseClient) {
            await this.loadFilesFromSupabase();
        } else {
            this.uploadedFiles = this.loadFromStorage();
        }

        this.setupFileInputs();
        this.setupDragAndDrop();
        this.renderUploadedFiles();
    }

    // Load files from Supabase database
    async loadFilesFromSupabase() {
        try {
            console.log('📥 Loading files from Supabase database...');

            const { data, error } = await this.supabaseClient
                .from('files')
                .select('*')
                .order('upload_date', { ascending: false });

            if (error) {
                console.error('Error loading files from Supabase:', error);
                // Fall back to localStorage
                this.uploadedFiles = this.loadFromStorage();
                return;
            }

            if (data && data.length > 0) {
                // Convert database format to internal format
                this.uploadedFiles = data.map(file => ({
                    id: file.id,
                    name: file.name,
                    originalName: this.getOriginalFileName(file.name), // Extract clean name
                    size: file.size,
                    type: file.type,
                    unit: file.unit,
                    lesson: file.lesson,
                    uploadDate: file.upload_date,
                    url: file.url
                }));

                // Also save to localStorage as cache
                this.saveToStorage();

                console.log(`✓ Loaded ${data.length} files from Supabase database`);
            } else {
                console.log('ℹ No files found in database, using localStorage');
                this.uploadedFiles = this.loadFromStorage();
            }
        } catch (error) {
            console.error('Error loading files from Supabase:', error);
            // Fall back to localStorage if database fails
            this.uploadedFiles = this.loadFromStorage();
        }
    }

    // Setup file input listeners
    setupFileInputs() {
        document.querySelectorAll('.file-upload-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFiles(e.target.files, e.target);
            });
        });

        // Trigger file input when clicking on upload area
        document.querySelectorAll('.file-upload-area').forEach(area => {
            area.addEventListener('click', () => {
                const input = area.parentElement.querySelector('.file-upload-input');
                if (input) input.click();
            });
        });
    }

    // Setup drag and drop
    setupDragAndDrop() {
        document.querySelectorAll('.file-upload-area').forEach(area => {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                area.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                area.addEventListener(eventName, () => {
                    area.classList.add('dragover');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                area.addEventListener(eventName, () => {
                    area.classList.remove('dragover');
                });
            });

            area.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                const input = area.parentElement.querySelector('.file-upload-input');
                this.handleFiles(files, input);
            });
        });
    }

    // Handle file selection
    async handleFiles(files, inputElement) {
        const unit = inputElement?.dataset.unit || 'general';
        const lesson = inputElement?.dataset.lesson || 'general';

        for (let file of files) {
            // Validate file
            if (!this.validateFile(file)) {
                continue;
            }

            // Show loading indication
            const fileId = this.generateFileId();
            this.showUploadProgress(fileId, file.name);

            try {
                // Upload to Supabase if connected, otherwise store metadata only
                let fileUrl = null;
                if (this.supabaseClient) {
                    fileUrl = await this.uploadToSupabase(file, unit, lesson);
                }

                // Store file metadata with original name preserved
                const fileData = {
                    id: fileId,
                    name: file.name,
                    originalName: file.name, // Store original filename
                    size: file.size,
                    type: file.type,
                    unit: unit,
                    lesson: lesson,
                    uploadDate: new Date().toISOString(),
                    url: fileUrl
                };

                this.uploadedFiles.push(fileData);
                this.saveToStorage();

                // Save to Supabase database
                if (this.supabaseClient && fileUrl) {
                    await this.saveFileToDatabase(fileData);
                }

                this.renderUploadedFiles();

                window.ERY.utils.showNotification(`✓ ${file.name} subido exitosamente`, 'success');
            } catch (error) {
                console.error('Upload error:', error);
                window.ERY.utils.showNotification(`✗ Error al subir ${file.name}`, 'error');
            }
        }
    }

    // Upload file to Supabase Storage
    async uploadToSupabase(file, unit, lesson) {
        if (!this.supabaseClient) {
            throw new Error('Supabase not configured');
        }

        const fileName = `${unit}/${lesson}/${Date.now()}_${file.name}`;

        const { data, error } = await this.supabaseClient
            .storage
            .from('course-uploads')
            .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = this.supabaseClient
            .storage
            .from('course-uploads')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    }

    // Save file metadata to Supabase database
    async saveFileToDatabase(fileData) {
        try {
            const { error } = await this.supabaseClient
                .from('files')
                .insert([{
                    id: fileData.id,
                    name: fileData.name,
                    size: fileData.size,
                    type: fileData.type,
                    unit: fileData.unit,
                    lesson: fileData.lesson,
                    upload_date: fileData.uploadDate,
                    url: fileData.url
                }]);

            if (error) throw error;
            console.log('✓ File metadata saved to database');
        } catch (error) {
            console.error('Error saving to database:', error);
        }
    }

    // Validate file
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            window.ERY.utils.showNotification(
                `El archivo ${file.name} excede el tamaño máximo de 10MB`,
                'error'
            );
            return false;
        }

        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            window.ERY.utils.showNotification(
                `Tipo de archivo no permitido: ${file.name}`,
                'error'
            );
            return false;
        }

        return true;
    }

    // Show upload progress (simplified version)
    showUploadProgress(fileId, fileName) {
        // This is a placeholder - in a real implementation,
        // you would show an actual progress indicator
        console.log(`Uploading ${fileName}...`);
    }

    // Generate unique file ID
    generateFileId() {
        return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Extract original filename from storage filename (removes timestamp prefix)
    getOriginalFileName(storageName) {
        if (!storageName) return '';
        // If the name has timestamp prefix (e.g., "123456789_file.pdf"), extract the original name
        const match = storageName.match(/^\d+_(.+)$/);
        return match ? match[1] : storageName;
    }

    // Load uploaded files from localStorage
    loadFromStorage() {
        const stored = localStorage.getItem('ery_uploaded_files');
        return stored ? JSON.parse(stored) : [];
    }

    // Save uploaded files to localStorage
    saveToStorage() {
        localStorage.setItem('ery_uploaded_files', JSON.stringify(this.uploadedFiles));
    }

    // Get files for specific unit/lesson
    getFiles(unit = null, lesson = null) {
        return this.uploadedFiles.filter(file => {
            if (unit && file.unit !== unit) return false;
            if (lesson && file.lesson !== lesson) return false;
            return true;
        });
    }

    // Delete file from database
    async deleteFileFromDatabase(fileId) {
        try {
            const { error } = await this.supabaseClient
                .from('files')
                .delete()
                .eq('id', fileId);

            if (error) throw error;
            console.log('✓ File metadata deleted from database');
        } catch (error) {
            console.error('Error deleting from database:', error);
        }
    }

    // Delete file
    async deleteFile(fileId) {
        const file = this.uploadedFiles.find(f => f.id === fileId);
        if (!file) return;

        if (!confirm(`¿Eliminar ${file.name}?`)) return;

        // Delete from Supabase Storage if URL exists
        if (file.url && this.supabaseClient) {
            try {
                const filePath = file.url.split('/course-uploads/')[1];
                await this.supabaseClient
                    .storage
                    .from('course-uploads')
                    .remove([filePath]);
            } catch (error) {
                console.error('Error deleting from Supabase Storage:', error);
            }
        }

        // Delete from database
        if (this.supabaseClient) {
            await this.deleteFileFromDatabase(fileId);
        }

        // Remove from local storage
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        this.saveToStorage();
        this.renderUploadedFiles();

        window.ERY.utils.showNotification('Archivo eliminado', 'info');
    }

    // Render uploaded files list
    renderUploadedFiles() {
        document.querySelectorAll('.file-list').forEach(container => {
            const unit = container.dataset.unit;
            const lesson = container.dataset.lesson;
            const files = this.getFiles(unit, lesson);

            if (files.length === 0) {
                container.innerHTML = '<p class="text-muted">No hay archivos subidos</p>';
                return;
            }

            container.innerHTML = files.map(file => `
                <div class="file-item" data-file-id="${file.id}">
                    <svg class="file-item-icon" width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M13 2V9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <div class="file-item-info">
                        <div class="file-item-name">${file.originalName || this.getOriginalFileName(file.name)}</div>
                        <div class="file-item-size">${window.ERY.utils.formatFileSize(file.size)} • ${window.ERY.utils.formatDate(file.uploadDate)}</div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${file.url ? `
                            <button class="btn btn-sm btn-ghost" onclick='window.fileViewer.open(${JSON.stringify(file).replace(/'/g, "&#39;")})' title="Ver archivo">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                                    <circle cx="12" cy="12" r="3" stroke-width="2"/>
                                </svg>
                            </button>
                            <a href="${file.url}" target="_blank" class="btn btn-sm btn-ghost" title="Descargar">↓</a>
                        ` : ''}
                        <button class="file-item-remove" onclick="window.fileUploadManager.deleteFile('${file.id}')" title="Eliminar">✕</button>
                    </div>
                </div>
            `).join('');
        });
    }
}

// Initialize file upload manager
document.addEventListener('DOMContentLoaded', () => {
    // Get Supabase credentials from meta tags or config
    const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content;
    const supabaseKey = document.querySelector('meta[name="supabase-key"]')?.content;

    window.fileUploadManager = new FileUploadManager(supabaseUrl, supabaseKey);

    // Export to ERY namespace
    window.ERY = window.ERY || {};
    window.ERY.fileUploadManager = window.fileUploadManager;
});
