// ===================================
// FILE VIEWER WITH PRINT SUPPORT
// ===================================

class FileViewer {
    constructor() {
        this.currentFile = null;
        this.createModal();
    }

    createModal() {
        const modalHTML = `
            <div class="file-viewer-modal" id="fileViewerModal">
                <div class="file-viewer-container">
                    <div class="file-viewer-header">
                        <div class="file-viewer-title">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" stroke-width="2"/>
                                <path d="M13 2V9H20" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            <span id="fileViewerName">Archivo</span>
                        </div>
                        <div class="file-viewer-actions">
                            <button class="btn btn-sm btn-ghost" onclick="window.fileViewer.printFile()" title="Imprimir">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9V2H18V9M6 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V11C2 10.4696 2.21071 9.96086 2.58579 9.58579C2.96086 9.21071 3.46957 9 4 9H20C20.5304 9 21.0391 9.21071 21.4142 9.58579C21.7893 9.96086 22 10.4696 22 11V16C22 16.5304 21.7893 17.0391 21.4142 17.4142C21.0391 17.7893 20.5304 18 20 18H18M6 14H18V22H6V14Z" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                Imprimir
                            </button>
                            <button class="btn btn-sm btn-ghost" onclick="window.fileViewer.downloadFile()" title="Descargar">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M7 10L12 15M12 15L17 10M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <button class="btn btn-sm btn-ghost" onclick="window.fileViewer.close()" title="Cerrar">
                                ✕
                            </button>
                        </div>
                    </div>
                    <div class="file-viewer-content" id="fileViewerContent">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Close on background click
        document.getElementById('fileViewerModal').addEventListener('click', (e) => {
            if (e.target.id === 'fileViewerModal') {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentFile) {
                this.close();
            }
        });
    }

    open(file) {
        this.currentFile = file;
        const modal = document.getElementById('fileViewerModal');
        const nameEl = document.getElementById('fileViewerName');
        const contentEl = document.getElementById('fileViewerContent');

        nameEl.textContent = file.name;

        // Determine file type and render accordingly
        const fileType = this.getFileType(file);

        switch (fileType) {
            case 'pdf':
                contentEl.innerHTML = `<iframe class="file-viewer-iframe" src="${file.url}"></iframe>`;
                break;

            case 'image':
                contentEl.innerHTML = `<img class="file-viewer-image" src="${file.url}" alt="${file.name}">`;
                break;

            case 'office':
                // Use Microsoft Office Online Viewer
                contentEl.innerHTML = `<iframe class="file-viewer-iframe" src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}"></iframe>`;
                break;

            default:
                contentEl.innerHTML = `
                    <div class="file-viewer-unsupported">
                        <svg viewBox="0 0 24 24" fill="none">
                            <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M13 2V9H20" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <h3>Vista previa no disponible</h3>
                        <p>Este tipo de archivo no se puede visualizar en el navegador.</p>
                        <p>Por favor, descarga el archivo para verlo.</p>
                        <button class="btn btn-primary" onclick="window.fileViewer.downloadFile()" style="margin-top: var(--spacing-lg);">
                            Descargar ${file.name}
                        </button>
                    </div>
                `;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        const modal = document.getElementById('fileViewerModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentFile = null;
    }

    getFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        if (file.type === 'application/pdf' || extension === 'pdf') {
            return 'pdf';
        }

        if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return 'image';
        }

        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
            return 'office';
        }

        return 'unsupported';
    }

    printFile() {
        if (!this.currentFile) return;

        const fileType = this.getFileType(this.currentFile);

        if (fileType === 'pdf' || fileType === 'image') {
            window.print();
        } else if (fileType === 'office') {
            // For office files, open in new tab for printing
            window.open(this.currentFile.url, '_blank');
        } else {
            window.ERY.utils.showNotification('No se puede imprimir este tipo de archivo', 'error');
        }
    }

    downloadFile() {
        if (!this.currentFile) return;

        const link = document.createElement('a');
        link.href = this.currentFile.url;
        link.download = this.currentFile.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize file viewer
document.addEventListener('DOMContentLoaded', () => {
    window.fileViewer = new FileViewer();

    // Export to ERY namespace
    window.ERY = window.ERY || {};
    window.ERY.fileViewer = window.fileViewer;
});
