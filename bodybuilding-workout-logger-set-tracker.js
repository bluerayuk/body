// bodybuilding-workout-logger-set-tracker.js - Active Set Tracking Module
// Handles set completion, blinking indicators, auto-advancing to next set
// UPDATED: Professional orange pulse for active set with scale effect

class SetTracker {
    constructor() {
        // No persistent state needed
    }
    
    /**
     * Toggle set completion - visual feedback + advance to next set
     */
    toggleSetComplete(setId) {
        const checkbox = document.getElementById(`check_${setId}`);
        const container = document.getElementById(`set-container-${setId}`);
        
        if (checkbox && container) {
            if (checkbox.checked) {
                // Mark as complete - GREEN (success/done)
                container.style.borderColor = '#10b981';
                container.style.background = 'rgba(16, 185, 129, 0.1)';
                container.classList.remove('active-set');
                
                // Find and activate next uncompleted set
                this.activateNextSet();
            } else {
                // Unchecked - reset to neutral and make this the active set
                container.style.borderColor = '';
                container.style.background = '';
                
                // Remove active class from all sets first
                const allSets = document.querySelectorAll('[id^="set-container-"]');
                allSets.forEach(set => set.classList.remove('active-set'));
                
                // Make this set active
                container.classList.add('active-set');
                
                // Scroll into view
                container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Focus first input
                const firstInput = container.querySelector('input[type="number"]');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 300);
                }
            }
        }
    }
    
    /**
     * Find and activate the next uncompleted set
     */
    activateNextSet() {
        // Get all set containers
        const allSets = document.querySelectorAll('[id^="set-container-"]');
        
        // Find first uncompleted set
        for (const setContainer of allSets) {
            const setId = setContainer.id.replace('set-container-', '');
            const checkbox = document.getElementById(`check_${setId}`);
            
            if (checkbox && !checkbox.checked) {
                setContainer.classList.add('active-set');
                
                // Scroll into view
                setContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Focus first input
                const firstInput = setContainer.querySelector('input[type="number"]');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 300);
                }
                
                return;
            }
        }
        
        // If no uncompleted sets found, workout is done
        console.log('âœ… All sets completed!');
    }
    
    /**
     * Activate the first set when workout starts
     */
    activateFirstSet() {
        const firstSet = document.querySelector('[id^="set-container-"]');
        if (firstSet) {
            firstSet.classList.add('active-set');
            
            // Focus first input
            const firstInput = firstSet.querySelector('input[type="number"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 500);
            }
        }
    }
    
    /**
     * Add CSS for blinking set animation - PROFESSIONAL ORANGE with scale pulse
     */
    addBlinkingStyles() {
        if (!document.getElementById('set-blink-styles')) {
            const style = document.createElement('style');
            style.id = 'set-blink-styles';
            style.textContent = `
                @keyframes setGlow {
                    0%, 100% {
                        border-color: #f59e0b;
                        background: rgba(245, 158, 11, 0.15);
                        box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4), 0 4px 12px rgba(245, 158, 11, 0.2);
                        transform: scale(1);
                    }
                    50% {
                        border-color: #ea580c;
                        background: rgba(245, 158, 11, 0.25);
                        box-shadow: 0 0 0 8px rgba(245, 158, 11, 0), 0 6px 16px rgba(245, 158, 11, 0.3);
                        transform: scale(1.02);
                    }
                }
                
                .active-set {
                    animation: setGlow 1.5s ease-in-out infinite !important;
                    border-color: #f59e0b !important;
                    border-width: 3px !important;
                    background: rgba(245, 158, 11, 0.15) !important;
                    position: relative;
                    transition: all 0.3s ease;
                }
                
                .active-set::before {
                    content: '⚡ CURRENT SET';
                    position: absolute;
                    top: -24px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #f59e0b, #ea580c);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Remove blinking styles
     */
    removeBlinkingStyles() {
        const style = document.getElementById('set-blink-styles');
        if (style) {
            style.remove();
        }
    }
}

// Export
window.SetTracker = SetTracker;
window.setTracker = new SetTracker();

console.log('[JS] âœ… Set Tracker Module Loaded');