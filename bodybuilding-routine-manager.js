// bodybuilding-routine-manager.js - Routine Management Module
// UPDATED: Compact confirmation modal (350px width)

class RoutineManager {
    constructor(manager) {
        this.manager = manager;
    }
    
    /**
     * Delete a saved routine - FIXED with fallback confirmation and compact modal
     */
    async deleteRoutine(routineName) {
        console.log('🗑️ Delete routine requested:', routineName);
        
        const profileName = window.appState?.get('currentProfile');
        if (!profileName) {
            console.error('❌ No profile selected');
            if (window.Toast) {
                window.Toast.warning('Please select a profile first');
            }
            return;
        }
        
        try {
            // Use compact confirmation
            let confirmed = false;
            
            if (window.Modal && typeof window.Modal.confirm === 'function') {
                confirmed = await window.Modal.confirm(
                    'Delete Routine?',
                    `Delete "${routineName}"? This cannot be undone.`,
                    { width: '350px' }
                );
            } else {
                // Fallback to native confirm
                confirmed = confirm(`Delete "${routineName}"?\n\nThis cannot be undone.`);
            }
            
            if (!confirmed) {
                console.log('ℹ️ User cancelled deletion');
                return;
            }
            
            console.log('📤 Calling API.deleteRoutine...');
            const result = await API.deleteRoutine(profileName, routineName);
            
            console.log('📥 API response:', result);
            
            if (result && result.success) {
                console.log('✅ Routine deleted successfully');
                
                // Invalidate cache
                API.invalidateCache(`routines:${profileName}`);
                
                // Refresh the display
                await this.manager.refresh();
                
                if (window.Toast) {
                    window.Toast.success(`Routine "${routineName}" deleted ✅`);
                }
            } else {
                console.error('❌ Delete failed:', result?.error);
                if (window.Toast) {
                    window.Toast.error(result?.error || 'Failed to delete routine');
                } else {
                    alert('Failed to delete routine: ' + (result?.error || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('❌ Exception during delete:', error);
            if (window.Toast) {
                window.Toast.error('Failed to delete routine: ' + error.message);
            } else {
                alert('Failed to delete routine: ' + error.message);
            }
        }
    }
    
    /**
     * Edit an existing routine
     */
    async editRoutine(routineName) {
        console.log('✏️ Editing routine:', routineName);
        
        const profileName = window.appState?.get('currentProfile');
        if (!profileName) return;
        
        try {
            const routines = await API.getRoutines(profileName);
            const routine = routines[routineName];
            
            if (!routine || !routine.exercises) {
                if (window.Toast) {
                    window.Toast.error('Routine not found');
                }
                return;
            }
            
            // Load exercises into current builder
            this.manager.currentExercises = [...routine.exercises];
            this.manager.editingRoutineName = routineName;
            
            // Update routine name input
            const nameInput = document.getElementById('routineNameInput');
            if (nameInput) {
                nameInput.value = routineName;
                nameInput.style.borderColor = '#f59e0b';
                nameInput.style.background = 'rgba(245, 158, 11, 0.1)';
            }
            
            // Render the routine table
            this.manager.routineBuilder.renderRoutineTable();
            
            // Scroll to the builder
            const card = document.querySelector('.card h2');
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            if (window.Toast) {
                window.Toast.info(`📝 Editing "${routineName}" - Make changes and click Save to update`);
            }
            
            console.log('✅ Loaded routine for editing:', this.manager.currentExercises);
        } catch (error) {
            console.error('Error loading routine for editing:', error);
            if (window.Toast) {
                window.Toast.error('Failed to load routine: ' + error.message);
            }
        }
    }
    
    /**
     * Render saved routines list
     */
    renderRoutinesList(routines) {
        console.log('🎨 Rendering routines list...');
        
        const routinesList = document.getElementById('routinesList');
        console.log('📍 routinesList element:', routinesList);
        
        if (!routinesList) {
            console.error('❌ routinesList element not found!');
            return;
        }
        
        const routineNames = Object.keys(routines);
        console.log('🔑 Routine names:', routineNames);
        
        if (routineNames.length === 0) {
            console.log('ℹ️ No routines to display');
            routinesList.innerHTML = '<p class="placeholder">No saved routines</p>';
            return;
        }
        
        console.log(`✅ Rendering ${routineNames.length} routines`);
        
        routinesList.innerHTML = routineNames.map(name => {
            const routine = routines[name];
            const exerciseCount = routine.exercises?.length || 0;
            
            const exerciseSummary = routine.exercises?.slice(0, 3).map(ex => ex.exercise).join(', ') || '';
            const hasMore = exerciseCount > 3 ? ` +${exerciseCount - 3} more` : '';
            
            // Escape quotes for data attributes
            const escapedName = name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            
            return `
                <div style="padding: 14px; background: var(--bg-gray); border-radius: 10px; margin-bottom: 12px; transition: all 0.2s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 16px; margin-bottom: 4px; color: var(--text-dark);">${name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">
                                ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}
                            </div>
                            ${exerciseSummary ? `
                                <div style="font-size: 11px; color: var(--text-light); font-style: italic;">
                                    ${exerciseSummary}${hasMore}
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-primary routine-edit-btn" 
                                    style="padding: 6px 12px; font-size: 13px;"
                                    data-routine="${escapedName}"
                                    type="button">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-danger routine-delete-btn" 
                                    style="padding: 6px 12px; font-size: 13px;"
                                    data-routine="${escapedName}"
                                    type="button">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Attach event listeners to buttons (safer than inline onclick)
        setTimeout(() => {
            document.querySelectorAll('.routine-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const routineName = btn.dataset.routine;
                    console.log('✏️ Edit button clicked for:', routineName);
                    this.editRoutine(routineName);
                });
            });
            
            document.querySelectorAll('.routine-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const routineName = btn.dataset.routine;
                    console.log('🗑️ Delete button clicked for:', routineName);
                    this.deleteRoutine(routineName);
                });
            });
        }, 100);
        
        console.log('✅ Routines list rendered with event listeners attached');
    }
    
    /**
     * Render routine selector for workout logging
     */
    renderRoutineSelector(routines) {
        const logSelect = document.getElementById('logRoutineSelect');
        if (!logSelect) return;
        
        const routineNames = Object.keys(routines);
        
        logSelect.innerHTML = '<option value="">Select routine...</option>';
        routineNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            logSelect.appendChild(opt);
        });
    }
    
    /**
     * Clear all displays
     */
    clearDisplays() {
        const routinesList = document.getElementById('routinesList');
        if (routinesList) {
            routinesList.innerHTML = '<p class="placeholder">Select a profile to view routines</p>';
        }
        
        const logSelect = document.getElementById('logRoutineSelect');
        if (logSelect) {
            logSelect.innerHTML = '<option value="">Select routine...</option>';
        }
    }
}