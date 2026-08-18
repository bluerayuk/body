// bodybuilding-workout-logger-ui.js - 3-FIELD REP SYSTEM WITH PROGRESSIVE OVERLOAD
console.log("[DEBUG UI] bodybuilding-workout-logger-ui.js loading...");
// Shows CLEAR rep targets based on min/max/current values
// FIXED: Added inline-rest-btn class and data-rest-seconds attribute for countdown sync
// FIXED: Replaced broken emoji with 💪

class WorkoutUI {
    constructor() {
        this.currentRoutine = null;
        this.currentExercises = null;
    }
    
    /**
     * Get last workout performance for progressive overload
     */
    async getLastWorkoutPerformance(exerciseName, profileName) {
        try {
            const history = await API.getWorkoutHistory(profileName);
            
            // Search from most recent to oldest
            for (let i = history.length - 1; i >= 0; i--) {
                const workout = history[i];
                
                // Find this exercise in the workout
                const exerciseSets = workout.exercises.filter(set => 
                    set.exercise === exerciseName
                );
                
                if (exerciseSets.length > 0) {
                    const weights = exerciseSets.map(s => s.weight);
                    const reps = exerciseSets.map(s => s.reps);
                    const mostCommonWeight = this.getMostCommonValue(weights);
                    const minReps = Math.min(...reps);
                    const maxReps = Math.max(...reps);
                    
                    // Check if ALL sets completed at the same rep count
                    const allSetsComplete = reps.every(r => r === reps[0]);
                    const completedReps = allSetsComplete ? reps[0] : null;
                    
                    return {
                        weight: mostCommonWeight,
                        minReps: minReps,
                        maxReps: maxReps,
                        completedReps: completedReps,
                        allSetsComplete: allSetsComplete,
                        sets: exerciseSets,
                        workoutDate: workout.date
                    };
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting last workout performance:', error);
            return null;
        }
    }
    
    getMostCommonValue(arr) {
        const frequency = {};
        arr.forEach(val => {
            frequency[val] = (frequency[val] || 0) + 1;
        });
        
        let maxCount = 0;
        let mostCommon = arr[0];
        
        for (const [val, count] of Object.entries(frequency)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommon = parseFloat(val);
            }
        }
        
        return mostCommon;
    }
    
    /**
     * Smart progressive overload with CLEAR guidance
     */
    calculateProgressiveSuggestion(lastPerformance, currentExercise) {
        const { min_reps, max_reps } = currentExercise;
        
        if (!lastPerformance) {
            return {
                suggestedWeight: null,
                suggestedReps: min_reps,
                reason: `Ã°Å¸â€ â€¢ First time - aim for ${min_reps} reps on all sets`,
                type: 'first_time'
            };
        }
        
        const { weight: lastWeight, completedReps, allSetsComplete } = lastPerformance;
        
        // Ã¢Å“â€¦ User completed ALL sets at the same rep count
        if (allSetsComplete && completedReps !== null) {
            
            // 🚀 Completed all sets at MAX reps Ã¢â€ â€™ INCREASE WEIGHT
            if (completedReps >= max_reps) {
                const newWeight = lastWeight + 1;
                return {
                    suggestedWeight: newWeight,
                    suggestedReps: min_reps,
                    reason: `🚀 All sets at ${completedReps} reps! Increase to ${newWeight}kg, aim for ${min_reps} reps`,
                    type: 'increase_weight',
                    lastWeight: lastWeight
                };
            }
            
            // 📈 Completed all sets within range Ã¢â€ â€™ ADD 1 REP
            if (completedReps >= min_reps && completedReps < max_reps) {
                const nextReps = completedReps + 1;
                return {
                    suggestedWeight: lastWeight,
                    suggestedReps: nextReps,
                    reason: `📈 All sets at ${completedReps} reps done! Today aim for ${nextReps} reps`,
                    type: 'increase_reps',
                    lastWeight: lastWeight
                };
            }
            
            // Ã¢Å¡Â Ã¯Â¸Â Completed all sets BELOW minReps
            if (completedReps < min_reps) {
                return {
                    suggestedWeight: lastWeight,
                    suggestedReps: min_reps,
                    reason: `💪 Keep pushing! Last: ${completedReps} reps. Today aim for ${min_reps} reps`,
                    type: 'maintain',
                    lastWeight: lastWeight
                };
            }
        }
        
        // Ã¢Å¡Â Ã¯Â¸Â Inconsistent performance
        return {
            suggestedWeight: lastWeight,
            suggestedReps: min_reps,
            reason: `🎯 Aim for ${min_reps} reps on all sets consistently`,
            type: 'maintain',
            lastWeight: lastWeight
        };
    }
    
    /**
     * Format rest time for display
     */
    formatRestTime(seconds) {
        if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            if (secs === 0) {
                return `${minutes}m`;
            }
            return `${minutes}m ${secs}s`;
        }
        return `${seconds}s`;
    }
    
    /**
     * Start rest timer with specific duration (auto-start)
     */
    startRestTimerQuick(seconds, exerciseName, buttonElement) {
        if (window.restTimer) {
            console.log(`Ã¢ÂÂ±Ã¯Â¸Â Quick rest timer: ${seconds}s for ${exerciseName}`);
            window.restTimer.startFromInline(seconds, exerciseName, buttonElement);
        } else {
            console.error('Ã¢ÂÅ’ Rest timer not available');
            if (window.Toast) {
                window.Toast.error('Rest timer not initialized');
            }
        }
    }
    
    /**
     * Render workout logging interface
     */
    async renderWorkoutLog(routineName, routine) {
        const activeWorkoutContainer = document.getElementById('activeWorkoutContainer');
        if (activeWorkoutContainer) {
            activeWorkoutContainer.style.display = 'block';
            setTimeout(() => {
                activeWorkoutContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        
        const workoutTable = document.getElementById('workoutLogTable');
        if (!workoutTable) return;
        
        this.currentRoutine = routineName;
        this.currentExercises = routine.exercises;
        
        const profileName = window.appState && window.appState.get('currentProfile');
        
        // Pre-fetch progressive overload suggestions
        const suggestions = {};
        if (profileName) {
            for (const ex of routine.exercises) {
                const lastPerformance = await this.getLastWorkoutPerformance(ex.exercise, profileName);
                suggestions[ex.exercise] = this.calculateProgressiveSuggestion(lastPerformance, ex);
            }
        }
        
        const totalSets = routine.exercises.reduce((sum, ex) => sum + ex.sets, 0);
        
        workoutTable.innerHTML = `
            ${this.renderHeader(routineName, routine.exercises.length, totalSets)}
            ${await this.renderExerciseTable(routine.exercises, suggestions)}
            ${this.renderActionButtons(routineName, routine.exercises)}
        `;
        
        window.bodybuilding.workoutLogger.updateTimerDisplay();
        window.setTracker.addBlinkingStyles();
        
        setTimeout(() => {
            window.setTracker.activateFirstSet();
        }, 500);
        
        this.attachEventListeners(routineName, routine.exercises);
    }
    
    renderHeader(routineName, exerciseCount, totalSets) {
        return `
            <div style="background: var(--bg-gray); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; font-size: 16px; margin-bottom: 5px;">💪 ${routineName}</div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            ${exerciseCount} exercises Ã¢â‚¬Â¢ ${totalSets} total sets
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button id="workoutTimerControl" 
                                style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer;"
                                type="button">
                            Ã¢â€“Â¶Ã¯Â¸Â Start Timer
                        </button>
                        <div id="workoutTimer" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 18px; min-width: 120px; text-align: center;">
                            00:00:00
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async renderExerciseTable(exercises, suggestions = {}) {
        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 12px; background: var(--bg-gray);">Exercise</th>
                        <th style="text-align: center; padding: 12px; background: var(--bg-gray);">Target Range</th>
                        <th style="text-align: center; padding: 12px; background: var(--bg-gray);">Rest</th>
                        <th style="text-align: left; padding: 12px; background: var(--bg-gray);">Sets</th>
                    </tr>
                </thead>
                <tbody>
                    ${exercises.map((ex, exIndex) => this.renderExerciseRow(ex, exIndex, suggestions)).join('')}
                </tbody>
            </table>
        `;
    }
    
    renderExerciseRow(ex, exIndex, suggestions) {
        const suggestion = suggestions[ex.exercise];
        
        // Progressive overload banner
        let progressBanner = '';
        if (suggestion) {
            const colors = {
                'increase_weight': { bg: '#10b981', icon: '🚀' },
                'increase_reps': { bg: '#3b82f6', icon: '📈' },
                'maintain': { bg: '#f59e0b', icon: '💪' },
                'first_time': { bg: '#6366f1', icon: 'Ã°Å¸â€ â€¢' }
            };
            
            const style = colors[suggestion.type] || colors.maintain;
            
            progressBanner = `
                <div style="margin-top: 8px; padding: 8px 12px; background: ${style.bg}; border-radius: 6px;">
                    <div style="font-size: 11px; color: white; font-weight: 600;">
                        ${style.icon} ${suggestion.reason}
                    </div>
                </div>
            `;
        }
        
        const suggestedWeight = suggestion && suggestion.suggestedWeight || '';
        const suggestedReps = suggestion && suggestion.suggestedReps || ex.min_reps;
        
        // Display rep range
        const repRangeDisplay = ex.min_reps === ex.max_reps 
            ? `${ex.min_reps} reps`
            : `${ex.min_reps}-${ex.max_reps} reps`;
        
        // Format rest time
        const restDisplay = this.formatRestTime(ex.rest || 60);
        
        return `
            <tr>
                <td style="padding: 12px; font-weight: 600;">
                    ${ex.exercise}
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                        ${ex.sets} Ãƒâ€” ${repRangeDisplay}
                    </div>
                    ${progressBanner}
                    
                    <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                        <div>
                            <input type="number" 
                                   id="exercise-weight-${exIndex}" 
                                   placeholder="Weight"
                                   value="${suggestedWeight}"
                                   style="width: 100%; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; text-align: center; font-size: 12px;"
                                   oninput="window.workoutUI.applyExerciseWeight(${exIndex}, this.value)">
                            <div style="font-size: 9px; color: var(--text-secondary); margin-top: 2px; text-align: center;">Default weight</div>
                        </div>
                        
                        <div>
                            <input type="number" 
                                   id="exercise-reps-${exIndex}" 
                                   placeholder="Reps"
                                   value="${suggestedReps}"
                                   style="width: 100%; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; text-align: center; font-size: 12px;"
                                   oninput="window.workoutUI.applyExerciseReps(${exIndex}, this.value)">
                            <div style="font-size: 9px; color: var(--text-secondary); margin-top: 2px; text-align: center;">Default reps</div>
                        </div>
                        
                        <div>
                            <input type="text" 
                                   id="exercise-rest-${exIndex}" 
                                   placeholder="Rest"
                                   value="${ex.rest || 60}"
                                   style="width: 100%; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px; text-align: center; font-size: 12px;"
                                   oninput="window.workoutUI.applyExerciseRest(${exIndex}, this.value)">
                            <div style="font-size: 9px; color: var(--text-secondary); margin-top: 2px; text-align: center;">Default rest (s)</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px; text-align: center; font-weight: 600; color: var(--success);">
                    ${repRangeDisplay}
                </td>
                <td style="padding: 12px; text-align: center;">
                    <button 
                        class="inline-rest-btn"
                        data-exercise-name="${ex.exercise.replace(/"/g, '&quot;')}"
                        data-rest-seconds="${ex.rest || 60}"
                        onclick="window.workoutUI.startRestTimerQuick(${ex.rest || 60}, '${ex.exercise.replace(/'/g, "\\'")}', this)"
                        style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 8px 14px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; margin: 0 auto;"
                        onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';"
                        onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
                        type="button">
                        <span style="font-size: 16px;">Ã¢ÂÂ±Ã¯Â¸Â</span>
                        <span>${restDisplay}</span>
                    </button>
                </td>
                <td style="padding: 12px;">
                    ${this.renderSetInputs(ex, exIndex, suggestedWeight, suggestedReps)}
                </td>
            </tr>
        `;
    }
    
    renderSetInputs(ex, exIndex, suggestedWeight = '', suggestedReps = null) {
        const targetReps = suggestedReps || ex.current_reps || ex.min_reps;
        const isRange = ex.min_reps !== ex.max_reps;
        const rangeDisplay = isRange ? `${ex.min_reps}-${ex.max_reps}` : ex.min_reps;
        
        return `
            <div style="display: flex; gap: 6px;">
                ${Array.from({ length: ex.sets }, (_, setIndex) => {
                    const globalSetId = `${exIndex}_${setIndex}`;
                    
                    return `
                        <div style="display: flex; flex-direction: column; gap: 4px; min-width: 85px; flex: 1; background: var(--bg-gray); padding: 6px; border-radius: 6px; border: 2px solid var(--border);" 
                             id="set-container-${globalSetId}">
                            <div style="text-align: center; font-size: 10px; font-weight: 700; color: var(--text-secondary);">
                                Set ${setIndex + 1}
                            </div>
                            <input type="number" 
                                   id="weight_${globalSetId}" 
                                   placeholder="Weight"
                                   value="${suggestedWeight}"
                                   style="width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; text-align: center; font-size: 13px;"
                                   oninput="this.dataset.userModified = 'true';">
                            <input type="number" 
                                   id="reps_${globalSetId}" 
                                   placeholder="Reps"
                                   value="${targetReps}"
                                   style="width: 100%; padding: 6px; border: 1px solid var(--border); border-radius: 4px; text-align: center; font-size: 13px;"
                                   title="Target: ${targetReps} reps"
                                   oninput="this.dataset.userModified = 'true';">
                            ${isRange ? `
                                <div style="text-align: center; font-size: 9px; color: var(--text-secondary);">
                                    Range: ${rangeDisplay}
                                </div>
                            ` : ''}
                            <div style="display: flex; align-items: center; justify-content: center; margin-top: 2px;">
                                <input type="checkbox" 
                                       id="check_${globalSetId}"
                                       style="width: 18px; height: 18px; cursor: pointer;"
                                       onchange="window.setTracker.toggleSetComplete('${globalSetId}')">
                                <label for="check_${globalSetId}" style="font-size: 11px; margin-left: 4px; cursor: pointer;">Done</label>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    renderActionButtons(routineName, exercises) {
        return `
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-success" style="flex: 1;" id="finishWorkoutBtn" type="button">
                    Ã¢Å“â€¦ Finish Workout
                </button>
                <button class="btn btn-danger" style="flex: 1;" id="cancelWorkoutBtn" type="button">
                    Ã¢ÂÅ’ Cancel
                </button>
            </div>
        `;
    }
    
    applyExerciseWeight(exerciseIndex, weight) {
        if (!weight || weight <= 0) return;
        
        const allSets = document.querySelectorAll(`[id^="weight_${exerciseIndex}_"]`);
        allSets.forEach(input => {
            if (!input.value || input.dataset.userModified !== 'true') {
                input.value = parseFloat(weight);
            }
        });
        
        if (window.Toast) {
            window.Toast.success(`Applied ${weight}kg to all sets 💪`);
        }
    }
    
    applyExerciseReps(exerciseIndex, reps) {
        if (!reps) return;
        
        const repsValue = parseInt(reps);
        if (isNaN(repsValue) || repsValue <= 0) return;
        
        const allSets = document.querySelectorAll(`[id^="reps_${exerciseIndex}_"]`);
        allSets.forEach(input => {
            if (!input.value || input.dataset.userModified !== 'true') {
                input.value = repsValue;
            }
        });
        
        if (window.Toast) {
            window.Toast.success(`Applied ${repsValue} reps 🎯`);
        }
    }
    
    applyExerciseRest(exerciseIndex, rest) {
        if (!rest || rest <= 0) return;
        
        const restValue = parseInt(rest);
        if (isNaN(restValue)) return;
        
        // Find the rest button for this exercise
        const exerciseRow = document.querySelector(`#exercise-rest-${exerciseIndex}`);
        if (exerciseRow) {
            const restButton = exerciseRow.closest('tr').querySelector('.inline-rest-btn');
            if (restButton) {
                // Update the button's data attribute
                restButton.setAttribute('data-rest-seconds', restValue);
                
                // Update the button text display
                const restDisplay = this.formatRestTime(restValue);
                const textSpan = restButton.querySelector('span:last-child');
                if (textSpan) {
                    textSpan.textContent = restDisplay;
                }
                
                // Update the onclick handler with new rest time
                const exerciseName = restButton.getAttribute('data-exercise-name');
                if (exerciseName) {
                    restButton.onclick = () => window.workoutUI.startRestTimerQuick(restValue, exerciseName, restButton);
                }
            }
        }
        
        if (window.Toast) {
            window.Toast.success(`Rest time updated: ${restValue}s ⏱️`);
        }
    }
    
    attachEventListeners(routineName, exercises) {
        setTimeout(() => {
            const timerControlBtn = document.getElementById('workoutTimerControl');
            const finishBtn = document.getElementById('finishWorkoutBtn');
            const cancelBtn = document.getElementById('cancelWorkoutBtn');
            
            if (timerControlBtn) {
                timerControlBtn.addEventListener('click', () => {
                    const logger = window.bodybuilding.workoutLogger;
                    if (logger.timerInterval) {
                        logger.pauseTimer();
                        timerControlBtn.textContent = 'Ã¢â€“Â¶Ã¯Â¸Â Resume';
                    } else {
                        logger.startTimer();
                        timerControlBtn.textContent = 'Ã¢ÂÂ¸Ã¯Â¸Â Pause';
                    }
                });
            }
            
            if (finishBtn) {
                finishBtn.addEventListener('click', async () => {
                    await window.bodybuilding.workoutLogger.finishWorkout(routineName, exercises);
                });
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    window.bodybuilding.workoutLogger.cancelWorkout();
                });
            }
        }, 100);
    }
}

window.WorkoutUI = WorkoutUI;
window.workoutUI = new WorkoutUI();

console.log('[JS] Ã¢Å“â€¦ Workout UI Module Loaded with Fixed Inline Rest Buttons and Emoji Fix');
console.log("[DEBUG UI] window.workoutUI:", window.workoutUI);
console.log("[DEBUG UI] renderWorkoutLog:", window.workoutUI ? typeof window.workoutUI.renderWorkoutLog : 'undefined');