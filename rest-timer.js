// rest-timer.js - Individual Rest Timers - WORKOUT TAB ONLY
// ⏱️ Floating timer only visible when on workout tab
// ✅ Automatically shows/hides based on active tab

class RestTimer {
    constructor() {
        this.floatingTimer = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.audioContext = null;
        
        // Track all active timers
        this.activeTimers = new Map();
        this.timerIdCounter = 0;
    }
    
    init() {
        console.log('⏱️ Initializing Individual Rest Timers...');
        
        // Create floating timer window
        this.createFloatingTimer();
        
        // Listen for tab changes to show/hide timer
        this.setupTabChangeListener();
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) {
                    console.warn('Audio context not available');
                }
            }
        }, { once: true });
        
        // Monitor checkbox changes to auto-update rest timer buttons
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.id && e.target.id.startsWith('check_')) {
                console.log('🔄 Checkbox changed, updating rest timer buttons...');
                setTimeout(() => this.updateRestTimerButtons(), 100);
            }
        });
        
        console.log('✅ Individual Rest Timers initialized');
    }
    
    /**
     * 🔥 NEW: Check if workout tab is currently active
     */
    isWorkoutTabActive() {
        const workoutTab = document.querySelector('.nav-tab[data-tab="workout"]');
        return workoutTab && workoutTab.classList.contains('active');
    }
    
    /**
     * 🔥 NEW: Setup listener for tab changes to show/hide timer
     */
    setupTabChangeListener() {
        // Listen for tab button clicks
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                // Small delay to let tab switch complete
                setTimeout(() => {
                    this.updateTimerVisibility();
                }, 100);
            });
        });
        
        // Also listen for state changes if using state manager
        if (window.appState) {
            window.appState.subscribe('ui.currentTab', () => {
                this.updateTimerVisibility();
            });
        }
    }
    
    /**
     * 🔥 NEW: Update timer visibility based on active tab
     */
    updateTimerVisibility() {
        if (!this.floatingTimer) return;
        
        const isWorkoutTab = this.isWorkoutTabActive();
        
        if (isWorkoutTab) {
            // Show timer on workout tab
            this.floatingTimer.style.display = 'flex';
            console.log('✅ Rest timer visible (workout tab active)');
        } else {
            // Hide timer on other tabs
            this.floatingTimer.style.display = 'none';
            console.log('🔕 Rest timer hidden (not on workout tab)');
        }
    }
    
    /**
     * Create floating timer window (bottom-right corner)
     * Initially hidden, shown only on workout tab
     */
    createFloatingTimer() {
        // Remove existing if any
        const existing = document.getElementById('floatingRestTimer');
        if (existing) existing.remove();
        
        const timer = document.createElement('div');
        timer.id = 'floatingRestTimer';
        timer.className = 'floating-timer idle';
        
        // Check initial tab state
        const isWorkoutTab = this.isWorkoutTabActive();
        
        timer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9998;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.95), rgba(118, 75, 162, 0.95));
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
            padding: 12px 16px;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            cursor: move;
            user-select: none;
            width: 90px;
            height: 60px;
            display: ${isWorkoutTab ? 'flex' : 'none'};
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        timer.innerHTML = `
            <div id="floatingTimerContent" style="text-align: center; width: 100%;">
                <!-- Idle state -->
                <div id="timerIdle" style="display: block;">
                    <div style="font-size: 11px; color: rgba(255,255,255,0.8); margin-bottom: 4px; font-weight: 600;">⏱️ REST</div>
                    <div style="font-size: 20px; color: white; font-weight: 800; letter-spacing: 1px; font-variant-numeric: tabular-nums;">00:00</div>
                </div>
                
                <!-- Running state -->
                <div id="timerRunning" style="display: none;">
                    <div style="font-size: 10px; color: rgba(255,255,255,0.8); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">⏱️ REST TIMERS</div>
                    <div id="floatingTimerDisplay" style="font-size: 36px; color: white; font-weight: 800; letter-spacing: 2px; margin-bottom: 10px; font-variant-numeric: tabular-nums;">00:00</div>
                    <div id="floatingTimerStatus" style="font-size: 10px; color: rgba(255,255,255,0.8); margin-bottom: 10px; font-weight: 600;">Ready</div>
                    <div style="display: flex; gap: 6px; justify-content: center;">
                        <button id="floatingStopAllBtn" style="background: rgba(239, 68, 68, 0.9); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 600;" type="button">⏹️ Stop All</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(timer);
        this.floatingTimer = timer;
        
        // Setup drag functionality
        this.setupDragHandlers();
        
        // Setup stop all button
        const stopAllBtn = document.getElementById('floatingStopAllBtn');
        if (stopAllBtn) {
            stopAllBtn.addEventListener('click', () => this.stopAllTimers());
        }
        
        // Hover effects (only when visible)
        timer.addEventListener('mouseenter', () => {
            if (this.activeTimers.size === 0) {
                timer.style.transform = 'scale(1.05) translateY(-2px)';
                timer.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.5)';
            }
        });
        
        timer.addEventListener('mouseleave', () => {
            if (this.activeTimers.size === 0 && !this.isDragging) {
                timer.style.transform = 'scale(1) translateY(0)';
                timer.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
            }
        });
        
        console.log(`✅ Floating timer created (visible: ${isWorkoutTab})`);
    }
    
    /**
     * Setup drag handlers for floating timer
     */
    setupDragHandlers() {
        const timer = this.floatingTimer;
        
        timer.addEventListener('mousedown', (e) => {
            // Only drag if clicking on the timer itself, not buttons
            if (e.target.tagName === 'BUTTON') return;
            
            this.isDragging = true;
            const rect = timer.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            timer.style.cursor = 'grabbing';
            timer.style.transition = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            // Keep within viewport bounds
            const maxX = window.innerWidth - timer.offsetWidth;
            const maxY = window.innerHeight - timer.offsetHeight;
            
            const boundedX = Math.max(0, Math.min(x, maxX));
            const boundedY = Math.max(0, Math.min(y, maxY));
            
            timer.style.left = `${boundedX}px`;
            timer.style.top = `${boundedY}px`;
            timer.style.right = 'auto';
            timer.style.bottom = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                timer.style.cursor = 'move';
                timer.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }
        });
    }
    
    /**
     * Check and update all rest timer buttons based on exercise completion status
     */
    updateRestTimerButtons() {
        const restButtons = document.querySelectorAll('.inline-rest-btn:not(.inline-rest-countdown)');
        
        restButtons.forEach(button => {
            const exerciseRow = button.closest('tr');
            if (!exerciseRow) return;
            
            const setsCell = exerciseRow.querySelector('td:last-child');
            if (!setsCell) return;
            
            const setContainers = setsCell.querySelectorAll('[id^="set-container-"]');
            if (setContainers.length === 0) return;
            
            let allSetsCompleted = true;
            
            setContainers.forEach(container => {
                const setId = container.id.replace('set-container-', '');
                const checkbox = document.getElementById(`check_${setId}`);
                const isCompleted = checkbox && checkbox.checked;
                
                if (!isCompleted) {
                    allSetsCompleted = false;
                }
            });
            
            // Gray out if all sets completed, restore if not
            if (allSetsCompleted) {
                button.style.background = 'linear-gradient(135deg, #94a3b8, #64748b)';
                button.style.cursor = 'not-allowed';
                button.style.opacity = '0.5';
                button.disabled = true;
            } else {
                button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                button.style.cursor = 'pointer';
                button.style.opacity = '1';
                button.disabled = false;
            }
        });
    }
    
    /**
     * Start individual timer from inline button (public API)
     */
    startFromInline(seconds, exerciseName, buttonElement) {
        // Check if button is disabled (all sets complete)
        if (buttonElement.disabled) {
            if (window.Toast) {
                window.Toast.info('✅ All sets complete! Move to next exercise');
            }
            return;
        }
        
        // Check if this exercise has ANY active or completed sets
        const exerciseRow = buttonElement.closest('tr');
        if (exerciseRow) {
            const setsCell = exerciseRow.querySelector('td:last-child');
            if (setsCell) {
                const setContainers = setsCell.querySelectorAll('[id^="set-container-"]');
                
                let hasActiveSet = false;
                let allSetsCompleted = true;
                let hasAnyCompletedSet = false;
                
                setContainers.forEach(container => {
                    const isActive = container.classList.contains('active-set');
                    const setId = container.id.replace('set-container-', '');
                    const checkbox = document.getElementById(`check_${setId}`);
                    const isCompleted = checkbox && checkbox.checked;
                    
                    if (isActive) {
                        hasActiveSet = true;
                    }
                    
                    if (isCompleted) {
                        hasAnyCompletedSet = true;
                    } else {
                        allSetsCompleted = false;
                    }
                });
                
                // Block if NO sets are active or completed yet
                if (!hasActiveSet && !hasAnyCompletedSet) {
                    if (window.Toast) {
                        window.Toast.warning('⚠️ Complete at least one set before starting rest timer');
                    }
                    return;
                }
            }
        }
        
        console.log(`⏱️ Starting individual timer: ${seconds}s for ${exerciseName}`);
        
        // Create unique timer ID
        const timerId = ++this.timerIdCounter;
        
        // Get button's rest time for restoration
        const restSeconds = parseInt(buttonElement.dataset.restSeconds) || seconds;
        
        // Replace button with countdown display
        const countdown = this.createCountdownElement(timerId, seconds, restSeconds, exerciseName, buttonElement);
        
        // Start the individual timer
        this.startIndividualTimer(timerId, seconds, countdown, exerciseName, restSeconds, buttonElement.parentNode);
        
        // Update floating timer to show active timers
        this.updateFloatingTimer();
        
        // 🔥 ENSURE timer is visible when starting
        this.updateTimerVisibility();
        
        if (window.Toast) {
            window.Toast.success(`⏱️ ${exerciseName}: ${this.formatDuration(seconds)} rest started`);
        }
    }
    
    /**
     * Create countdown display element
     */
    createCountdownElement(timerId, seconds, restSeconds, exerciseName, buttonElement) {
        const countdown = document.createElement('button');
        countdown.className = 'inline-rest-btn inline-rest-countdown';
        countdown.dataset.timerId = timerId;
        countdown.dataset.restSeconds = restSeconds;
        countdown.dataset.exerciseName = exerciseName;
        countdown.type = 'button';
        
        const computedStyle = window.getComputedStyle(buttonElement);
        const buttonWidth = buttonElement.offsetWidth;
        const buttonHeight = buttonElement.offsetHeight;
        
        countdown.style.cssText = `
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0 auto;
            justify-content: center;
            position: relative;
            width: ${buttonWidth}px;
            height: ${buttonHeight}px;
            box-sizing: border-box;
        `;
        
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        countdown.innerHTML = `
            <span class="timer-display" style="font-variant-numeric: tabular-nums; font-weight: 700; width: 100%; text-align: center;">${timeStr}</span>
        `;
        
        // Click to stop timer
        countdown.addEventListener('click', (e) => {
            e.stopPropagation();
            this.stopTimer(timerId);
        });
        
        // Hover effects
        countdown.addEventListener('mouseenter', () => {
            countdown.style.transform = 'translateY(-2px)';
            countdown.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        });
        
        countdown.addEventListener('mouseleave', () => {
            countdown.style.transform = 'translateY(0)';
            countdown.style.boxShadow = 'none';
        });
        
        // Replace button with countdown
        buttonElement.parentNode.replaceChild(countdown, buttonElement);
        
        return countdown;
    }
    
    /**
     * Start an individual timer with its own interval
     */
    startIndividualTimer(timerId, totalSeconds, element, exerciseName, restSeconds, parentNode) {
        const timerData = {
            id: timerId,
            remaining: totalSeconds,
            total: totalSeconds,
            element: element,
            exerciseName: exerciseName,
            restSeconds: restSeconds,
            parentNode: parentNode,
            hasAlerted: false,
            interval: null
        };
        
        // Start countdown interval
        timerData.interval = setInterval(() => {
            timerData.remaining--;
            
            // Update the countdown display
            this.updateCountdownDisplay(timerData);
            
            // Check for completion
            if (timerData.remaining <= 0) {
                this.completeTimer(timerId);
            }
            // Alert at 10 seconds
            else if (timerData.remaining === 10 && !timerData.hasAlerted) {
                timerData.hasAlerted = true;
                this.playBeep(800, 0.1);
            }
            // Alert at 5 seconds
            else if (timerData.remaining === 5) {
                this.playBeep(900, 0.1);
            }
            // Alert at 3, 2, 1
            else if (timerData.remaining <= 3 && timerData.remaining > 0) {
                this.playBeep(1000, 0.15);
            }
            
            // Update floating timer
            this.updateFloatingTimer();
        }, 1000);
        
        // Store timer
        this.activeTimers.set(timerId, timerData);
        
        console.log(`✅ Timer ${timerId} started for ${exerciseName}`);
    }
    
    /**
     * Update individual countdown display
     */
    updateCountdownDisplay(timerData) {
        if (!timerData.element || !document.body.contains(timerData.element)) {
            console.warn(`⚠️ Timer ${timerData.id} element no longer in DOM`);
            this.stopTimer(timerData.id);
            return;
        }
        
        const minutes = Math.floor(timerData.remaining / 60);
        const seconds = timerData.remaining % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const displaySpan = timerData.element.querySelector('.timer-display');
        if (displaySpan) {
            displaySpan.textContent = timeStr;
        }
        
        // Color coding
        if (timerData.remaining <= 10 && timerData.remaining > 0) {
            timerData.element.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else if (timerData.remaining === 0) {
            timerData.element.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else {
            timerData.element.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
    }
    
    /**
     * Complete a timer
     */
    completeTimer(timerId) {
        const timerData = this.activeTimers.get(timerId);
        if (!timerData) return;
        
        console.log(`✅ Timer ${timerId} complete: ${timerData.exerciseName}`);
        
        // Clear interval
        if (timerData.interval) {
            clearInterval(timerData.interval);
        }
        
        // Play completion sound
        this.playCompletionSound();
        
        // Show completion message
        if (window.Toast) {
            window.Toast.success(`✅ ${timerData.exerciseName} rest complete! Time for next set 💪`);
        }
        
        // Restore button after 2 seconds
        setTimeout(() => {
            this.restoreButton(timerData);
            this.activeTimers.delete(timerId);
            this.updateFloatingTimer();
            this.updateRestTimerButtons();
        }, 2000);
    }
    
    /**
     * Stop a specific timer
     */
    stopTimer(timerId) {
        const timerData = this.activeTimers.get(timerId);
        if (!timerData) return;
        
        console.log(`⏹️ Stopping timer ${timerId}: ${timerData.exerciseName}`);
        
        if (timerData.interval) {
            clearInterval(timerData.interval);
        }
        
        this.restoreButton(timerData);
        this.activeTimers.delete(timerId);
        this.updateFloatingTimer();
        this.updateRestTimerButtons();
        
        if (window.Toast) {
            window.Toast.info(`⏹️ ${timerData.exerciseName} timer stopped`);
        }
    }
    
    /**
     * Stop all active timers
     */
    stopAllTimers() {
        console.log(`⏹️ Stopping all ${this.activeTimers.size} timers`);
        
        this.activeTimers.forEach((timerData, timerId) => {
            if (timerData.interval) {
                clearInterval(timerData.interval);
            }
            this.restoreButton(timerData);
        });
        
        this.activeTimers.clear();
        this.updateFloatingTimer();
        
        if (window.Toast) {
            window.Toast.info('⏹️ All timers stopped');
        }
    }
    
    /**
     * Restore original button from countdown
     */
    restoreButton(timerData) {
        if (!timerData.element || !document.body.contains(timerData.element)) {
            return;
        }
        
        const btn = document.createElement('button');
        btn.className = 'inline-rest-btn';
        btn.dataset.restSeconds = timerData.restSeconds;
        btn.type = 'button';
        btn.style.cssText = `
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0 auto;
        `;
        
        btn.innerHTML = `
            <span style="font-size: 16px;">⏱️</span>
            <span>${this.formatDuration(timerData.restSeconds)}</span>
        `;
        
        btn.onclick = () => window.restTimer.startFromInline(timerData.restSeconds, timerData.exerciseName, btn);
        
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        });
        
        timerData.element.parentNode.replaceChild(btn, timerData.element);
    }
    
    /**
     * Update floating timer display
     */
    updateFloatingTimer() {
        if (!this.floatingTimer) return;
        
        const idleDiv = document.getElementById('timerIdle');
        const runningDiv = document.getElementById('timerRunning');
        const statusEl = document.getElementById('floatingTimerStatus');
        const displayEl = document.getElementById('floatingTimerDisplay');
        
        if (this.activeTimers.size === 0) {
            // Collapse to idle state
            this.floatingTimer.style.width = '90px';
            this.floatingTimer.style.height = '60px';
            this.floatingTimer.style.padding = '12px 16px';
            if (idleDiv) idleDiv.style.display = 'block';
            if (runningDiv) runningDiv.style.display = 'none';
        } else {
            // Expand and show active timers
            this.floatingTimer.style.width = '180px';
            this.floatingTimer.style.height = '140px';
            this.floatingTimer.style.padding = '16px';
            if (idleDiv) idleDiv.style.display = 'none';
            if (runningDiv) runningDiv.style.display = 'block';
            
            if (statusEl) {
                statusEl.textContent = `${this.activeTimers.size} timer${this.activeTimers.size !== 1 ? 's' : ''} active`;
            }
            
            // Show shortest remaining time
            let shortestTime = Infinity;
            this.activeTimers.forEach(timer => {
                if (timer.remaining < shortestTime) {
                    shortestTime = timer.remaining;
                }
            });
            
            if (displayEl && shortestTime !== Infinity) {
                const minutes = Math.floor(shortestTime / 60);
                const seconds = shortestTime % 60;
                displayEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Color coding
                if (shortestTime <= 10 && shortestTime > 0) {
                    displayEl.style.color = '#fbbf24';
                } else if (shortestTime === 0) {
                    displayEl.style.color = '#10b981';
                } else {
                    displayEl.style.color = 'white';
                }
            }
        }
    }
    
    /**
     * Play beep sound
     */
    playBeep(frequency, duration) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Could not play beep:', e);
        }
    }
    
    /**
     * Play completion sound
     */
    playCompletionSound() {
        if (!this.audioContext) return;
        
        try {
            const frequencies = [523.25, 659.25, 783.99];
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, index * 100);
            });
        } catch (e) {
            console.warn('Could not play completion sound:', e);
        }
    }
    
    /**
     * Format duration for display
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
     * Cleanup all timers and remove floating window
     */
    cleanup() {
        console.log('🧹 Cleaning up Rest Timers...');
        
        this.activeTimers.forEach((timerData) => {
            if (timerData.interval) {
                clearInterval(timerData.interval);
            }
        });
        this.activeTimers.clear();
        
        if (this.floatingTimer && this.floatingTimer.parentNode) {
            this.floatingTimer.parentNode.removeChild(this.floatingTimer);
        }
        this.floatingTimer = null;
        
        console.log('✅ Rest Timers cleaned up');
    }
}

// Create global instance
window.restTimer = new RestTimer();

// Export the update function globally
window.updateRestTimerButtons = () => {
    if (window.restTimer) {
        window.restTimer.updateRestTimerButtons();
    }
};

// Register with init manager
if (window.initManager) {
    window.initManager.register('restTimer', () => {
        window.restTimer.init();
        return () => window.restTimer.cleanup();
    });
}

console.log('[JS] ✅ Individual Rest Timer System Loaded - Workout Tab Only Version');