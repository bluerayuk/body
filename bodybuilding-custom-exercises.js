// bodybuilding-custom-exercises.js - COMPLETE FIXED VERSION

class CustomExerciseManager {
    constructor(bodybuildingManager) {
        this.manager = bodybuildingManager;
        this.currentExercises = {};
        this.currentModal = null;
        this.pyLog('🎯 CustomExerciseManager constructed');
    }
    
    /**
     * Log to Python console via API call
     */
    async pyLog(message) {
        console.log(message); // Browser console too
        try {
            if (typeof pywebview !== 'undefined' && pywebview.api && pywebview.api.js_log) {
                await pywebview.api.js_log(message);
            }
        } catch (e) {
            console.error('Failed to log to Python:', e);
        }
    }
    
    /**
     * Show modal to add custom exercise
     */
    async showAddCustomExerciseModal() {
        const profileName = window.appState?.get('currentProfile');
        
        if (!profileName) {
            Toast.warning('Please select a profile first');
            return;
        }
        
        const muscleGroups = await API.getMuscleGroups();
        
        new Modal({
            title: '➕ Add Custom Exercise',
            content: `
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">
                        Muscle Group
                    </label>
                    <select id="customExerciseMuscleGroup" style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 15px; font-family: inherit;">
                        <option value="">Select muscle group...</option>
                        ${muscleGroups.map(group => `<option value="${group}">${group}</option>`).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px;">
                        Exercise Name
                    </label>
                    <input type="text" 
                           id="customExerciseName" 
                           placeholder="e.g., My Custom Curl" 
                           style="width: 100%; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 15px; font-family: inherit;">
                </div>
                
                <div style="background: linear-gradient(135deg, #e0f2fe, #bae6fd); padding: 12px; border-radius: 8px; border-left: 4px solid #0284c7; margin-top: 15px;">
                    <div style="font-size: 12px; color: #0c4a6e; line-height: 1.4;">
                        <strong>💡 Note:</strong> Custom exercises are saved to your profile and can be deleted at any time.
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Add Exercise',
                    className: 'btn-success',
                    onClick: async (modal) => {
                        const muscleGroup = modal.getValue('customExerciseMuscleGroup')?.trim();
                        const exerciseName = modal.getValue('customExerciseName')?.trim();
                        
                        if (!muscleGroup) {
                            await window.Modal.alert('Error', 'Please select a muscle group');
                            return false;
                        }
                        
                        if (!exerciseName) {
                            await window.Modal.alert('Error', 'Please enter an exercise name');
                            return false;
                        }
                        
                        try {
                            const result = await API.addCustomExercise(profileName, muscleGroup, exerciseName);
                            
                            if (result.success) {
                                Toast.success(`✅ Added "${exerciseName}"`);
                                
                                const currentGroup = document.getElementById('muscleGroupSelect')?.value;
                                if (currentGroup === muscleGroup) {
                                    await this.manager.routineBuilder.loadExercises(muscleGroup);
                                }
                                
                                return true;
                            } else {
                                await window.Modal.alert('Error', result.error || 'Failed to add');
                                return false;
                            }
                        } catch (error) {
                            await this.pyLog('❌ Error adding: ' + error.message);
                            await window.Modal.alert('Error', error.message);
                            return false;
                        }
                    }
                },
                {
                    text: 'Cancel',
                    className: 'btn-danger'
                }
            ]
        });
        
        setTimeout(() => {
            document.getElementById('customExerciseMuscleGroup')?.focus();
        }, 100);
    }
    
    /**
     * Show manage modal - FIXED with inline onclick handlers
     */
    async showManageCustomExercisesModal(forceRefresh = false) {
        await this.pyLog('='.repeat(60));
        await this.pyLog('🗂️ showManageCustomExercisesModal called');
        await this.pyLog('='.repeat(60));
        
        const profileName = window.appState?.get('currentProfile');
        
        if (!profileName) {
            Toast.warning('Please select a profile first');
            return;
        }
        
        await this.pyLog('📋 Profile: ' + profileName);
        await this.pyLog('🔄 Force Refresh: ' + forceRefresh);
        
        if (forceRefresh) {
            await this.pyLog('🔥 FORCING cache clear...');
            API.invalidateCache('custom_exercises');
            API.invalidateCache('exercises');
        }
        
        const muscleGroups = await API.getMuscleGroups();
        await this.pyLog('💪 Loaded ' + muscleGroups.length + ' muscle groups');
        
        this.currentExercises = {};
        let hasCustomExercises = false;
        
        for (const group of muscleGroups) {
            try {
                if (forceRefresh) {
                    API.invalidateCache(`custom_exercises:${profileName}:${group}`);
                }
                
                const customs = await API.getCustomExercises(profileName, group);
                
                if (customs && customs.length > 0) {
                    await this.pyLog(`✅ ${group}: ${customs.length} exercises - ${JSON.stringify(customs)}`);
                    this.currentExercises[group] = customs;
                    hasCustomExercises = true;
                }
            } catch (error) {
                await this.pyLog(`❌ Error loading ${group}: ${error.message}`);
            }
        }
        
        await this.pyLog('📊 Has custom exercises: ' + hasCustomExercises);
        await this.pyLog('🎨 Building HTML content...');
        
        let content = '';
        
        if (!hasCustomExercises) {
            content = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 15px;">🏋️</div>
                    <div style="font-size: 16px; margin-bottom: 10px;">No custom exercises yet</div>
                    <div style="font-size: 13px;">Click "Add Custom Exercise" to create your own</div>
                </div>
            `;
            await this.pyLog('📝 No exercises - showing placeholder');
        } else {
            content = '<div style="max-height: 400px; overflow-y: auto;" id="customExercisesList">';
            
            let buttonCount = 0;
            
            Object.entries(this.currentExercises).forEach(([group, exercises]) => {
                content += `
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: 700; font-size: 15px; margin-bottom: 10px; color: var(--primary);">
                            ${group}
                        </div>
                `;
                
                exercises.forEach((exercise) => {
                    buttonCount++;
                    // Escape quotes for inline onclick
                    const escapedGroup = group.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    const escapedExercise = exercise.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    
                    content += `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-gray); border-radius: 6px; margin-bottom: 8px;">
                            <span style="font-size: 14px;">${exercise}</span>
                            <button class="btn btn-danger" 
                                    style="padding: 4px 10px; font-size: 12px;"
                                    onclick="window.bodybuilding.customExerciseManager.handleDeleteClick('${escapedGroup}', '${escapedExercise}')"
                                    type="button">
                                🗑️ Delete
                            </button>
                        </div>
                    `;
                });
                
                content += '</div>';
            });
            
            content += '</div>';
            
            await this.pyLog(`✅ Created HTML with ${buttonCount} delete buttons using inline onclick`);
        }
        
        content += `
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 10px 14px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 15px;">
                <div style="font-size: 12px; color: #92400e; line-height: 1.4;">
                    <strong>💡 Tip:</strong> Custom exercises are profile-specific. Click delete to remove.
                </div>
            </div>
        `;
        
        await this.pyLog('🎨 Creating Modal object...');
        
        try {
            this.currentModal = new Modal({
                title: '🗂️ Manage Custom Exercises',
                content: content,
                buttons: [
                    {
                        text: 'Close',
                        className: 'btn-primary'
                    }
                ]
            });
            
            await this.pyLog('✅ Modal created with inline onclick handlers - buttons ready immediately!');
        } catch (error) {
            await this.pyLog('❌ Modal creation failed: ' + error.message);
            return;
        }
        
        await this.pyLog('='.repeat(60));
    }
    
    /**
     * Handle delete click - called directly from inline onclick
     */
    async handleDeleteClick(muscleGroup, exerciseName) {
        await this.pyLog('🎯 handleDeleteClick START');
        await this.pyLog(`  Group: "${muscleGroup}", Exercise: "${exerciseName}"`);
        
        // Close the manage modal first
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                if (modalOverlay.parentNode) {
                    modalOverlay.parentNode.removeChild(modalOverlay);
                }
            }, 200);
        }
        
        // Wait for modal to close
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await this.pyLog('🔔 Showing confirmation dialog...');
        
        try {
            await this.pyLog('📞 Calling Modal.confirm...');
            await this.pyLog(`   window.Modal exists: ${typeof window.Modal !== 'undefined'}`);
            await this.pyLog(`   window.Modal.confirm exists: ${typeof window.Modal?.confirm === 'function'}`);
            
            const confirmed = await window.Modal.confirm(
                'Delete Exercise?',
                `Delete "${exerciseName}"?\n\nThis cannot be undone.`
            );
            
            await this.pyLog(`👤 User response received: ${confirmed ? 'CONFIRMED' : 'CANCELLED'}`);
            
            if (!confirmed) {
                await this.pyLog('❌ User cancelled - reopening manage modal');
                setTimeout(() => this.showManageCustomExercisesModal(false), 200);
                return;
            }
            
            await this.pyLog('✅ User confirmed - proceeding with delete');
            await this.handleDelete(muscleGroup, exerciseName);
            
        } catch (error) {
            await this.pyLog(`❌ ERROR in confirmation: ${error.message}`);
            await this.pyLog(`   Error stack: ${error.stack}`);
            Toast.error('Failed to show confirmation dialog: ' + error.message);
        }
    }
    
    /**
     * Handle delete - calls Python API
     */
    async handleDelete(muscleGroup, exerciseName) {
        await this.pyLog('='.repeat(60));
        await this.pyLog('🗑️ handleDelete START');
        
        const profileName = window.appState?.get('currentProfile');
        
        if (!profileName) {
            await this.pyLog('❌ No profile!');
            Toast.error('No profile selected');
            return;
        }
        
        await this.pyLog(`📋 Deleting: "${exerciseName}" from "${muscleGroup}" in profile "${profileName}"`);
        await this.pyLog('📡 Calling API.deleteCustomExercise...');
        
        try {
            const result = await API.deleteCustomExercise(profileName, muscleGroup, exerciseName);
            
            await this.pyLog('📥 API Response: ' + JSON.stringify(result));
            
            if (result && result.success) {
                await this.pyLog('✅ Python API confirmed success!');
                
                API.invalidateCache();
                
                const verifyCustoms = await API.getCustomExercises(profileName, muscleGroup);
                await this.pyLog(`🔍 Verify - ${muscleGroup}: ${JSON.stringify(verifyCustoms)}`);
                
                if (verifyCustoms && verifyCustoms.includes(exerciseName)) {
                    await this.pyLog('❌ BUG: Exercise still exists!');
                    Toast.error('⚠️ Delete failed');
                } else {
                    await this.pyLog('✅ Verification passed!');
                    Toast.success(`✅ Deleted "${exerciseName}"`);
                }
                
                const currentGroup = document.getElementById('muscleGroupSelect')?.value;
                if (currentGroup === muscleGroup) {
                    await this.manager.routineBuilder.loadExercises(muscleGroup);
                }
            } else {
                await this.pyLog('❌ API reported failure: ' + (result?.error || 'unknown'));
                Toast.error(result?.error || 'Delete failed');
            }
        } catch (error) {
            await this.pyLog('❌ EXCEPTION: ' + error.message);
            Toast.error('Delete failed: ' + error.message);
        }
        
        await this.pyLog('🔄 Reopening modal...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.showManageCustomExercisesModal(true);
        
        await this.pyLog('='.repeat(60));
    }
}

// Export
window.CustomExerciseManager = CustomExerciseManager;

console.log('[JS] ✅ Custom Exercise Manager Loaded');