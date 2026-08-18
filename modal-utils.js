// modal-utils.js - Reusable Modal System - COMPACT VERSION

class Modal {
    constructor(options = {}) {
        this.options = {
            title: options.title || 'Modal',
            content: options.content || '',
            buttons: options.buttons || [],
            width: options.width || '400px',
            maxWidth: options.maxWidth || '90%',
            closeOnEscape: options.closeOnEscape !== false,
            closeOnBackdrop: options.closeOnBackdrop !== false,
            onClose: options.onClose || null,
            className: options.className || ''
        };
        
        this.isDark = document.documentElement.classList.contains('dark-mode');
        this.overlay = null;
        this.escHandler = null;
        
        this.create();
    }
    
    create() {
        const bgColor = this.isDark ? '#1e293b' : 'white';
        const textColor = this.isDark ? '#f1f5f9' : '#1e293b';
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = `modal-overlay ${this.options.className}`;
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            overflow-y: auto;
            animation: fadeIn 0.2s ease;
        `;
        
        // Create modal container - COMPACT PADDING
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.style.cssText = `
            background: ${bgColor};
            color: ${textColor};
            padding: 20px;
            border-radius: 12px;
            max-width: ${this.options.width};
            width: ${this.options.maxWidth};
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            max-height: 90vh;
            overflow-y: auto;
        `;
        
        // Header - COMPACT
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        `;
        
        const title = document.createElement('h2');
        title.textContent = this.options.title;
        title.style.cssText = 'margin: 0; font-size: 20px;';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.className = 'modal-close-btn';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: ${textColor};
            padding: 0;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s ease;
        `;
        closeBtn.addEventListener('click', () => this.close());
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(0, 0, 0, 0.1)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'none';
        });
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Content
        const content = document.createElement('div');
        content.className = 'modal-content';
        if (typeof this.options.content === 'string') {
            content.innerHTML = this.options.content;
        } else if (this.options.content instanceof HTMLElement) {
            content.appendChild(this.options.content);
        }
        
        // Buttons - COMPACT MARGIN
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'modal-buttons';
        buttonsContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-top: 15px;
        `;
        
        this.options.buttons.forEach(btnConfig => {
            const btn = document.createElement('button');
            btn.textContent = btnConfig.text || 'Button';
            btn.className = `btn ${btnConfig.className || 'btn-primary'}`;
            btn.style.flex = '1';
            btn.dataset.action = btnConfig.action || 'custom';
            
            if (btnConfig.onClick) {
                btn.addEventListener('click', async () => {
                    try {
                        const result = await btnConfig.onClick(this);
                        if (result !== false) {
                            this.close();
                        }
                    } catch (error) {
                        console.error('Button click error:', error);
                        alert('An error occurred: ' + error.message);
                    }
                });
            } else {
                btn.addEventListener('click', () => this.close());
            }
            
            buttonsContainer.appendChild(btn);
        });
        
        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(content);
        if (this.options.buttons.length > 0) {
            modal.appendChild(buttonsContainer);
        }
        
        this.overlay.appendChild(modal);
        
        // Add CSS animations
        this.addStyles();
        
        // Event listeners
        this.setupEventListeners(modal);
        
        // Add to DOM
        document.body.appendChild(this.overlay);
        
        // Focus first input if exists
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    addStyles() {
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners(modal) {
        // ESC key
        if (this.options.closeOnEscape) {
            this.escHandler = (e) => {
                if (e.key === 'Escape') this.close();
            };
            document.addEventListener('keydown', this.escHandler);
        }
        
        // Backdrop click
        if (this.options.closeOnBackdrop) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });
        }
        
        // Prevent modal content clicks from closing
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    close() {
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
        }
        
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                if (this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                if (this.options.onClose) {
                    this.options.onClose();
                }
            }, 200);
        }
    }
    
    /**
     * Get modal content element
     */
    getContent() {
        return this.overlay?.querySelector('.modal-content');
    }
    
    /**
     * Update modal content
     */
    setContent(content) {
        const contentEl = this.getContent();
        if (contentEl) {
            if (typeof content === 'string') {
                contentEl.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                contentEl.innerHTML = '';
                contentEl.appendChild(content);
            }
        }
    }
    
    /**
     * Get value from input by ID
     */
    getValue(inputId) {
        const input = this.overlay?.querySelector(`#${inputId}`);
        return input ? input.value : null;
    }
    
    /**
     * Set value of input by ID
     */
    setValue(inputId, value) {
        const input = this.overlay?.querySelector(`#${inputId}`);
        if (input) input.value = value;
    }
}

// Utility functions for common modals

window.Modal = {
    /**
     * Show confirmation dialog - COMPACT VERSION
     */
    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            new Modal({
                title,
                content: `<p style="margin: 0; line-height: 1.4; font-size: 14px;">${message}</p>`,
                width: options.width || '400px',
                buttons: [
                    {
                        text: 'Confirm',
                        className: 'btn-primary',
                        onClick: () => {
                            resolve(true);
                            return true;
                        }
                    },
                    {
                        text: 'Cancel',
                        className: 'btn-danger',
                        onClick: () => {
                            resolve(false);
                            return true;
                        }
                    }
                ]
            });
        });
    },
    
    /**
     * Show alert dialog - COMPACT VERSION
     */
    alert(title, message, options = {}) {
        return new Promise((resolve) => {
            new Modal({
                title,
                content: `<p style="margin: 0; line-height: 1.4; font-size: 14px;">${message}</p>`,
                width: options.width || '400px',
                buttons: [
                    {
                        text: 'OK',
                        className: 'btn-primary',
                        onClick: () => {
                            resolve();
                            return true;
                        }
                    }
                ]
            });
        });
    },
    
    /**
     * Show input prompt
     */
    prompt(title, message, defaultValue = '', options = {}) {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: `
                    <p style="margin-bottom: 15px; line-height: 1.4; font-size: 14px;">${message}</p>
                    <input type="text" id="promptInput" value="${defaultValue}" 
                           style="width: 100%; padding: 12px; border: 2px solid var(--border); 
                                  border-radius: 8px; font-size: 15px; font-family: inherit;">
                `,
                width: options.width || '400px',
                buttons: [
                    {
                        text: 'OK',
                        className: 'btn-primary',
                        onClick: (m) => {
                            const value = m.getValue('promptInput');
                            resolve(value);
                            return true;
                        }
                    },
                    {
                        text: 'Cancel',
                        className: 'btn-danger',
                        onClick: () => {
                            resolve(null);
                            return true;
                        }
                    }
                ]
            });
            
            // Handle Enter key
            setTimeout(() => {
                const input = modal.getContent()?.querySelector('#promptInput');
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            resolve(input.value);
                            modal.close();
                        }
                    });
                }
            }, 100);
        });
    },
    
    /**
     * Create custom modal
     */
    create(options) {
        return new Modal(options);
    }
};