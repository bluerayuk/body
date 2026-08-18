// drag-drop.js - Complete Drag and Drop for Weight Tracker Entries

class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.draggedIndex = null;
        this.sourceIndex = null;
    }
    
    /**
     * Initialize drag and drop for weight history entries
     */
    initWeightHistory(container) {
        if (!container) {
            console.warn('⚠️ Container not found for drag-drop initialization');
            return;
        }
        
        const entries = container.querySelectorAll('.weight-entry');
        
        if (entries.length === 0) {
            console.log('ℹ️ No weight entries to make draggable');
            return;
        }
        
        entries.forEach((entry, index) => {
            // Make draggable
            entry.draggable = true;
            entry.dataset.originalIndex = entry.dataset.index; // Store original index
            entry.classList.add('draggable-row');
            
            // Add drag handle if not exists
            if (!entry.querySelector('.drag-handle')) {
                const contentDiv = entry.querySelector('.weight-entry-content');
                if (contentDiv) {
                    const handle = document.createElement('div');
                    handle.className = 'drag-handle';
                    handle.innerHTML = '⋮⋮';
                    handle.style.cssText = `
                        cursor: grab;
                        padding: 0 8px;
                        margin-right: 8px;
                        opacity: 0.5;
                        font-size: 16px;
                        line-height: 1;
                        transition: all 0.2s ease;
                        user-select: none;
                    `;
                    contentDiv.insertBefore(handle, contentDiv.firstChild);
                }
            }
            
            // Event listeners
            entry.addEventListener('dragstart', (e) => this.handleDragStart(e, entry));
            entry.addEventListener('dragend', (e) => this.handleDragEnd(e, entry));
            entry.addEventListener('dragover', (e) => this.handleDragOver(e, entry));
            entry.addEventListener('drop', (e) => this.handleDrop(e, entry));
            entry.addEventListener('dragleave', (e) => this.handleDragLeave(e, entry));
            
            // Hover effects for drag handle
            entry.addEventListener('mouseenter', () => {
                const handle = entry.querySelector('.drag-handle');
                if (handle) {
                    handle.style.opacity = '1';
                    handle.style.transform = 'scale(1.1)';
                }
            });
            
            entry.addEventListener('mouseleave', () => {
                const handle = entry.querySelector('.drag-handle');
                if (handle && !entry.classList.contains('dragging')) {
                    handle.style.opacity = '0.5';
                    handle.style.transform = 'scale(1)';
                }
            });
        });
        
        console.log(`✅ Drag-drop initialized for ${entries.length} entries`);
    }
    
    handleDragStart(e, element) {
        this.draggedElement = element;
        this.sourceIndex = parseInt(element.dataset.originalIndex);
        
        element.classList.add('dragging');
        
        // Set drag data
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', element.innerHTML);
        
        // Change cursor
        const handle = element.querySelector('.drag-handle');
        if (handle) {
            handle.style.cursor = 'grabbing';
        }
        
        console.log(`🎯 Started dragging entry at index ${this.sourceIndex}`);
    }
    
    handleDragEnd(e, element) {
        element.classList.remove('dragging');
        
        // Reset cursor
        const handle = element.querySelector('.drag-handle');
        if (handle) {
            handle.style.cursor = 'grab';
        }
        
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over, .drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        });
        
        this.draggedElement = null;
        this.sourceIndex = null;
        
        console.log('🎯 Drag ended');
    }
    
    handleDragOver(e, element) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        
        e.dataTransfer.dropEffect = 'move';
        
        if (this.draggedElement === element) {
            return false;
        }
        
        // Determine if we're dropping above or below
        const rect = element.getBoundingClientRect();
        const midpoint = rect.top + (rect.height / 2);
        const isAbove = e.clientY < midpoint;
        
        // Remove previous indicators
        element.classList.remove('drag-over-top', 'drag-over-bottom');
        
        // Add new indicator
        if (isAbove) {
            element.classList.add('drag-over-top');
        } else {
            element.classList.add('drag-over-bottom');
        }
        
        return false;
    }
    
    handleDragLeave(e, element) {
        // Only remove if we're actually leaving the element
        const rect = element.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            element.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        }
    }
    
    async handleDrop(e, element) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        e.preventDefault();
        
        element.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        
        if (this.draggedElement === element) {
            return false;
        }
        
        const targetIndex = parseInt(element.dataset.originalIndex);
        
        if (this.sourceIndex === targetIndex) {
            return false;
        }
        
        // Determine if dropping above or below
        const rect = element.getBoundingClientRect();
        const midpoint = rect.top + (rect.height / 2);
        const isAbove = e.clientY < midpoint;
        
        console.log(`📦 Drop: source=${this.sourceIndex}, target=${targetIndex}, isAbove=${isAbove}`);
        
        // Reorder the weight log
        await this.reorderWeightLog(this.sourceIndex, targetIndex, isAbove);
        
        return false;
    }
    
    async reorderWeightLog(fromIndex, toIndex, insertBefore) {
        const profileName = window.appState?.get('currentProfile');
        if (!profileName) {
            console.error('❌ No profile selected');
            return;
        }
        
        try {
            console.log(`🔄 Reordering: from ${fromIndex} to ${toIndex} (insertBefore=${insertBefore})`);
            
            // Get current weight log
            const weightLog = await API.getWeightLog(profileName, true);
            
            if (!weightLog || weightLog.length === 0) {
                console.error('❌ No weight log found');
                return;
            }
            
            // Create a copy to work with
            const newLog = [...weightLog];
            
            // Remove the dragged item
            const [movedEntry] = newLog.splice(fromIndex, 1);
            
            // Calculate new position
            let newIndex = toIndex;
            
            // If we're moving down and inserting after
            if (fromIndex < toIndex && !insertBefore) {
                newIndex = toIndex; // No adjustment needed
            }
            // If we're moving down and inserting before
            else if (fromIndex < toIndex && insertBefore) {
                newIndex = toIndex - 1;
            }
            // If we're moving up and inserting before
            else if (fromIndex > toIndex && insertBefore) {
                newIndex = toIndex;
            }
            // If we're moving up and inserting after
            else if (fromIndex > toIndex && !insertBefore) {
                newIndex = toIndex + 1;
            }
            
            // Insert at new position
            newLog.splice(newIndex, 0, movedEntry);
            
            console.log(`📊 New order: moved from ${fromIndex} to ${newIndex}`);
            
            // Update profile with reordered log
            const profile = await API.getProfile(profileName);
            if (!profile) {
                console.error('❌ Profile not found');
                return;
            }
            
            profile.weight_log = newLog;
            
            const result = await API.updateProfile(profileName, profile);
            
            if (result.success) {
                console.log('✅ Weight log reordered successfully');
                
                // Invalidate cache and refresh
                API.invalidateCache(`weight_log:${profileName}`);
                API.invalidateCache(`weight_stats:${profileName}`);
                
                if (window.weightTracker) {
                    await window.weightTracker.refresh(true);
                }
                
                if (window.Toast) {
                    window.Toast.success('Entry reordered 🔄');
                }
            } else {
                console.error('❌ Failed to update profile:', result.error);
                if (window.Toast) {
                    window.Toast.error('Failed to reorder: ' + result.error);
                }
            }
        } catch (error) {
            console.error('❌ Error reordering weight log:', error);
            if (window.Toast) {
                window.Toast.error('Failed to reorder: ' + error.message);
            }
        }
    }
    
    /**
     * Cleanup drag and drop
     */
    cleanup(container) {
        if (!container) return;
        
        const entries = container.querySelectorAll('.weight-entry');
        entries.forEach(entry => {
            entry.draggable = false;
            entry.classList.remove('draggable-row');
            
            const handle = entry.querySelector('.drag-handle');
            if (handle) {
                handle.remove();
            }
        });
        
        console.log('🧹 Drag-drop cleaned up');
    }
}

// Create global instance
window.dragDropManager = new DragDropManager();

// Register with init manager
if (window.initManager) {
    window.initManager.register('dragdrop', () => {
        console.log('🎯 Drag-drop manager initialized');
        return () => {
            const historyList = document.getElementById('weightHistoryList');
            if (historyList && window.dragDropManager) {
                window.dragDropManager.cleanup(historyList);
            }
            console.log('🧹 Drag-drop manager cleaned up');
        };
    });
}