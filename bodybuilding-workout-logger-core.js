// bodybuilding-workout-logger-core.js - Core Workout Logger with Celebration
// Handles workout session state and coordination
// UPDATED: Integrated workout completion celebration

class WorkoutLogger {
    constructor(manager) {
        this.manager = manager;
        this.workoutStartTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.currentRoutine = null;
        this.currentRoutineData = null;
    }
    
    /**
     * Start a workout from a saved routine
     */
    async startWorkout() {
        const profileName = window.appState?.get('currentProfile');
        
        if (!profileName) {
            if (window.Toast) {
                window.Toast.warning('Please select a profile first');
            }
            return;
        }
        
        const routineSelect = document.getElementById('logRoutineSelect');
        const routineName = routineSelect?.value;
        
        if (!routineName) {
            if (window.Toast) {
                window.Toast.warning('Please select a routine');
            }
            return;
        }
        
        try {
            const routines = await API.getRoutines(profileName);
            const routine = routines[routineName];
            
            console.log('ðŸ‹ï¸ Starting workout:', routineName);
            console.log('ðŸ“‹ Routine data:', routine);
            console.log('ðŸ“‹ Exercise count:', routine?.exercises?.length);
            
            if (!routine || !routine.exercises || routine.exercises.length === 0) {
                if (window.Toast) {
                    window.Toast.error('Routine not found or has no exercises');
                }
                return;
            }
            
            // Store current workout data
            this.currentRoutine = routineName;
            this.currentRoutineData = routine;
            
            // Render workout interface
            window.workoutUI.renderWorkoutLog(routineName, routine);
            
            if (window.Toast) {
                window.Toast.success(`Started workout: ${routineName} 🏋️ - Click ▶️ to start timer`);
            }
        } catch (error) {
            console.error('Error starting workout:', error);
            if (window.Toast) {
                window.Toast.error('Failed to start workout: ' + error.message);
            }
        }
    }
    
    /**
     * Start the workout timer
     */
    startTimer() {
        if (this.timerInterval) return;
        
        if (!this.workoutStartTime) {
            this.workoutStartTime = Date.now();
            this.elapsedSeconds = 0;
        } else {
            this.workoutStartTime = Date.now() - (this.elapsedSeconds * 1000);
        }
        
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.workoutStartTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
        
        console.log('â±ï¸ Timer started');
    }
    
    /**
     * Pause the workout timer
     */
    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        console.log('â¸ï¸ Timer paused');
    }
    
    /**
     * Stop the workout timer (reset)
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.workoutStartTime = null;
        this.elapsedSeconds = 0;
    }
    
    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const timerElement = document.getElementById('workoutTimer');
        if (!timerElement) return;
        
        const hours = Math.floor(this.elapsedSeconds / 3600);
        const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
        const seconds = this.elapsedSeconds % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = timeString;
    }
    
    /**
     * Format duration in seconds to readable string
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    /**
     * Finish and save workout - WITH CELEBRATION! ðŸŽ‰
     */
    async finishWorkout(routineName, exercises) {
        console.log('ðŸ finishWorkout called');
        console.log('   Routine:', routineName);
        
        const profileName = window.appState?.get('currentProfile');
        if (!profileName) {
            console.error('âŒ No profile selected');
            if (window.Toast) {
                window.Toast.warning('Please select a profile first');
            }
            return;
        }
        
        // Calculate workout duration
        const durationSeconds = this.elapsedSeconds;
        const durationFormatted = this.formatDuration(durationSeconds);
        
        console.log(`â±ï¸ Duration: ${durationSeconds}s (${durationFormatted})`);
        
        // Parse exercises if needed
        if (typeof exercises === 'string') {
            try {
                exercises = JSON.parse(exercises);
            } catch (e) {
                console.error('âŒ Failed to parse exercises:', e);
                if (window.Toast) {
                    window.Toast.error('Failed to parse workout data');
                }
                return;
            }
        }
        
        // Collect workout data from UI
        const workoutData = window.workoutDataCollector.collectWorkoutData(exercises);
        
        if (workoutData.length === 0) {
            console.warn('âš ï¸ No sets to log');
            if (window.Toast) {
                window.Toast.warning('Please complete and mark at least one set');
            }
            return;
        }
        
        try {
            console.log('📤 Sending workout to API...');
            const result = await API.logWorkout(profileName, routineName, workoutData, durationSeconds);
            
            if (result.success) {
                console.log('âœ… Workout logged successfully!');
                
                this.stopTimer();
                
                // ðŸŽ‰ CELEBRATION INTEGRATION - Replace toast with celebration modal
                if (window.WorkoutCelebration) {
                    // Calculate stats for celebration
                    const stats = {
                        sets: workoutData.length,
                        exercises: [...new Set(workoutData.map(s => s.exercise))].length,
                        duration: durationFormatted,
                        volume: workoutData.reduce((sum, set) => sum + (set.weight * set.reps), 0).toFixed(1)
                    };
                    
                    // Show celebration modal
                    window.WorkoutCelebration.celebrate(routineName, stats);
                    console.log('ðŸŽ‰ Celebration triggered!');
                } else {
                    // Fallback to toast if celebration not available
                    if (window.Toast) {
                        window.Toast.success(`âœ… Workout logged! ${workoutData.length} sets in ${durationFormatted} ðŸŽ‰`);
                    }
                }
                
                // Refresh workout history
                await window.workoutHistory.renderWorkoutHistory(profileName);
                
                this.cancelWorkout();
            } else {
                console.error('âŒ Workout logging failed:', result.error);
                if (window.Toast) {
                    window.Toast.error(result.error || 'Failed to log workout');
                }
            }
        } catch (error) {
            console.error('âŒ Exception logging workout:', error);
            if (window.Toast) {
                window.Toast.error('Failed to log workout: ' + error.message);
            }
        }
    }
    
    /**
     * Cancel current workout
     */
    cancelWorkout() {
        this.stopTimer();
        
        // Remove blinking styles
        window.setTracker.removeBlinkingStyles();
        
        // Hide the active workout container
        const activeWorkoutContainer = document.getElementById('activeWorkoutContainer');
        if (activeWorkoutContainer) {
            activeWorkoutContainer.style.display = 'none';
        }
        
        const workoutTable = document.getElementById('workoutLogTable');
        if (workoutTable) {
            workoutTable.innerHTML = '';
        }
        
        // Clear current workout data
        this.currentRoutine = null;
        this.currentRoutineData = null;
        
        if (window.Toast) {
            window.Toast.info('Workout cancelled');
        }
    }
}

// Export
window.WorkoutLogger = WorkoutLogger;

console.log('[JS] âœ… Workout Logger Core Loaded with Celebration Integration');