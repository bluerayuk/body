// bodybuilding-workout-logger-data.js - Data Collection Module
// Handles collecting form data and preparing workout data for API

class WorkoutDataCollector {
    constructor() {
        // No state needed
    }
    
    /**
     * Collect workout data from UI inputs
     */
    collectWorkoutData(exercises) {
        const workoutData = [];
        
        console.log(`📊 Processing ${exercises.length} exercises...`);
        
        // Iterate through each exercise
        exercises.forEach((ex, exIndex) => {
            console.log(`  Exercise ${exIndex + 1}: ${ex.exercise} (${ex.sets} sets)`);
            
            // Get exercise-level rest time (applies to all sets of this exercise)
            const exerciseRestInput = document.getElementById(`exercise-rest-${exIndex}`);
            const exerciseRest = this.parseRestTime(exerciseRestInput?.value);
            
            // Check each set for this exercise
            for (let setIndex = 0; setIndex < ex.sets; setIndex++) {
                const globalSetId = `${exIndex}_${setIndex}`;
                const weightInput = document.getElementById(`weight_${globalSetId}`);
                const repsInput = document.getElementById(`reps_${globalSetId}`);
                const checkbox = document.getElementById(`check_${globalSetId}`);
                
                console.log(`    Set ${setIndex + 1}: checkbox=${checkbox?.checked}, weight=${weightInput?.value}, reps=${repsInput?.value}, rest=${exerciseRest}s`);
                
                if (checkbox?.checked) {
                    const weight = parseFloat(weightInput?.value || '0');
                    const reps = parseInt(repsInput?.value || '0');
                    
                    if (weight > 0 && reps > 0) {
                        const setData = {
                            exercise: ex.exercise,
                            set: setIndex + 1,
                            weight: weight,
                            reps: reps
                        };
                        
                        // Add rest time if provided (from exercise-level input)
                        if (exerciseRest > 0) {
                            setData.rest = exerciseRest;
                        }
                        
                        workoutData.push(setData);
                        console.log(`    ✅ Added: ${ex.exercise} - ${weight}kg x ${reps} reps${exerciseRest > 0 ? ` (rest: ${exerciseRest}s)` : ''}`);
                    } else {
                        console.log(`    ⚠️ Skipped (invalid data): weight=${weight}, reps=${reps}`);
                    }
                } else {
                    console.log(`    ⭕ Skipped (not checked)`);
                }
            }
        });
        
        console.log(`📦 Total sets logged: ${workoutData.length}`);
        
        return workoutData;
    }
    
    /**
     * Parse rest time from input (supports seconds or MM:SS format)
     */
    parseRestTime(value) {
        if (!value) return 0;
        
        const str = String(value).trim();
        
        // Check for MM:SS format
        if (str.includes(':')) {
            const parts = str.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0]) || 0;
                const seconds = parseInt(parts[1]) || 0;
                return (minutes * 60) + seconds;
            }
        }
        
        // Otherwise treat as seconds
        return parseInt(str) || 0;
    }
    
    /**
     * Validate workout data before submission
     */
    validateWorkoutData(workoutData) {
        if (!workoutData || workoutData.length === 0) {
            return {
                valid: false,
                error: 'No completed sets to log'
            };
        }
        
        // Check each set has valid data
        for (const set of workoutData) {
            if (!set.exercise || set.exercise.trim() === '') {
                return {
                    valid: false,
                    error: 'Invalid exercise name'
                };
            }
            
            if (!set.weight || set.weight <= 0) {
                return {
                    valid: false,
                    error: `Invalid weight for ${set.exercise}`
                };
            }
            
            if (!set.reps || set.reps <= 0) {
                return {
                    valid: false,
                    error: `Invalid reps for ${set.exercise}`
                };
            }
        }
        
        return {
            valid: true,
            error: null
        };
    }
    
    /**
     * Get workout summary statistics
     */
    getWorkoutSummary(workoutData) {
        if (!workoutData || workoutData.length === 0) {
            return {
                totalSets: 0,
                totalReps: 0,
                totalVolume: 0,
                exercises: []
            };
        }
        
        const totalSets = workoutData.length;
        const totalReps = workoutData.reduce((sum, set) => sum + set.reps, 0);
        const totalVolume = workoutData.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        
        // Get unique exercises
        const exercises = [...new Set(workoutData.map(set => set.exercise))];
        
        return {
            totalSets,
            totalReps,
            totalVolume: totalVolume.toFixed(1),
            exercises
        };
    }
}

// Export
window.WorkoutDataCollector = WorkoutDataCollector;
window.workoutDataCollector = new WorkoutDataCollector();

console.log('[JS] ✅ Workout Data Collector Module Loaded with Rest Time Support');