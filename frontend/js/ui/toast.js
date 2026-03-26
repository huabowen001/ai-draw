import CONFIG from '../config.js';
import { escapeHtml } from '../utils/helpers.js';

class Toast {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = CONFIG.toastDuration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = this.getStyles(type);
        toast.innerHTML = escapeHtml(message);
        
        this.container.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getStyles(type) {
        const colors = {
            success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
            error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
            warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
            info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' }
        };
        
        const color = colors[type] || colors.info;
        
        return `
            padding: 12px 16px;
            background: ${color.bg};
            border: 1px solid ${color.border};
            border-radius: 8px;
            color: ${color.text};
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
        `;
    }

    success(message) { this.show(message, 'success'); }
    error(message) { this.show(message, 'error', 5000); }
    warning(message) { this.show(message, 'warning'); }
    info(message) { this.show(message, 'info'); }
}

export default new Toast();
