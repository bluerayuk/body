// state-manager.js - Centralized State Management
// Single source of truth for all app state

class StateManager {
    constructor() {
        this.state = {
            currentProfile: null,
            unit: 'metric',
            userType: 'general',
            selectedGoal: 'maintenance',
            ethnicity: 'prefer_not_to_say',
            
            calculator: {
                activity: '1.55',
                gender: 'male',
                age: null,
                weight: null,
                height: null,
                waist: null
            },
            
            ui: {
                currentTab: 'calculator',
                theme: 'light'
            }
        };
        
        this.listeners = new Map();
        this.debounceTimers = new Map();
    }
    
    /**
     * Get state value by path
     * @param {string} path - Dot-separated path (e.g., 'calculator.age')
     * @returns {*} Value at path or null
     */
    get(path) {
        const keys = path.split('.');
        let value = this.state;
        
        for (const key of keys) {
            if (value === null || value === undefined) return null;
            value = value[key];
        }
        
        return value;
    }
    
    /**
     * Set state value by path
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     * @param {boolean} silent - If true, don't notify listeners
     */
    set(path, value, silent = false) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.state;
        
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }
        
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        if (!silent && oldValue !== value) {
            this.notify(path, value, oldValue);
        }
    }
    
    /**
     * Update multiple values at once
     * @param {Object} updates - Object with paths as keys
     */
    batch(updates) {
        const changes = [];
        
        Object.entries(updates).forEach(([path, value]) => {
            const oldValue = this.get(path);
            this.set(path, value, true); // Silent
            if (oldValue !== value) {
                changes.push({ path, value, oldValue });
            }
        });
        
        // Notify all changes at once
        changes.forEach(({ path, value, oldValue }) => {
            this.notify(path, value, oldValue);
        });
    }
    
    /**
     * Subscribe to state changes
     * @param {string} path - Path to watch (can use wildcards like 'calculator.*')
     * @param {Function} callback - Called when value changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        
        this.listeners.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(path);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }
    
    /**
     * Notify listeners of state change
     */
    notify(path, newValue, oldValue) {
        // Exact path listeners
        const exactListeners = this.listeners.get(path);
        if (exactListeners) {
            exactListeners.forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error(`Listener error for ${path}:`, error);
                }
            });
        }
        
        // Wildcard listeners (e.g., 'calculator.*' matches 'calculator.age')
        this.listeners.forEach((listeners, listenerPath) => {
            if (listenerPath.includes('*')) {
                const regex = new RegExp('^' + listenerPath.replace(/\*/g, '.*') + '$');
                if (regex.test(path)) {
                    listeners.forEach(callback => {
                        try {
                            callback(newValue, oldValue, path);
                        } catch (error) {
                            console.error(`Wildcard listener error for ${listenerPath}:`, error);
                        }
                    });
                }
            }
        });
    }
    
    /**
     * Persist state to profile
     * @param {number} debounceMs - Debounce time in milliseconds
     */
    async persist(debounceMs = 500) {
        // Clear existing timer
        if (this.debounceTimers.has('persist')) {
            clearTimeout(this.debounceTimers.get('persist'));
        }
        
        // Set new timer
        const timer = setTimeout(async () => {
            const profileName = this.get('currentProfile');
            if (!profileName) return;
            
            try {
                const profile = await API.getProfile(profileName);
                if (!profile) return;
                
                // Update profile with current state
                profile.unitPreference = this.get('unit');
                profile.userType = this.get('userType');
                profile.selectedGoal = this.get('selectedGoal');
                profile.ethnicity = this.get('ethnicity');
                profile.age = this.get('calculator.age');
                profile.gender = this.get('calculator.gender');
                profile.activityLevel = this.get('calculator.activity');
                profile.height = this.get('calculator.height');
                profile.waist = this.get('calculator.waist');
                
                await API.updateProfile(profileName, profile);
                console.log('✅ State persisted to profile');
            } catch (error) {
                console.error('❌ Failed to persist state:', error);
            }
        }, debounceMs);
        
        this.debounceTimers.set('persist', timer);
    }
    
    /**
     * Load state from profile
     */
    async loadFromProfile(profileName) {
        try {
            const profile = await API.getProfile(profileName);
            if (!profile) return false;
            
            // Load all values silently first
            this.batch({
                'currentProfile': profileName,
                'unit': profile.unitPreference || 'metric',
                'userType': profile.userType || 'general',
                'selectedGoal': profile.selectedGoal || 'maintenance',
                'ethnicity': profile.ethnicity || 'prefer_not_to_say',
                'calculator.age': profile.age || null,
                'calculator.gender': profile.gender || 'male',
                'calculator.activity': profile.activityLevel || '1.55',
                'calculator.height': profile.height || null,
                'calculator.waist': profile.waist || null
            });
            
            console.log('✅ State loaded from profile:', profileName);
            return true;
        } catch (error) {
            console.error('❌ Failed to load state from profile:', error);
            return false;
        }
    }
    
    /**
     * Reset state to defaults
     */
    reset() {
        this.batch({
            'currentProfile': null,
            'unit': 'metric',
            'userType': 'general',
            'selectedGoal': 'maintenance',
            'ethnicity': 'prefer_not_to_say',
            'calculator.activity': '1.55',
            'calculator.gender': 'male',
            'calculator.age': null,
            'calculator.weight': null,
            'calculator.height': null,
            'calculator.waist': null
        });
    }
    
    /**
     * Get entire state (for debugging)
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
}

// Create global instance
window.appState = new StateManager();

// Auto-persist on state changes
window.appState.subscribe('calculator.*', () => {
    window.appState.persist();
});

window.appState.subscribe('selectedGoal', () => {
    window.appState.persist();
});

window.appState.subscribe('ethnicity', () => {
    window.appState.persist();
});