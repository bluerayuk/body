// workout-completion-celebration.js - Epic Workout Completion Celebration 🎉

class WorkoutCelebration {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
    }
    
    /**
     * Main celebration function - called when workout is completed
     */
    celebrate(routineName, stats) {
        console.log('🎉 CELEBRATING WORKOUT COMPLETION!');
        console.log('   Routine:', routineName);
        console.log('   Stats:', stats);
        
        // Play victory sound
        this.playVictorySound();
        
        // Show epic modal with confetti
        this.showCelebrationModal(routineName, stats);
    }
    
    /**
     * Show celebration modal with stats and confetti
     */
    showCelebrationModal(routineName, stats) {
        // Create modal with celebration content
        const modal = new Modal({
            title: '🎉 WORKOUT COMPLETE! 🎉',
            content: this.buildCelebrationContent(routineName, stats),
            width: '500px',
            buttons: [
                {
                    text: '💪 FINISH',
                    className: 'btn-success',
                    onClick: () => true
                }
            ],
            className: 'celebration-modal'
        });
        
        // Add emoji font support to modal
        setTimeout(() => {
            const modalContainer = document.querySelector('.celebration-modal .modal-container');
            if (modalContainer) {
                modalContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif";
            }
        }, 50);
        
        // Add confetti effect
        setTimeout(() => {
            this.triggerConfetti();
        }, 100);
        
        // Add celebration styles
        this.addCelebrationStyles();
    }
    
    /**
     * Build the celebration content HTML
     */
    buildCelebrationContent(routineName, stats) {
        const isDark = document.documentElement.classList.contains('dark-mode');
        const textColor = isDark ? '#f1f5f9' : '#1e293b';
        
        return `
            <div style="text-align: center; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;">
                <!-- Victory Icon -->
                <div style="font-size: 80px; margin-bottom: 20px; animation: victoryPulse 1s ease-in-out infinite; line-height: 1;">
                    🏆
                </div>
                
                <!-- Routine Name -->
                <h2 style="font-size: 24px; font-weight: 800; color: var(--primary); margin-bottom: 15px; letter-spacing: -0.02em;">
                    ${routineName}
                </h2>
                
                <!-- Motivational Message -->
                <p style="font-size: 18px; font-weight: 600; color: var(--success); margin-bottom: 25px;">
                    ${this.getMotivationalMessage()}
                </p>
                
                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px;">
                    <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 15px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                        <div style="font-size: 32px; font-weight: 800; color: #1e40af; margin-bottom: 5px; font-variant-numeric: tabular-nums;">${stats.sets}</div>
                        <div style="font-size: 13px; font-weight: 600; color: #1e40af; opacity: 0.8;">SETS</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); padding: 15px; border-radius: 12px; border-left: 4px solid #10b981;">
                        <div style="font-size: 32px; font-weight: 800; color: #065f46; margin-bottom: 5px; font-variant-numeric: tabular-nums;">${stats.exercises}</div>
                        <div style="font-size: 13px; font-weight: 600; color: #065f46; opacity: 0.8;">EXERCISES</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 15px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                        <div style="font-size: 32px; font-weight: 800; color: #92400e; margin-bottom: 5px; font-variant-numeric: tabular-nums;">${stats.duration}</div>
                        <div style="font-size: 13px; font-weight: 600; color: #92400e; opacity: 0.8;">DURATION</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #fce7f3, #fbcfe8); padding: 15px; border-radius: 12px; border-left: 4px solid #ec4899;">
                        <div style="font-size: 32px; font-weight: 800; color: #831843; margin-bottom: 5px; font-variant-numeric: tabular-nums;">${stats.volume}kg</div>
                        <div style="font-size: 13px; font-weight: 600; color: #831843; opacity: 0.8;">VOLUME</div>
                    </div>
                </div>
                
                <!-- Progress Message -->
                <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); padding: 15px; border-radius: 10px; border: 2px solid var(--primary);">
                    <p style="font-size: 14px; line-height: 1.6; color: ${textColor}; margin: 0;">
                        <strong style="font-size: 16px;">💪 Keep pushing forward!</strong><br>
                        Every workout brings you closer to your goals. Stay consistent, stay strong!
                    </p>
                </div>
            </div>
        `;
    }
    
    /**
     * Get a random motivational message
     */
    getMotivationalMessage() {
        const messages = [
            'BEAST MODE ACTIVATED! 🔥',
            'ANOTHER ONE IN THE BOOKS! 💯',
            'YOU\'RE A MACHINE! ⚡',
            'CRUSHING IT! 💪',
            'STRENGTH LEVEL UP! 📈',
            'UNSTOPPABLE! 🚀',
            'GAINS SECURED! 💎',
            'LEGEND STATUS! 👑',
            'IRON WARRIOR! ⚔️',
            'CONSISTENCY WINS! 🏆'
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    /**
     * Play victory sound using Web Audio API
     */
    playVictorySound() {
        try {
            // Initialize audio context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (this.isPlaying) return;
            this.isPlaying = true;
            
            // Play ascending victory fanfare
            const now = this.audioContext.currentTime;
            
            // Notes for victory fanfare (C major chord progression)
            const notes = [
                { freq: 523.25, time: 0, duration: 0.15 },      // C5
                { freq: 659.25, time: 0.15, duration: 0.15 },   // E5
                { freq: 783.99, time: 0.3, duration: 0.15 },    // G5
                { freq: 1046.50, time: 0.45, duration: 0.4 }    // C6 (hold)
            ];
            
            notes.forEach(note => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.value = note.freq;
                
                // Envelope
                gainNode.gain.setValueAtTime(0, now + note.time);
                gainNode.gain.linearRampToValueAtTime(0.3, now + note.time + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);
                
                oscillator.start(now + note.time);
                oscillator.stop(now + note.time + note.duration);
            });
            
            // Reset playing flag after sound completes
            setTimeout(() => {
                this.isPlaying = false;
            }, 1000);
            
        } catch (error) {
            console.warn('Could not play celebration sound:', error);
            this.isPlaying = false;
        }
    }
    
    /**
     * Trigger confetti animation
     */
    triggerConfetti() {
        const modalOverlay = document.querySelector('.modal-overlay.celebration-modal');
        if (!modalOverlay) return;
        
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            z-index: 1;
        `;
        
        modalOverlay.appendChild(confettiContainer);
        
        // Create confetti pieces
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'];
        const confettiCount = 50;
        
        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                this.createConfettiPiece(confettiContainer, colors);
            }, i * 30);
        }
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 4000);
    }
    
    /**
     * Create individual confetti piece
     */
    createConfettiPiece(container, colors) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const startX = Math.random() * 100;
        const duration = Math.random() * 2 + 2;
        const delay = Math.random() * 0.5;
        
        confetti.style.cssText = `
            position: absolute;
            top: -20px;
            left: ${startX}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            opacity: 0.8;
            animation: confettiFall ${duration}s ease-out ${delay}s forwards;
            transform: rotate(${Math.random() * 360}deg);
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        `;
        
        container.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, (duration + delay) * 1000);
    }
    
    /**
     * Add celebration animation styles
     */
    addCelebrationStyles() {
        if (document.getElementById('celebration-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'celebration-styles';
        style.textContent = `
            @keyframes victoryPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.2);
                }
            }
            
            @keyframes confettiFall {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(600px) rotate(720deg);
                    opacity: 0;
                }
            }
            
            .celebration-modal .modal-container {
                animation: celebrationBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
            }
            
            @keyframes celebrationBounce {
                0% {
                    transform: scale(0) rotate(-10deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.1) rotate(5deg);
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Create global instance
window.WorkoutCelebration = new WorkoutCelebration();

console.log('[JS] ✅ Workout Celebration System Loaded 🎉');