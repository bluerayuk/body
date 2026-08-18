// bodybuilding-workout-logger-history.js - Workout History Display Module
// Handles rendering workout history, statistics, past workout details
// UPDATED: Show max 4 entries + "More" button for full scrollable history

class WorkoutHistory {
    constructor() {
        // No persistent state needed
    }
    
    /**
     * Render workout history with duration display - MAX 4 ENTRIES + MORE BUTTON
     */
    async renderWorkoutHistory(profileName) {
        const historyContainer = document.getElementById('workoutHistory');
        if (!historyContainer) return;
        
        try {
            const history = await API.getWorkoutHistory(profileName);
            
            if (!history || history.length === 0) {
                historyContainer.innerHTML = '<p class="placeholder">No workout history yet. Complete your first workout!</p>';
                return;
            }
            
            // Reverse to show most recent first
            const reversedHistory = [...history].reverse();
            const recentHistory = reversedHistory.slice(0, 4); // Show only last 4
            const hasMore = history.length > 4;
            
            historyContainer.innerHTML = `
                ${this.renderHistorySummary(history, recentHistory)}
                ${recentHistory.map((workout, index) => this.renderWorkoutCard(workout, index)).join('')}
                ${hasMore ? this.renderMoreButton(history.length) : ''}
            `;
            
            // Attach event listener to "More" button
            if (hasMore) {
                const moreBtn = historyContainer.querySelector('.show-more-btn');
                if (moreBtn) {
                    moreBtn.addEventListener('click', () => {
                        this.showFullHistoryModal(reversedHistory);
                    });
                }
            }
            
            // Attach event listeners to delete buttons
            this.attachDeleteListeners(profileName, reversedHistory);
        } catch (error) {
            console.error('Error rendering workout history:', error);
            historyContainer.innerHTML = '<p class="placeholder" style="color: var(--danger);">Failed to load workout history</p>';
        }
    }
    
    /**
     * Attach delete button event listeners
     */
    async attachDeleteListeners(profileName, reversedHistory) {
        const deleteButtons = document.querySelectorAll('.workout-delete-btn');
        
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const displayIndex = parseInt(btn.dataset.workoutIndex);
                
                // Convert display index to actual history array index
                const actualIndex = reversedHistory.length - 1 - displayIndex;
                const workout = reversedHistory[displayIndex];
                
                console.log('🗑️ Delete clicked:', { displayIndex, actualIndex, routine: workout.routine });
                
                const confirmed = await window.Modal.confirm(
                    'Delete Workout?',
                    `Delete "${workout.routine}" from ${new Date(workout.date).toLocaleDateString()}?\n\nThis cannot be undone.`
                );
                
                if (!confirmed) return;
                
                try {
                    const result = await window.API.deleteWorkout(profileName, actualIndex);
                    
                    if (result.success) {
                        window.Toast.success('Workout deleted ✅');
                        
                        // Check if we're in a modal (look for modal overlay)
                        const modalOverlay = document.querySelector('.modal-overlay');
                        const wasInModal = modalOverlay !== null;
                        
                        // Close modal if open
                        if (wasInModal && modalOverlay.parentNode) {
                            modalOverlay.parentNode.removeChild(modalOverlay);
                        }
                        
                        // Refresh the history display
                        await this.renderWorkoutHistory(profileName);
                        
                        // Re-open modal if it was open
                        if (wasInModal) {
                            // Get updated history and show modal again
                            const history = await window.API.getWorkoutHistory(profileName);
                            const reversedHistory = [...history].reverse();
                            this.showFullHistoryModal(reversedHistory);
                        }
                    } else {
                        window.Toast.error(result.error || 'Failed to delete workout');
                    }
                } catch (error) {
                    console.error('Delete error:', error);
                    window.Toast.error('Failed to delete: ' + error.message);
                }
            });
        });
    }
    
    /**
     * Render history summary banner
     */
    renderHistorySummary(history, recentHistory) {
        return `
            <div style="margin-bottom: 15px; padding: 12px; background: linear-gradient(135deg, #e0f2fe, #bae6fd); border-radius: 8px; border-left: 4px solid #0284c7;">
                <div style="font-size: 13px; font-weight: 700; color: #0c4a6e; margin-bottom: 4px;">
                    📊 Total Workouts: ${history.length}
                </div>
                <div style="font-size: 12px; color: #075985;">
                    Showing ${recentHistory.length} most recent workout${recentHistory.length !== 1 ? 's' : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render "More" button
     */
    renderMoreButton(totalCount) {
        return `
            <div style="margin-top: 15px; text-align: center;">
                <button class="btn btn-primary show-more-btn" type="button" style="padding: 12px 24px; font-size: 14px; font-weight: 600;">
                    📜 Show All History (${totalCount} workouts)
                </button>
            </div>
        `;
    }
    
    /**
     * Show full history in a scrollable modal
     */
    async showFullHistoryModal(allWorkouts) {
        const profileName = window.appState?.get('currentProfile');
        if (!profileName) return;
        
        const modalContent = `
            <div style="max-height: 60vh; overflow-y: auto; padding-right: 10px;">
                ${allWorkouts.map((workout, index) => this.renderWorkoutCard(workout, index, true)).join('')}
            </div>
            
            <div style="margin-top: 15px; padding: 12px; background: linear-gradient(135deg, #e0f2fe, #bae6fd); border-radius: 8px; text-align: center;">
                <div style="font-size: 13px; font-weight: 700; color: #0c4a6e;">
                    📊 Total: ${allWorkouts.length} workout${allWorkouts.length !== 1 ? 's' : ''}
                </div>
            </div>
        `;
        
        const modal = new Modal({
            title: '📜 Complete Workout History',
            content: modalContent,
            width: '700px',
            maxWidth: '95%',
            buttons: [
                {
                    text: 'Close',
                    className: 'btn-primary'
                }
            ]
        });
        
        // Attach delete button listeners for modal after it's rendered
        setTimeout(() => {
            this.attachDeleteListeners(profileName, allWorkouts);
        }, 100);
    }
    
    /**
     * Render individual workout card
     */
    renderWorkoutCard(workout, index, isInModal = false) {
        const totalSets = workout.exercises.length;
        const totalVolume = workout.exercises.reduce((sum, ex) => 
            sum + (ex.weight * ex.reps), 0
        ).toFixed(1);
        
        const uniqueExercises = [...new Set(workout.exercises.map(ex => ex.exercise))];
        
        // Format date
        const date = new Date(workout.date);
        const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        // Duration display
        const durationBadge = workout.duration ? `
            <div style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
                <span style="font-size: 16px;">⏱️</span>
                <span style="font-weight: 600; color: var(--primary);">${workout.duration}</span>
            </div>
        ` : '';
        
        // Compact style for modal
        const cardStyle = isInModal 
            ? 'background: var(--bg-gray); padding: 14px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--primary);'
            : 'background: var(--bg-gray); padding: 16px; border-radius: 10px; margin-bottom: 12px; border-left: 4px solid var(--primary); transition: all 0.2s ease;';
        
        const hoverEffects = isInModal 
            ? ''
            : `onmouseenter="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
               onmouseleave="this.style.transform='translateX(0)'; this.style.boxShadow='none';"`;
        
        return `
            <div style="${cardStyle}" ${hoverEffects}>
                
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: ${isInModal ? '15px' : '16px'}; color: var(--text-dark); margin-bottom: 4px;">
                            🏋️ ${workout.routine}
                        </div>
                        <div style="font-size: ${isInModal ? '11px' : '12px'}; color: var(--text-secondary);">
                            ${dateStr} at ${timeStr}
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${durationBadge}
                        <button class="btn btn-danger workout-delete-btn" 
                                data-workout-index="${index}"
                                style="padding: 6px 10px; font-size: 12px;"
                                type="button">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <!-- Stats Grid -->
                ${this.renderStatsGrid(totalSets, uniqueExercises.length, totalVolume, isInModal)}
                
                <!-- Exercise Details (Collapsed) -->
                ${this.renderExerciseDetails(uniqueExercises, workout.exercises, isInModal)}
            </div>
        `;
    }
    
    /**
     * Render stats grid
     */
    renderStatsGrid(totalSets, exerciseCount, totalVolume, isCompact = false) {
        const fontSize = isCompact ? '18px' : '20px';
        const labelSize = isCompact ? '10px' : '11px';
        const padding = isCompact ? '8px' : '10px';
        
        return `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: ${isCompact ? '8px' : '10px'}; margin-bottom: ${isCompact ? '10px' : '12px'};">
                <div style="background: var(--bg-white); padding: ${padding}; border-radius: 6px; text-align: center;">
                    <div style="font-size: ${fontSize}; font-weight: 700; color: var(--primary);">${totalSets}</div>
                    <div style="font-size: ${labelSize}; color: var(--text-secondary);">Sets</div>
                </div>
                <div style="background: var(--bg-white); padding: ${padding}; border-radius: 6px; text-align: center;">
                    <div style="font-size: ${fontSize}; font-weight: 700; color: var(--success);">${exerciseCount}</div>
                    <div style="font-size: ${labelSize}; color: var(--text-secondary);">Exercises</div>
                </div>
                <div style="background: var(--bg-white); padding: ${padding}; border-radius: 6px; text-align: center;">
                    <div style="font-size: ${fontSize}; font-weight: 700; color: var(--warning);">${totalVolume}</div>
                    <div style="font-size: ${labelSize}; color: var(--text-secondary);">kg Volume</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render exercise details (collapsible)
     */
    renderExerciseDetails(uniqueExercises, exercises, isCompact = false) {
        const fontSize = isCompact ? '11px' : '12px';
        const summarySize = isCompact ? '11px' : '12px';
        
        return `
            <details style="margin-top: ${isCompact ? '8px' : '10px'};">
                <summary style="cursor: pointer; font-size: ${summarySize}; font-weight: 600; color: var(--primary); padding: 6px; border-radius: 4px; transition: background 0.2s ease;"
                         onmouseenter="this.style.background='rgba(102, 126, 234, 0.1)';"
                         onmouseleave="this.style.background='transparent';">
                    📋 View Exercise Details
                </summary>
                <div style="margin-top: 10px; padding: 10px; background: var(--bg-white); border-radius: 6px;">
                    ${uniqueExercises.map(exerciseName => {
                        const exerciseSets = exercises.filter(ex => ex.exercise === exerciseName);
                        return `
                            <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
                                <div style="font-weight: 600; font-size: ${isCompact ? '12px' : '13px'}; margin-bottom: 4px;">${exerciseName}</div>
                                <div style="font-size: ${fontSize}; color: var(--text-secondary);">
                                    ${exerciseSets.map(set => 
                                        `Set ${set.set}: ${set.weight}kg × ${set.reps} reps`
                                    ).join(' • ')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </details>
        `;
    }
}

// Export
window.WorkoutHistory = WorkoutHistory;
window.workoutHistory = new WorkoutHistory();

console.log('[JS] ✅ Workout History Module Loaded - Max 4 entries with More button');