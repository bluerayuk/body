// bodybuilding-core.js - Core Manager with Custom Exercise Support

class BodybuildingManager {
    constructor() {
        this.currentExercises = [];
        this.editingRoutineName = null;
        this.routineBuilder = null;
        this.routineManager = null;
        this.workoutLogger = null;
        this.customExerciseManager = null;
        this._initialized = false;
        this._eventListenersAttached = false;
    }
    
    /**
     * Initialize bodybuilding module
     */
    async init() {
        console.log('🏋️ Initializing bodybuilding module...');
        
        if (this._initialized) {
            console.warn('⚠️ Bodybuilding already initialized, skipping...');
            return;
        }
        
        try {
            // Initialize sub-modules
            this.routineBuilder = new RoutineBuilder(this);
            this.routineManager = new RoutineManager(this);
            this.workoutLogger = new WorkoutLogger(this);
            this.customExerciseManager = new CustomExerciseManager(this);
            
            await this.setupUI();
            this.setupEventListeners();
            this.setupCustomExerciseButtons();
            
            // Subscribe to profile changes
            if (window.appState) {
                window.appState.subscribe('currentProfile', () => {
                    this.refresh();
                });
            }
            
            // Load saved routines on startup
            await this.refresh();
            
            this._initialized = true;
            console.log('✅ Bodybuilding module initialized');
        } catch (error) {
            console.error('❌ Failed to initialize bodybuilding:', error);
        }
    }
    
    /**
     * Setup UI elements
     */
    async setupUI() {
        const groupSelect = document.getElementById('muscleGroupSelect');
        if (!groupSelect) {
            throw new Error('Muscle group select not found');
        }
        
        // Load muscle groups
        const groups = await API.getMuscleGroups();
        
        groupSelect.innerHTML = '<option value="">Select muscle group...</option>';
        groups.forEach(group => {
            const opt = document.createElement('option');
            opt.value = group;
            opt.textContent = group;
            groupSelect.appendChild(opt);
        });
        
        // Load first group's exercises
        if (groups.length > 0) {
            groupSelect.value = groups[0];
            await this.routineBuilder.loadExercises(groups[0]);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this._eventListenersAttached) {
            console.log('⚠️ Event listeners already attached, skipping...');
            return;
        }
        
        console.log('🔧 Setting up event listeners...');
        
        // Muscle group change
        const groupSelect = document.getElementById('muscleGroupSelect');
        if (groupSelect) {
            groupSelect.addEventListener('change', async (e) => {
                await this.routineBuilder.loadExercises(e.target.value);
            });
        }
        
        // Add exercise button
        const addBtn = document.getElementById('addExerciseBtn');
        if (addBtn) {
            addBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🔘 Add Exercise clicked - Current exercises:', this.currentExercises.length);
                await this.routineBuilder.addExercise();
                console.log('🔘 After add - Current exercises:', this.currentExercises.length);
            }, { once: false });
        }
        
        // Save routine button
        const saveBtn = document.getElementById('saveRoutineBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.routineBuilder.saveRoutine();
            });
        }
        
        // Clear routine button
        const clearBtn = document.getElementById('clearRoutineBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.routineBuilder.clearRoutine();
            });
        }
        
        // Start workout button
        const startBtn = document.getElementById('startWorkoutBtn');
        if (startBtn) {
            startBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.workoutLogger.startWorkout();
            });
        }
        
        this._eventListenersAttached = true;
        console.log('✅ Event listeners setup complete');
    }
    
    /**
     * Setup custom exercise buttons
     */
    setupCustomExerciseButtons() {
        console.log('🔧 Setting up custom exercise buttons...');
        
        const addCustomBtn = document.getElementById('addCustomExerciseBtn');
        if (addCustomBtn) {
            addCustomBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('➕ Add Custom Exercise clicked');
                await this.customExerciseManager.showAddCustomExerciseModal();
            });
            console.log('✅ Add Custom Exercise button listener attached');
        } else {
            console.warn('⚠️ Add Custom Exercise button not found');
        }
        
        const manageCustomBtn = document.getElementById('manageCustomExercisesBtn');
        if (manageCustomBtn) {
            manageCustomBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗂️ Manage Custom Exercises clicked');
                await this.customExerciseManager.showManageCustomExercisesModal();
            });
            console.log('✅ Manage Custom Exercises button listener attached');
        } else {
            console.warn('⚠️ Manage Custom Exercises button not found');
        }
        
        console.log('✅ Custom exercise buttons setup complete');
    }
    
    /**
     * Refresh all bodybuilding displays
     */
    async refresh() {
        console.log('🔄 Refreshing bodybuilding displays...');
        
        const profileName = window.appState?.get('currentProfile');
        console.log('📋 Current profile:', profileName);
        
        if (!profileName) {
            console.log('⚠️ No profile selected, clearing displays');
            this.clearDisplays();
            return;
        }
        
        try {
            console.log('📡 Fetching routines from API...');
            const routines = await API.getRoutines(profileName);
            console.log('📦 Received routines:', routines);
            console.log('📊 Number of routines:', Object.keys(routines).length);
            
            // Update saved routines list
            this.routineManager.renderRoutinesList(routines);
            
            // Update workout routine selector
            this.routineManager.renderRoutineSelector(routines);
            
            console.log('✅ Bodybuilding displays refreshed');
        } catch (error) {
            console.error('❌ Error refreshing bodybuilding:', error);
        }
    }
    
    /**
     * Clear all displays
     */
    clearDisplays() {
        this.routineManager.clearDisplays();
        this.workoutLogger.cancelWorkout();
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        this.currentExercises = [];
        this.editingRoutineName = null;
        console.log('✅ Bodybuilding module cleaned up');
    }
}

// Create global instance
window.bodybuilding = new BodybuildingManager();

// Register with init manager
if (window.initManager) {
    window.initManager.register('bodybuilding', async () => {
        await window.bodybuilding.init();
        
        // Return cleanup function
        return () => window.bodybuilding.cleanup();
    }, ['app']); // Depends on app being initialized first
}