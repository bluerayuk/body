// init-manager.js - Unified Initialization System
// Prevents race conditions and duplicate initializations

class InitManager {
    constructor() {
        this.modules = new Map();
        this.isReady = false;
        this.readyCallbacks = [];
        
        // Setup ready detection
        this.setupReadyDetection();
    }
    
    setupReadyDetection() {
        const checkReady = () => {
            if (typeof pywebview !== 'undefined' && !this.isReady) {
                this.isReady = true;
                this.executeReadyCallbacks();
            }
        };
        
        // Try immediate
        checkReady();
        
        // Listen for pywebviewready event
        window.addEventListener('pywebviewready', () => {
            this.isReady = true;
            this.executeReadyCallbacks();
        }, { once: true });
        
        // Fallback polling
        if (!this.isReady) {
            const pollInterval = setInterval(() => {
                checkReady();
                if (this.isReady) {
                    clearInterval(pollInterval);
                }
            }, 100);
            
            // Stop polling after 5 seconds
            setTimeout(() => clearInterval(pollInterval), 5000);
        }
    }
    
    executeReadyCallbacks() {
        console.log(`✅ PyWebView ready - executing ${this.readyCallbacks.length} callbacks`);
        this.readyCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Initialization callback error:', error);
            }
        });
        this.readyCallbacks = [];
    }
    
    /**
     * Register a module for initialization
     * @param {string} name - Unique module name
     * @param {Function} initFn - Initialization function
     * @param {Array} dependencies - Optional array of module names that must initialize first
     */
    register(name, initFn, dependencies = []) {
        if (this.modules.has(name)) {
            console.warn(`Module ${name} already registered`);
            return;
        }
        
        const module = {
            name,
            initFn,
            dependencies,
            initialized: false,
            cleanupFn: null
        };
        
        this.modules.set(name, module);
        
        if (this.isReady) {
            this.initializeModule(name);
        } else {
            this.readyCallbacks.push(() => this.initializeModule(name));
        }
    }
    
    async initializeModule(name) {
        const module = this.modules.get(name);
        if (!module || module.initialized) return;
        
        // Check dependencies
        for (const dep of module.dependencies) {
            const depModule = this.modules.get(dep);
            if (!depModule || !depModule.initialized) {
                console.warn(`Module ${name} waiting for dependency ${dep}`);
                // Wait for dependency
                await this.waitForModule(dep);
            }
        }
        
        try {
            console.log(`🔧 Initializing module: ${name}`);
            const cleanup = await module.initFn();
            module.initialized = true;
            module.cleanupFn = cleanup;
            console.log(`✅ Module initialized: ${name}`);
        } catch (error) {
            console.error(`❌ Failed to initialize module ${name}:`, error);
        }
    }
    
    waitForModule(name, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const module = this.modules.get(name);
            if (module && module.initialized) {
                resolve();
                return;
            }
            
            const checkInterval = setInterval(() => {
                const m = this.modules.get(name);
                if (m && m.initialized) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error(`Module ${name} initialization timeout`));
            }, timeout);
        });
    }
    
    /**
     * Clean up a specific module
     */
    cleanup(name) {
        const module = this.modules.get(name);
        if (module && module.cleanupFn) {
            try {
                module.cleanupFn();
                module.initialized = false;
            } catch (error) {
                console.error(`Error cleaning up module ${name}:`, error);
            }
        }
    }
    
    /**
     * Clean up all modules
     */
    cleanupAll() {
        this.modules.forEach((module, name) => {
            this.cleanup(name);
        });
    }
    
    /**
     * Check if module is initialized
     */
    isInitialized(name) {
        const module = this.modules.get(name);
        return module ? module.initialized : false;
    }
}

// Create global instance
window.initManager = new InitManager();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.initManager.cleanupAll();
});