// ===================================
// FILE UPLOAD SYSTEM - FIREBASE
// Reemplaza a Supabase Storage
// Guarda en: Cloud Storage (files) + Firestore (entregas)
// ===================================

class FileUploadManager {
    constructor() {
        this.firebaseDb = null;
        this.firebaseStorage = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.uploadedFiles = [];
        this.storageBucket = 'tareas'; // Nombre de la carpeta en Storage
        this.init();
    }

    init() {
        const tryInit = async () => {
            if (window.firebase?.db && window.firebase?.storage) {
                this.firebaseDb = window.firebase.db;
                this.firebaseStorage = window.firebase.storage;
                console.log('✅ FileUpload: Firebase listo');
                
                await this.loadFilesFromFirebase();
                this.setupEventListeners();
                this.renderUploadedFiles();
            } else {
                setTimeout(tryInit, 300);
            }
        };
        tryInit();
    }

    isLoggedIn() {
        return !!(window.ERY?.auth?.currentUser);
    }

    async loadFilesFromFirebase() {
        try {
            const snapshot = await this.firebaseDb
                .collection('entregas')
                .orderBy('created_at', 'desc')
                .get();
            
            this.uploadedFiles = snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().nombre_archivo,
                url: doc.data().url_archivo,
                unit: doc.data().unidad,
                lesson: doc.data().semana,
                upload_date: doc.data().created_at,
                type: this.guessType(doc.data().nombre_archivo)
            }));
            this.saveToStorage();
        } catch (error) {
            console.error('Error cargando entregas:', error);
            this.uploadedFiles = this.loadFromStorage();
        }
    }

    guessType(filename) {
        if (!filename) return '';
        const ext = filename.split('.').pop().toLowerCase();
        if (ext === 'pdf') return 'application/pdf';
        if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image/' + ext;
        if (['doc','docx'].includes(ext)) return 'application/msword';
        if (['xls','xlsx'].includes(ext)) return 'application/vnd.ms-excel';
        if (['ppt','pptx'].includes(ext)) return 'application/vnd.ms-powerpoint';
        if (['zip','rar'].includes(ext)) return 'application/zip';
        return 'application/octet-stream';
    }

    async handleFiles(files, unit, lesson) {
        if (!this.firebaseDb || !this.firebaseStorage) {
            this.notify('❌ Firebase no está listo, recarga la página', 'error');
            return;
        }

        for (let file of files) {
            if (!this.validateFile(file)) continue;
            
            this.setLoading(unit, lesson, true);
            try {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filePath = `${this.storageBucket}/${unit}/${lesson}/${Date.now()}_${safeName}`;

                // Subir a Firebase Storage
                const storageRef = this.firebaseStorage.ref(filePath);
                const snapshot = await storageRef.put(file);
                
                // Obtener URL pública
                const fileUrl = await snapshot.ref.getDownloadURL();
                console.log(`✅ Archivo subido a Storage: ${filePath}`);

                // Guardar referencia en Firestore
                await this.firebaseDb.collection('entregas').add({
                    unidad: unit,
                    semana: lesson,
                    nombre_archivo: file.name,
                    url_archivo: fileUrl,
                    storage_path: filePath,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                await this.loadFilesFromFirebase();
                this.renderUploadedFiles();
                this.notify(`✅ ${file.name} subido correctamente!`, 'success');
            } catch (error) {
                console.error('Error detallado:', error);
                this.notify(`❌ ${error.message}`, 'error');
            } finally {
                this.setLoading(unit, lesson, false);
            }
        }
    }

    renderUploadedFiles() {
        document.querySelectorAll('.file-list').forEach(container => {
            const { unit, lesson } = container.dataset;
            const files = this.uploadedFiles.filter(f => f.unit === unit && f.lesson === lesson);
            
            if (files.length === 0) {
                container.innerHTML = '<div style="font-size:0.8rem;color:#888;margin-top:10px;">Sin entregas aún.</div>';
                return;
            }
            
            container.innerHTML = files.map(file => `
                <div class="file-item animate-fade-in" style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:8px;margin-top:8px;border:1px solid rgba(255,255,255,0.1);">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span>${this.getFileIcon(file.type)}</span>
                        <div style="display:flex;flex-direction:column;">
                            <a href="${file.url}" target="_blank" download style="font-size:0.9rem;color:var(--color-primary);text-decoration:none;font-weight:500;">${file.name}</a>
                            <small style="font-size:0.7rem;color:#666;">${new Date(file.upload_date).toLocaleDateString()}</small>
                        </div>
                    </div>
                    <button onclick="window.fileUploadManager.deleteFile('${file.id}')" title="Eliminar" style="background:none;border:none;color:#ff4d4d;cursor:pointer;padding:5px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `).join('');
        });
        document.querySelectorAll('.file-upload-area').forEach(area => area.style.display = '');
    }

    async deleteFile(id) {
        if (!confirm('¿Deseas eliminar esta entrega?')) return;
        
        try {
            // Encontrar el archivo para obtener la ruta en Storage
            const file = this.uploadedFiles.find(f => f.id === id);
            if (file?.storage_path) {
                const storageRef = this.firebaseStorage.ref(file.storage_path);
                await storageRef.delete();
            }

            // Eliminar documento de Firestore
            await this.firebaseDb.collection('entregas').doc(id).delete();
            
            this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== id);
            this.saveToStorage();
            this.renderUploadedFiles();
            this.notify('🗑️ Archivo eliminado', 'info');
        } catch (error) {
            this.notify('❌ Error al eliminar: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.file-upload-area').forEach(area => {
            const input = area.querySelector('input[type="file"]');
            if (!input) return;

            area.addEventListener('click', (e) => { 
                if (e.target !== input) input.click(); 
            });

            input.addEventListener('change', (e) => {
                const { unit, lesson } = input.dataset;
                if (unit && lesson) this.handleFiles(e.target.files, unit, lesson);
            });

            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.style.borderColor = 'var(--color-primary)';
            });

            area.addEventListener('dragleave', () => { 
                area.style.borderColor = ''; 
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.style.borderColor = '';
                const { unit, lesson } = input.dataset;
                if (unit && lesson) this.handleFiles(e.dataTransfer.files, unit, lesson);
            });
        });

        document.addEventListener('authStateChanged', () => this.renderUploadedFiles());
    }

    getFileIcon(type) {
        if (!type) return '📄';
        if (type.includes('pdf')) return '📕';
        if (type.includes('image')) return '🖼️';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('zip') || type.includes('rar')) return '🗜️';
        return '📄';
    }

    setLoading(unit, lesson, isLoading) {
        const input = document.querySelector(`.file-upload-input[data-unit="${unit}"][data-lesson="${lesson}"]`);
        const area = input?.closest('.file-upload-area');
        
        if (area) {
            area.style.opacity = isLoading ? '0.5' : '1';
            area.style.pointerEvents = isLoading ? 'none' : 'auto';
            const text = area.querySelector('.file-upload-text');
            if (text) text.innerText = isLoading ? '⏳ Subiendo a la nube...' : 'Arrastra archivos aquí o haz clic para seleccionar';
        }
    }

    validateFile(file) {
        if (file.size > this.maxFileSize) {
            this.notify(`❌ "${file.name}" supera los 10MB permitidos.`, 'error');
            return false;
        }
        return true;
    }

    notify(msg, type) {
        if (window.ERY?.utils?.showNotification) {
            window.ERY.utils.showNotification(msg, type);
        } else {
            const div = document.createElement('div');
            div.textContent = msg;
            div.style.cssText = `position:fixed;bottom:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:0.9rem;color:white;font-weight:500;max-width:350px;background:${type==='success'?'#22c55e':type==='error'?'#ef4444':'#3b82f6'};box-shadow:0 4px 12px rgba(0,0,0,0.3);`;
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 5000);
        }
    }

    loadFromStorage() { 
        return JSON.parse(localStorage.getItem('ery_files') || '[]'); 
    }

    saveToStorage() { 
        localStorage.setItem('ery_files', JSON.stringify(this.uploadedFiles)); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.fileUploadManager = new FileUploadManager();
});
