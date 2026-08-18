class RoutineBuilder {
    constructor(manager) {
        this.manager = manager;
    }
    
    /**
     * Load exercises for a muscle group
     */
    async loadExercises(muscleGroup) {
        if (!muscleGroup) return;
        
        try {
            const exercises = await API.getExercises(muscleGroup);
            const exerciseSelect = document.getElementById('exerciseSelect');
            
            if (exerciseSelect) {
                exerciseSelect.innerHTML = '<option value="">Select exercise...</option>';
                
                const profileName = window.appState?.get('currentProfile');
                let customExercises = [];
                
                if (profileName) {
                    try {
                        customExercises = await API.getCustomExercises(profileName, muscleGroup);
                    } catch (error) {
                        console.error('Error loading custom exercises:', error);
                    }
                }
                
                exercises.forEach(exercise => {
                    const opt = document.createElement('option');
                    opt.value = exercise;
                    
                    if (customExercises.includes(exercise)) {
                        opt.textContent = `⭐ ${exercise} (Custom)`;
                        opt.style.fontWeight = '600';
                        opt.style.color = '#f59e0b';
                    } else {
                        opt.textContent = exercise;
                    }
                    
                    exerciseSelect.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Error loading exercises:', error);
            if (window.Toast) {
                window.Toast.error('Failed to load exercises');
            }
        }
    }
    
    /**
     * Add exercise to current routine - 3 SEPARATE REP FIELDS
     */
    async addExercise() {
        console.log('='.repeat(60));
        console.log('📘 ADD EXERCISE CALLED');
        
        const exerciseSelect = document.getElementById('exerciseSelect');
        const setsInput = document.getElementById('setsInput');
        const minRepsInput = document.getElementById('minRepsInput');
        const maxRepsInput = document.getElementById('maxRepsInput');
        const currentRepsInput = document.getElementById('currentRepsInput');
        const restInput = document.getElementById('restInput');
        
        const exercise = exerciseSelect?.value;
        const sets = parseInt(setsInput?.value || '0');
        const minReps = parseInt(minRepsInput?.value || '0');
        const maxReps = parseInt(maxRepsInput?.value || '0');
        const currentReps = parseInt(currentRepsInput?.value || '0');
        const rest = parseInt(restInput?.value || '60');
        
        console.log('📋 Input values:');
        console.log('   exercise:', exercise);
        console.log('   sets:', sets);
        console.log('   minReps:', minReps);
        console.log('   maxReps:', maxReps);
        console.log('   currentReps:', currentReps);
        console.log('   rest:', rest);
        
        // Validation
        if (!exercise) {
            if (window.Toast) {
                window.Toast.warning('Please select an exercise');
            }
            return;
        }
        
        if (!sets || sets <= 0) {
            if (window.Toast) {
                window.Toast.warning('Please enter valid sets');
            }
            return;
        }
        
        if (!minReps || minReps <= 0) {
            if (window.Toast) {
                window.Toast.warning('Please enter minimum reps');
            }
            return;
        }
        
        if (!maxReps || maxReps <= 0) {
            if (window.Toast) {
                window.Toast.warning('Please enter maximum reps');
            }
            return;
        }
        
        if (maxReps < minReps) {
            if (window.Toast) {
                window.Toast.warning('Max reps must be ≥ min reps');
            }
            return;
        }
        
        if (!currentReps || currentReps < minReps || currentReps > maxReps) {
            if (window.Toast) {
                window.Toast.warning(`Current reps must be between ${minReps} and ${maxReps}`);
            }
            return;
        }
        
        // Remove custom indicator from exercise name if present
        let cleanExerciseName = exercise;
        if (exercise.startsWith('⭐ ')) {
            cleanExerciseName = exercise.replace('⭐ ', '').replace(' (Custom)', '');
        }
        
        // 🔥 CRYSTAL CLEAR: Store all 3 rep values
        const exerciseObj = { 
            exercise: cleanExerciseName, 
            sets: sets,
            min_reps: minReps,
            max_reps: maxReps,
            current_reps: currentReps,
            rest: rest 
        };
        
        console.log('🔥 CREATED EXERCISE OBJECT:');
        console.log(JSON.stringify(exerciseObj, null, 2));
        
        // Add to array
        this.manager.currentExercises.push(exerciseObj);
        
        console.log('📊 Array now has', this.manager.currentExercises.length, 'exercises');
        console.log('='.repeat(60));
        
        // Re-render
        this.renderRoutineTable();
        
        if (window.Toast) {
            window.Toast.success(`Added ${cleanExerciseName}: ${sets}×${currentReps} (${minReps}-${maxReps}) 💪`);
        }
    }
    
    /**
     * Remove exercise from current routine
     */
    removeExercise(index) {
        if (index >= 0 && index < this.manager.currentExercises.length) {
            this.manager.currentExercises.splice(index, 1);
            this.renderRoutineTable();
            
            if (window.Toast) {
                window.Toast.info('Exercise removed');
            }
        }
    }
    
    /**
     * 🔥 NEW: Edit exercise inline (opens modal with pre-filled values)
     */
    async editExercise(index) {
        const exercise = this.manager.currentExercises[index];
        if (!exercise) return;
        
        console.log('✏️ Editing exercise:', exercise);
        
        new Modal({
            title: `✏️ Edit Exercise: ${exercise.exercise}`,
            content: `
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px;">Sets</label>
                    <input type="number" id="editSets" value="${exercise.sets}" min="1" max="10" 
                           style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 15px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px;">Rep Range & Current Progress</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 10px;">
                        <div>
                            <label style="color: #3b82f6; font-size: 11px; margin-bottom: 4px; display: block; font-weight: 600;">📉 Min Reps</label>
                            <input type="number" id="editMinReps" value="${exercise.min_reps}" min="1" max="100" 
                                   style="width: 100%; padding: 10px; border: 2px solid #3b82f6; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="color: #10b981; font-size: 11px; margin-bottom: 4px; display: block; font-weight: 600;">📈 Max Reps</label>
                            <input type="number" id="editMaxReps" value="${exercise.max_reps}" min="1" max="100" 
                                   style="width: 100%; padding: 10px; border: 2px solid #10b981; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div>
                            <label style="color: #f59e0b; font-size: 11px; font-weight: 700; margin-bottom: 4px; display: block;">⚡ Current Reps</label>
                            <input type="number" id="editCurrentReps" value="${exercise.current_reps}" min="1" max="100"
                                   style="width: 100%; padding: 10px; border: 2px solid #f59e0b; border-radius: 6px; font-size: 14px;">
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px;">Rest (seconds)</label>
                    <input type="number" id="editRest" value="${exercise.rest}" min="0" max="300" 
                           style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 15px;">
                </div>
                
                <div style="background: linear-gradient(135deg, #e0f2fe, #bae6fd); padding: 10px 14px; border-radius: 8px; font-size: 11px; color: #0c4a6e; line-height: 1.5;">
                    <strong>💡 Progressive Overload:</strong><br>
                    Complete all sets at <strong style="color: #f59e0b;">Current Reps</strong> → Increase by 1 → 
                    Repeat until you hit <strong style="color: #10b981;">Max Reps</strong> → 
                    <strong style="color: #ef4444;">Add weight</strong>, reset to <strong style="color: #3b82f6;">Min Reps</strong>
                </div>
            `,
            buttons: [
                {
                    text: 'Save Changes',
                    className: 'btn-success',
                    onClick: async (modal) => {
                        const sets = parseInt(modal.getValue('editSets'));
                        const minReps = parseInt(modal.getValue('editMinReps'));
                        const maxReps = parseInt(modal.getValue('editMaxReps'));
                        const currentReps = parseInt(modal.getValue('editCurrentReps'));
                        const rest = parseInt(modal.getValue('editRest'));
                        
                        // Validation
                        if (!sets || sets <= 0) {
                            await window.Modal.alert('Error', 'Please enter valid sets');
                            return false;
                        }
                        
                        if (!minReps || minReps <= 0) {
                            await window.Modal.alert('Error', 'Please enter minimum reps');
                            return false;
                        }
                        
                        if (!maxReps || maxReps <= 0) {
                            await window.Modal.alert('Error', 'Please enter maximum reps');
                            return false;
                        }
                        
                        if (maxReps < minReps) {
                            await window.Modal.alert('Error', 'Max reps must be ≥ min reps');
                            return false;
                        }
                        
                        if (!currentReps || currentReps < minReps || currentReps > maxReps) {
                            await window.Modal.alert('Error', `Current reps must be between ${minReps} and ${maxReps}`);
                            return false;
                        }
                        
                        // Update the exercise
                        this.manager.currentExercises[index] = {
                            exercise: exercise.exercise,
                            sets: sets,
                            min_reps: minReps,
                            max_reps: maxReps,
                            current_reps: currentReps,
                            rest: rest
                        };
                        
                        console.log('✅ Updated exercise:', this.manager.currentExercises[index]);
                        
                        this.renderRoutineTable();
                        
                        if (window.Toast) {
                            window.Toast.success(`Updated ${exercise.exercise} 💪`);
                        }
                        
                        return true;
                    }
                },
                {
                    text: 'Cancel',
                    className: 'btn-danger'
                }
            ]
        });
    }
    
    /**
     * Render the current routine table - SHOWS ALL 3 REP VALUES + EDIT BUTTON
     */
    renderRoutineTable() {
        const table = document.getElementById('routineTable');
        if (!table) return;
        
        if (this.manager.currentExercises.length === 0) {
            table.innerHTML = '<p class="placeholder">No exercises added</p>';
            return;
        }
        
        const editIndicator = this.manager.editingRoutineName ? `
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #f59e0b; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">✏️</span>
                <div>
                    <div style="font-weight: 700; font-size: 13px; color: #92400e;">EDIT MODE</div>
                    <div style="font-size: 12px; color: #92400e;">Editing: ${this.manager.editingRoutineName}</div>
                </div>
            </div>
        ` : '';
        
        const totalSets = this.manager.currentExercises.reduce((sum, ex) => sum + parseInt(ex.sets), 0);
        
        const tableHTML = `
            ${editIndicator}
            <div style="background: linear-gradient(135deg, #e0f2fe, #bae6fd); padding: 8px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 12px; color: #0c4a6e; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">💪</span>
                <span><strong>${this.manager.currentExercises.length}</strong> exercises, <strong>${totalSets}</strong> total sets</span>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: center; padding: 10px; background: var(--bg-gray); border-bottom: 2px solid var(--border); width: 40px;">📌</th>
                        <th style="text-align: left; padding: 10px; background: var(--bg-gray); border-bottom: 2px solid var(--border);">Exercise</th>
                        <th style="text-align: center; padding: 10px; background: var(--bg-gray); border-bottom: 2px solid var(--border);">Sets</th>
                        <th style="text-align: center; padding: 10px; background: var(--bg-gray); border-bottom: 2px solid var(--border);">Rep Range</th>
                        <th style="text-align: center; padding: 10px; background: var(--bg-gray); border-bottom: 2px solid var(--border);">Current</th>
                        <th style="text-align: center; padding: 10px; background: var(--bg-gray); border-bottom: 2px solid var(--border);">Rest</th>
                        <th style="text-align: center; padding: 10px; background: var(--bg-gray); border-bottom: 2px solid var(--border);">Actions</th>
                    </tr>
                </thead>
                <tbody id="exerciseTableBody">
                    ${this.manager.currentExercises.map((ex, i) => {
                        const rangeDisplay = ex.min_reps === ex.max_reps 
                            ? `<span style="color: var(--success);">${ex.min_reps}</span>`
                            : `<span style="color: #10b981;">${ex.min_reps}-${ex.max_reps}</span>`;
                        
                        const currentDisplay = `<span style="color: var(--primary); font-weight: 700; font-size: 16px;">${ex.current_reps}</span>`;
                        
                        // Calculate progress percentage
                        const range = ex.max_reps - ex.min_reps;
                        const progress = range > 0 ? ((ex.current_reps - ex.min_reps) / range) * 100 : 100;
                        const progressColor = progress < 33 ? '#3b82f6' : progress < 66 ? '#f59e0b' : '#10b981';
                        
                        return `
                        <tr draggable="true" 
                            data-index="${i}"
                            class="draggable-row"
                            style="cursor: move; transition: all 0.2s ease; background: var(--bg-white);">
                            <td style="padding: 10px; border-bottom: 1px solid var(--border); text-align: center;">
                                <span style="font-size: 16px; opacity: 0.5;">⋮⋮</span>
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid var(--border); font-weight: 600;">
                                ${ex.exercise}
                                ${range > 0 ? `
                                <div style="margin-top: 4px; background: #f1f5f9; border-radius: 4px; height: 4px; overflow: hidden;">
                                    <div style="background: ${progressColor}; height: 100%; width: ${progress}%; transition: all 0.3s ease;"></div>
                                </div>
                                ` : ''}
                            </td>
                            <td style="padding: 10px; border-bottom: 1px solid var(--border); text-align: center; font-weight: 600; color: var(--primary);">${ex.sets}</td>
                            <td style="padding: 10px; border-bottom: 1px solid var(--border); text-align: center; font-weight: 600;">${rangeDisplay}</td>
                            <td style="padding: 10px; border-bottom: 1px solid var(--border); text-align: center; font-weight: 600;">${currentDisplay}</td>
                            <td style="padding: 10px; border-bottom: 1px solid var(--border); text-align: center;">${ex.rest}s</td>
                            <td style="padding: 10px; border-bottom: 1px solid var(--border); text-align: center;">
                                <div style="display: flex; gap: 4px; justify-content: center;">
                                    <button class="btn btn-primary" 
                                            style="padding: 4px 8px; font-size: 12px;"
                                            onclick="window.bodybuilding.routineBuilder.editExercise(${i})">
                                        ✏️
                                    </button>
                                    <button class="btn btn-danger" 
                                            style="padding: 4px 8px; font-size: 12px;"
                                            onclick="window.bodybuilding.routineBuilder.removeExercise(${i})">
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        table.innerHTML = tableHTML;
        this.setupDragAndDrop();
    }
    
    /**
     * Setup drag and drop
     */
    setupDragAndDrop() {
        const tbody = document.getElementById('exerciseTableBody');
        if (!tbody) return;
        
        let draggedElement = null;
        let draggedIndex = null;
        
        const rows = tbody.querySelectorAll('.draggable-row');
        
        rows.forEach((row) => {
            row.addEventListener('dragstart', (e) => {
                draggedElement = row;
                draggedIndex = parseInt(row.dataset.index);
                row.style.opacity = '0.4';
                e.dataTransfer.effectAllowed = 'move';
            });
            
            row.addEventListener('dragend', () => {
                row.style.opacity = '1';
                rows.forEach(r => r.style.borderTop = '');
                draggedElement = null;
                draggedIndex = null;
            });
            
            row.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedElement && draggedElement !== row) {
                    row.style.borderTop = '3px solid var(--primary)';
                }
            });
            
            row.addEventListener('dragleave', () => {
                row.style.borderTop = '';
            });
            
            row.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedElement && draggedElement !== row) {
                    const dropIndex = parseInt(row.dataset.index);
                    this.reorderExercise(draggedIndex, dropIndex);
                    if (window.Toast) {
                        window.Toast.success('Exercise reordered! 🔄');
                    }
                }
                row.style.borderTop = '';
            });
        });
    }
    
    /**
     * Reorder exercises
     */
    reorderExercise(fromIndex, toIndex) {
        const [movedExercise] = this.manager.currentExercises.splice(fromIndex, 1);
        this.manager.currentExercises.splice(toIndex, 0, movedExercise);
        this.renderRoutineTable();
    }
    
    /**
     * Clear current routine
     */
    async clearRoutine() {
        if (this.manager.currentExercises.length === 0 && !this.manager.editingRoutineName) return;
        
        const confirmed = await window.Modal.confirm('Clear Routine', 'Clear the current routine?');
        
        if (confirmed) {
            this.manager.currentExercises = [];
            this.manager.editingRoutineName = null;
            this.renderRoutineTable();
            
            const nameInput = document.getElementById('routineNameInput');
            if (nameInput) {
                nameInput.value = '';
                nameInput.style.borderColor = '';
                nameInput.style.background = '';
            }
            
            if (window.Toast) {
                window.Toast.info('Routine cleared');
            }
        }
    }
    
    /**
     * Load routine for editing - PRESERVES ALL 3 REP FIELDS WITH AUTO-FIX
     */
    loadRoutineForEditing(routine) {
        console.log('='.repeat(60));
        console.log('📋 LOADING ROUTINE FOR EDITING');
        console.log('   Routine:', routine.name || 'Unnamed');
        
        // Deep clone to preserve ALL fields
        const exercises = routine.exercises.map((ex, idx) => {
            console.log(`   Exercise ${idx}:`, JSON.stringify(ex, null, 2));
            
            // Create base exercise data
            const exerciseData = {
                exercise: ex.exercise,
                sets: parseInt(ex.sets),
                rest: parseInt(ex.rest) || 60
            };
            
            // 🔥 NEW 3-field format - ALWAYS use these field names
            if (ex.min_reps !== undefined && ex.max_reps !== undefined && ex.current_reps !== undefined) {
                exerciseData.min_reps = parseInt(ex.min_reps);
                exerciseData.max_reps = parseInt(ex.max_reps);
                exerciseData.current_reps = parseInt(ex.current_reps);
            }
            // Legacy format conversion (if old data exists)
            else if (ex.minReps !== undefined && ex.maxReps !== undefined) {
                exerciseData.min_reps = parseInt(ex.minReps);
                exerciseData.max_reps = parseInt(ex.maxReps);
                exerciseData.current_reps = parseInt(ex.minReps); // Default to minimum
                console.warn(`   ⚠️ Converted legacy camelCase: minReps=${ex.minReps}, maxReps=${ex.maxReps}`);
            }
            // Fallback - parse from reps string if exists
            else if (ex.reps) {
                const repsStr = String(ex.reps);
                if (repsStr.includes('-')) {
                    const parts = repsStr.split('-').map(s => parseInt(s.trim()));
                    exerciseData.min_reps = parts[0];
                    exerciseData.max_reps = parts[1];
                    exerciseData.current_reps = parts[0];
                    console.warn(`   ⚠️ Converted from string: "${repsStr}" → ${parts[0]}-${parts[1]}`);
                } else {
                    const singleValue = parseInt(repsStr);
                    exerciseData.min_reps = singleValue;
                    exerciseData.max_reps = singleValue;
                    exerciseData.current_reps = singleValue;
                    console.warn(`   ⚠️ Converted from single value: "${repsStr}" → ${singleValue}`);
                }
            }
            // 🔥 LAST RESORT: Missing rep data - use defaults and show warning
            else {
                exerciseData.min_reps = 8;
                exerciseData.max_reps = 12;
                exerciseData.current_reps = 8;
                console.error(`   ❌ NO REP DATA FOUND! Using defaults: 8-12 (current: 8)`);
                
                if (window.Toast) {
                    window.Toast.warning(`⚠️ ${ex.exercise}: Missing rep data. Please update!`);
                }
            }
            
            console.log(`     Final data:`, JSON.stringify(exerciseData, null, 2));
            return exerciseData;
        });
        
        // Replace the entire array
        this.manager.currentExercises = exercises;
        
        console.log('✅ Loaded exercises:', JSON.stringify(exercises, null, 2));
        console.log('='.repeat(60));
        
        this.renderRoutineTable();
        
        // Show info banner if any exercises had missing/converted data
        const hasMissingData = exercises.some(ex => 
            !routine.exercises.find(original => original.exercise === ex.exercise)?.min_reps
        );
        
        if (hasMissingData && window.Toast) {
            window.Toast.info('💡 Some exercises were missing rep data. Please review and save!', 5000);
        }
    }
    
    /**
     * Save routine - SAVES ALL 3 REP FIELDS
     */
    async saveRoutine() {
        console.log('='.repeat(60));
        console.log('💾 SAVE ROUTINE CALLED');
        
        const profileName = window.appState?.get('currentProfile');
        console.log('   Profile:', profileName);
        
        if (!profileName) {
            if (window.Toast) {
                window.Toast.warning('Please select a profile first');
            }
            return;
        }
        
        const nameInput = document.getElementById('routineNameInput');
        const name = nameInput?.value?.trim();
        console.log('   Routine name:', name);
        
        if (!name) {
            if (window.Toast) {
                window.Toast.warning('Please enter a routine name');
            }
            nameInput?.focus();
            return;
        }
        
        if (this.manager.currentExercises.length === 0) {
            if (window.Toast) {
                window.Toast.warning('Please add at least one exercise');
            }
            return;
        }
        
        console.log('   Exercises to save:');
        console.log(JSON.stringify(this.manager.currentExercises, null, 2));
        
        try {
            // Ensure all fields are present and valid
            const exercisesToSave = this.manager.currentExercises.map((ex) => ({
                exercise: ex.exercise,
                sets: parseInt(ex.sets),
                min_reps: parseInt(ex.min_reps),
                max_reps: parseInt(ex.max_reps),
                current_reps: parseInt(ex.current_reps),
                rest: parseInt(ex.rest)
            }));
            
            console.log('🔥 FINAL DATA TO SEND TO API:');
            console.log(JSON.stringify(exercisesToSave, null, 2));
            
            const result = await API.saveRoutine(profileName, name, exercisesToSave);
            
            if (result.success) {
                console.log('✅ API confirmed save successful');
                
                this.manager.currentExercises = [];
                this.manager.editingRoutineName = null;
                this.renderRoutineTable();
                
                if (nameInput) {
                    nameInput.value = '';
                    nameInput.style.borderColor = '';
                    nameInput.style.background = '';
                }
                
                await this.manager.refresh();
                
                if (window.Toast) {
                    window.Toast.success(`Routine "${name}" saved! ✅`);
                }
            } else {
                console.error('❌ API save failed:', result.error);
                if (window.Toast) {
                    window.Toast.error(result.error || 'Failed to save routine');
                }
            }
        } catch (error) {
            console.error('❌ Exception saving routine:', error);
            console.error('Stack:', error.stack);
            if (window.Toast) {
                window.Toast.error('Failed to save: ' + error.message);
            }
        }
        
        console.log('='.repeat(60));
    }
}