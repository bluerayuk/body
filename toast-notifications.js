// toast-notifications.js - Beautiful Bottom-Centered Toast System

class ToastNotification {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
                max-width: 90%;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
        
        // Add CSS animations
        this.addStyles();
    }
    
    addStyles() {
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideInUp {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutDown {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
                
                .toast {
                    pointer-events: auto;
                    animation: slideInUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                .toast.removing {
                    animation: slideOutDown 0.3s ease;
                }
                
                .toast-icon {
                    animation: pulse 0.6s ease;
                }
                
                @media (max-width: 768px) {
                    #toast-container {
                        bottom: 20px;
                        max-width: 95%;
                    }
                    
                    .toast {
                        min-width: auto;
                        max-width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    show(message, type = 'success', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        // Color schemes with gradients
        const colors = {
            success: {
                bg: 'linear-gradient(135deg, #10b981, #059669)',
                icon: '✓',
                shadow: '0 8px 32px rgba(16, 185, 129, 0.4)'
            },
            error: {
                bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
                icon: '✕',
                shadow: '0 8px 32px rgba(239, 68, 68, 0.4)'
            },
            info: {
                bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                icon: 'ℹ',
                shadow: '0 8px 32px rgba(59, 130, 246, 0.4)'
            },
            warning: {
                bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
                icon: '⚠',
                shadow: '0 8px 32px rgba(245, 158, 11, 0.4)'
            }
        };
        
        const config = colors[type] || colors.success;
        
        toast.style.cssText = `
            background: ${config.bg};
            color: white;
            padding: 18px 28px;
            border-radius: 16px;
            box-shadow: ${config.shadow};
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            min-width: 320px;
            max-width: 500px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        const isDark = document.documentElement.classList.contains('dark-mode');
        
        toast.innerHTML = `
            <div class="toast-icon" style="
                font-size: 24px; 
                font-weight: 700;
                line-height: 1;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.25);
                border-radius: 50%;
                flex-shrink: 0;
            ">${config.icon}</div>
            <div style="flex: 1; text-align: center; letter-spacing: 0.3px;">${message}</div>
            <div style="
                font-size: 20px; 
                opacity: 0.8; 
                line-height: 1;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                flex-shrink: 0;
            " class="toast-close">×</div>
        `;
        
        // Enhanced hover effect
        toast.addEventListener('mouseenter', () => {
            toast.style.transform = 'translateY(-4px) scale(1.02)';
            toast.style.boxShadow = `${config.shadow.replace('8px', '12px').replace('0.4', '0.6')}`;
            
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
                closeBtn.style.opacity = '1';
            }
        });
        
        toast.addEventListener('mouseleave', () => {
            toast.style.transform = 'translateY(0) scale(1)';
            toast.style.boxShadow = config.shadow;
            
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.style.background = 'transparent';
                closeBtn.style.opacity = '0.8';
            }
        });
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            this.remove(toast);
        });
        
        this.container.appendChild(toast);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }
        
        return toast;
    }
    
    remove(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    success(message, duration = 3500) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }
    
    info(message, duration = 3500) {
        return this.show(message, 'info', duration);
    }
    
    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }
}

// Create global instance
window.Toast = new ToastNotification();