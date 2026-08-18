// api-client.js - COMPLETE VERSION with Weight and Waist Tracking

class APIClient {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 5000; // 5 seconds
        this.pendingRequests = new Map();
    }
    
    /**
     * Check if pywebview API is available
     */
    isAvailable() {
        return typeof pywebview !== 'undefined' && pywebview.api;
    }
    
    /**
     * Generic API call wrapper with error handling
     */
    async call(method, ...args) {
        if (!this.isAvailable()) {
            throw new Error('PyWebView API not available');
        }
        
        try {
            const result = await pywebview.api[method](...args);
            return result;
        } catch (error) {
            console.error(`API call failed [${method}]:`, error);
            throw error;
        }
    }
    
    /**
     * Get cached data or fetch if expired
     */
    async getCached(key, fetcher, force = false) {
        if (!force) {
            const cached = this.cache.get(key);
            if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
                console.log(`ðŸ“¦ Cache hit: ${key}`);
                return cached.data;
            }
        }
        
        if (this.pendingRequests.has(key)) {
            console.log(`â³ Waiting for pending request: ${key}`);
            return await this.pendingRequests.get(key);
        }
        
        const promise = (async () => {
            try {
                console.log(`ðŸ”„ Fetching: ${key}`);
                const data = await fetcher();
                
                this.cache.set(key, {
                    data,
                    timestamp: Date.now()
                });
                
                return data;
            } finally {
                this.pendingRequests.delete(key);
            }
        })();
        
        this.pendingRequests.set(key, promise);
        return await promise;
    }
    
    /**
     * Invalidate cache for specific key or pattern
     */
    invalidateCache(pattern) {
        if (!pattern) {
            this.cache.clear();
            console.log('ðŸ—‘ï¸ Cache cleared');
            return;
        }
        
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`ðŸ—‘ï¸ Invalidated ${keysToDelete.length} cache entries`);
    }
    
    // ========== PROFILE METHODS ==========
    
    async getProfiles() {
        return await this.getCached('profiles', async () => {
            return await this.call('get_profiles');
        });
    }
    
    async getProfile(name) {
        return await this.getCached(`profile:${name}`, async () => {
            return await this.call('get_profile', name);
        });
    }
    
    async createProfile(name, data = {}) {
        const result = await this.call('create_profile', name, data);
        this.invalidateCache('profile');
        return result;
    }
    
    async updateProfile(name, data) {
        const result = await this.call('update_profile', name, data);
        this.invalidateCache(`profile:${name}`);
        return result;
    }
    
    async deleteProfile(name) {
        const result = await this.call('delete_profile', name);
        this.invalidateCache('profile');
        return result;
    }
    
    // ========== CALCULATOR METHODS ==========
    
    async calculateTDEE(params) {
        return await this.call('calculate_tdee', params);
    }
    
    // ========== WEIGHT TRACKER METHODS ==========
    
    async getWeightLog(profileName, force = false) {
        return await this.getCached(`weight_log:${profileName}`, async () => {
            return await this.call('get_weight_log', profileName);
        }, force);
    }
    
    async addWeightEntry(profileName, weight, unit = 'metric') {
        const result = await this.call('add_weight_entry', profileName, weight, unit);
        
        if (result.success) {
            this.invalidateCache(`weight_log:${profileName}`);
            this.invalidateCache(`weight_stats:${profileName}`);
        }
        
        return result;
    }
    
    async deleteWeightEntry(profileName, index) {
        const result = await this.call('delete_weight_entry', profileName, index);
        
        if (result.success) {
            this.invalidateCache(`weight_log:${profileName}`);
            this.invalidateCache(`weight_stats:${profileName}`);
        }
        
        return result;
    }
    
    async getWeightStats(profileName) {
        return await this.getCached(`weight_stats:${profileName}`, async () => {
            return await this.call('get_weight_stats', profileName);
        });
    }
    
    // ========== WAIST TRACKER METHODS ==========
    
    async getWaistLog(profileName, force = false) {
        return await this.getCached(`waist_log:${profileName}`, async () => {
            return await this.call('get_waist_log', profileName);
        }, force);
    }
    
    async addWaistEntry(profileName, waist, unit = 'metric') {
        const result = await this.call('add_waist_entry', profileName, waist, unit);
        
        if (result.success) {
            this.invalidateCache(`waist_log:${profileName}`);
            this.invalidateCache(`waist_stats:${profileName}`);
        }
        
        return result;
    }
    
    async deleteWaistEntry(profileName, index) {
        const result = await this.call('delete_waist_entry', profileName, index);
        
        if (result.success) {
            this.invalidateCache(`waist_log:${profileName}`);
            this.invalidateCache(`waist_stats:${profileName}`);
        }
        
        return result;
    }
    
    async getWaistStats(profileName) {
        return await this.getCached(`waist_stats:${profileName}`, async () => {
            return await this.call('get_waist_stats', profileName);
        });
    }
    
    // ========== BODYBUILDING METHODS ==========
    
    async getMuscleGroups() {
        return await this.getCached('muscle_groups', async () => {
            return await this.call('get_muscle_groups');
        });
    }
    
    async getExercises(muscleGroup) {
        const profileName = window.appState?.get('currentProfile');
        
        return await this.getCached(`exercises:${muscleGroup}:${profileName}`, async () => {
            return await this.call('get_exercises', muscleGroup, profileName);
        });
    }
    
    async getRoutines(profileName) {
        return await this.getCached(`routines:${profileName}`, async () => {
            return await this.call('get_routines', profileName);
        });
    }
    
    async saveRoutine(profileName, routineName, exercises) {
        const result = await this.call('save_routine', profileName, routineName, exercises);
        
        if (result.success) {
            this.invalidateCache(`routines:${profileName}`);
        }
        
        return result;
    }
    
    async deleteRoutine(profileName, routineName) {
        const result = await this.call('delete_routine', profileName, routineName);
        
        if (result.success) {
            this.invalidateCache(`routines:${profileName}`);
        }
        
        return result;
    }
    
    async logWorkout(profileName, routineName, workoutData, durationSeconds = null) {
        const result = await this.call('log_workout', profileName, routineName, workoutData, durationSeconds);
        
        if (result.success) {
            this.invalidateCache(`workout_history:${profileName}`);
        }
        
        return result;
    }
    
    async getWorkoutHistory(profileName) {
        return await this.getCached(`workout_history:${profileName}`, async () => {
            return await this.call('get_workout_history', profileName);
        });
    }
    
    async deleteWorkout(profileName, workoutIndex) {
        const result = await this.call('delete_workout', profileName, workoutIndex);
        
        if (result.success) {
            this.invalidateCache(`workout_history:${profileName}`);
        }
        
        return result;
    }
    
    // ========== CUSTOM EXERCISE METHODS ==========
    
    async addCustomExercise(profileName, muscleGroup, exerciseName) {
        const result = await this.call('add_custom_exercise', profileName, muscleGroup, exerciseName);
        
        if (result.success) {
            this.invalidateCache(`exercises:${muscleGroup}`);
            this.invalidateCache(`custom_exercises:${profileName}`);
        }
        
        return result;
    }
    
    async getCustomExercises(profileName, muscleGroup) {
        return await this.getCached(`custom_exercises:${profileName}:${muscleGroup}`, async () => {
            return await this.call('get_custom_exercises', profileName, muscleGroup);
        });
    }
    
    async deleteCustomExercise(profileName, muscleGroup, exerciseName) {
        const result = await this.call('delete_custom_exercise', profileName, muscleGroup, exerciseName);
        
        if (result.success) {
            this.invalidateCache(`exercises:${muscleGroup}`);
            this.invalidateCache(`custom_exercises:${profileName}`);
        }
        
        return result;
    }
}

// Create global instance
window.API = new APIClient();