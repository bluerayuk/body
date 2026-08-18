// ============================================================================
// FILE: app.js - FIXED EMOJIS FOR THEME AND COMPACT BUTTONS
// ============================================================================

class Application {
    constructor() {
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('🚀 Initializing application...');
        
        try {
            this.loadTheme();
            this.initializeCompactMode();
            await this.loadProfiles();
            this.setupEventListeners();
            
            console.log('✅ Application initialized');
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            await Modal.alert('Initialization Error', 
                'Failed to start application. Please restart.');
        }
    }
    
    initializeCompactMode() {
        const savedCompactMode = localStorage.getItem('compactMode');
        const shouldBeCompact = savedCompactMode !== 'false';
        
        if (shouldBeCompact) {
            document.body.classList.add('compact-mode');
            localStorage.setItem('compactMode', 'true');
            console.log('🔒 Starting in compact mode');
        }
        
        this.updateCompactButton();
    }
    
    async loadProfiles() {
        try {
            const profiles = await API.getProfiles();
            const select = document.getElementById('profileSelect');
            
            if (!select) {
                console.error('Profile select element not found');
                return;
            }
            
            select.innerHTML = '<option value="">Select profile...</option>';
            profiles.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
            
            let profileToLoad = this.determineProfileToLoad(profiles);
            
            if (profileToLoad) {
                select.value = profileToLoad;
                await this.switchProfile(profileToLoad);
                console.log(`✅ Auto-selected profile: ${profileToLoad}`);
            } else if (profiles.length === 0) {
                setTimeout(() => this.showWelcomeModal(), 500);
            }
            
            select.addEventListener('change', async (e) => {
                const profileName = e.target.value;
                if (profileName) {
                    await this.switchProfile(profileName);
                }
            });
        } catch (error) {
            console.error('Failed to load profiles:', error);
            await Modal.alert('Error', 'Failed to load profiles: ' + error.message);
        }
    }
    
    determineProfileToLoad(profiles) {
        const lastProfile = localStorage.getItem('lastProfile');
        if (lastProfile && profiles.includes(lastProfile)) {
            return lastProfile;
        }
        
        if (profiles.length === 1) {
            return profiles[0];
        }
        
        if (profiles.length > 1) {
            return profiles[0];
        }
        
        return null;
    }
    
    async switchProfile(profileName) {
        try {
            window.appState.set('currentProfile', profileName);
            localStorage.setItem('lastProfile', profileName);
            
            const success = await window.appState.loadFromProfile(profileName);
            
            if (!success) {
                throw new Error('Failed to load profile data');
            }
            
            await this.updateUIFromState();
            
            // 🔥 FIX: Force refresh current tab immediately after profile switch
            await this.refreshCurrentTab();
            
            if (window.calculatorEvents) {
                await window.calculatorEvents.autoCalculate();
            }
            
            console.log(`✅ Switched to profile: ${profileName}`);
        } catch (error) {
            console.error('Failed to switch profile:', error);
            await Modal.alert('Error', 'Failed to switch profile: ' + error.message);
        }
    }
    
    async updateUIFromState() {
        const unit = window.appState.get('unit');
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.unit === unit);
        });
        
        const userType = window.appState.get('userType');
        document.querySelectorAll('.user-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === userType);
        });
        
        const waistGroup = document.getElementById('waistInputGroup');
        if (waistGroup) {
            waistGroup.style.display = userType === 'athlete' ? 'block' : 'none';
        }
        
        const gender = window.appState.get('calculator.gender');
        document.querySelectorAll('.gender-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.gender === gender);
        });
        
        const activity = window.appState.get('calculator.activity');
        document.querySelectorAll('.activity-btn').forEach(btn => {
            const isActive = btn.dataset.activity === String(activity);
            btn.classList.toggle('active', isActive);
        });
        
        const ethnicity = window.appState.get('ethnicity');
        const ethnicitySelect = document.getElementById('ethnicitySelect');
        if (ethnicitySelect) {
            ethnicitySelect.value = ethnicity;
        }
        
        const goal = window.appState.get('selectedGoal');
        const goalSelect = document.getElementById('goalSelector');
        if (goalSelect) {
            goalSelect.value = goal;
        }
        
        const age = window.appState.get('calculator.age');
        const height = window.appState.get('calculator.height');
        const waist = window.appState.get('calculator.waist');
        
        if (age) {
            const ageField = document.getElementById('age');
            if (ageField) ageField.value = age;
        }
        
        if (height) {
            const heightField = document.getElementById('height');
            if (heightField) heightField.value = height;
        }
        
        if (waist) {
            const waistField = document.getElementById('waist');
            if (waistField) waistField.value = waist;
        }
        
        const profileName = window.appState.get('currentProfile');
        if (profileName) {
            // Load latest weight from weight tracker
            const weightLog = await API.getWeightLog(profileName);
            if (weightLog && weightLog.length > 0) {
                const lastWeight = weightLog[weightLog.length - 1];
                const weightField = document.getElementById('weight');
                if (weightField) {
                    weightField.value = lastWeight.weight.toFixed(1);
                    window.appState.set('calculator.weight', lastWeight.weight, true);
                }
            }
            
            // 🔥 NEW: Load latest waist from waist tracker
            const waistLog = await API.getWaistLog(profileName);
            if (waistLog && waistLog.length > 0) {
                const lastWaist = waistLog[waistLog.length - 1];
                const waistField = document.getElementById('waist');
                if (waistField) {
                    waistField.value = lastWaist.waist.toFixed(1);
                    window.appState.set('calculator.waist', lastWaist.waist, true);
                }
            }
        }
        
        if (typeof updateUnitLabels === 'function') {
            updateUnitLabels();
        }
    }
    
    setupEventListeners() {
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        const compactToggle = document.getElementById('compactToggle');
        if (compactToggle) {
            compactToggle.addEventListener('click', () => this.toggleCompactMode());
        }
        
        const newProfileBtn = document.getElementById('newProfileBtn');
        if (newProfileBtn) {
            newProfileBtn.addEventListener('click', () => this.showCreateProfileModal());
        }
        
        const deleteProfileBtn = document.getElementById('deleteProfileBtn');
        if (deleteProfileBtn) {
            deleteProfileBtn.addEventListener('click', () => this.deleteCurrentProfile());
        }
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === tabName);
        });
        
        window.appState.set('ui.currentTab', tabName, true);
        
        this.refreshCurrentTab();
    }
    
    /**
     * 🔥 FIXED: Sequential tracker refresh to prevent race conditions
     */
    async refreshCurrentTab() {
        const profileName = window.appState.get('currentProfile');
        if (!profileName) {
            console.log('ℹ️ No profile selected - skipping tab refresh');
            return;
        }
        
        const activeTab = document.querySelector('.nav-tab.active');
        if (!activeTab) {
            console.log('ℹ️ No active tab - skipping refresh');
            return;
        }
        
        const tabName = activeTab.dataset.tab;
        console.log(`🔄 Refreshing tab: ${tabName} for profile: ${profileName}`);
        
        try {
            if (tabName === 'tracker') {
                console.log('📊 === TRACKER TAB REFRESH START ===');
                
                // 🔥 FIX: Wait for trackers to be initialized
                let retryCount = 0;
                const maxRetries = 5; // Increased retries
                
                while (retryCount < maxRetries) {
                    const weightReady = window.weightTracker && 
                                      typeof window.weightTracker.refresh === 'function';
                    const waistReady = window.waistTracker && 
                                     typeof window.waistTracker.refresh === 'function';
                    
                    if (weightReady && waistReady) {
                        console.log('✅ Both trackers ready');
                        break;
                    }
                    
                    console.log(`⏳ Waiting for trackers... (attempt ${retryCount + 1}/${maxRetries})`);
                    console.log(`   Weight tracker ready: ${weightReady}`);
                    console.log(`   Waist tracker ready: ${waistReady}`);
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    retryCount++;
                }
                
                // 🔥 CRITICAL: Refresh BOTH trackers SEQUENTIALLY to prevent race conditions
                if (window.weightTracker && typeof window.weightTracker.refresh === 'function') {
                    console.log('  📈 Refreshing weight tracker...');
                    try {
                        await window.weightTracker.refresh(true);
                        console.log('  ✅ Weight tracker refreshed');
                    } catch (err) {
                        console.error('  ❌ Weight tracker error:', err);
                    }
                } else {
                    console.warn('  ⚠️ Weight tracker not available');
                }
                
                // Wait a moment between refreshes
                await new Promise(resolve => setTimeout(resolve, 100));
                
                if (window.waistTracker && typeof window.waistTracker.refresh === 'function') {
                    console.log('  📏 Refreshing waist tracker...');
                    try {
                        await window.waistTracker.refresh(true);
                        console.log('  ✅ Waist tracker refreshed');
                    } catch (err) {
                        console.error('  ❌ Waist tracker error:', err);
                    }
                } else {
                    console.warn('  ⚠️ Waist tracker not available');
                }
                
                console.log('✅ All tracker refreshes completed');
                console.log('📊 === TRACKER TAB REFRESH END ===');
                
            } else if (tabName === 'bodybuilding' && window.bodybuilding) {
                await window.bodybuilding.refresh();
            }
        } catch (error) {
            console.error('❌ Error refreshing tab:', error);
            console.error('Stack:', error.stack);
        }
    }
    
    showWelcomeModal() {
        new Modal({
            title: '👋 Welcome to TDEE Tracker!',
            content: `
                <div style="line-height: 1.6;">
                    <p style="margin-bottom: 15px;">
                        Get started by creating your first profile to track your 
                        fitness journey.
                    </p>
                    <p style="margin-bottom: 15px;">
                        <strong>Features:</strong>
                    </p>
                    <ul style="margin-left: 20px; margin-bottom: 15px;">
                        <li>Calculate your TDEE with ethnicity adjustments</li>
                        <li>Track your weight progress over time</li>
                        <li>Track your waist measurements (for WHtR)</li>
                        <li>Create and log workout routines</li>
                    </ul>
                </div>
            `,
            buttons: [
                {
                    text: 'Create Profile',
                    className: 'btn-primary',
                    onClick: () => {
                        this.showCreateProfileModal();
                        return true;
                    }
                }
            ]
        });
    }
    
    showCreateProfileModal() {
        new Modal({
            title: 'Create New Profile',
            content: `
                <input type="text" 
                       id="newProfileName" 
                       placeholder="Enter profile name" 
                       style="width: 100%; padding: 12px; border: 2px solid var(--border); 
                              border-radius: 8px; font-size: 15px; font-family: inherit;">
            `,
            buttons: [
                {
                    text: 'Create',
                    className: 'btn-primary',
                    onClick: async (modal) => {
                        const name = modal.getValue('newProfileName')?.trim();
                        
                        if (!name) {
                            await Modal.alert('Error', 'Please enter a profile name');
                            return false;
                        }
                        
                        try {
                            const result = await API.createProfile(name);
                            
                            if (result.success) {
                                await this.loadProfiles();
                                
                                const select = document.getElementById('profileSelect');
                                if (select) {
                                    select.value = name;
                                    await this.switchProfile(name);
                                }
                                
                                return true;
                            } else {
                                await Modal.alert('Error', result.error || 'Failed to create profile');
                                return false;
                            }
                        } catch (error) {
                            await Modal.alert('Error', 'Failed to create profile: ' + error.message);
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
            const input = document.getElementById('newProfileName');
            if (input) {
                input.focus();
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const createBtn = document.querySelector('[data-action="custom"]');
                        if (createBtn) createBtn.click();
                    }
                });
            }
        }, 100);
    }
    
    async deleteCurrentProfile() {
        const profileName = window.appState.get('currentProfile');
        
        if (!profileName) {
            await Modal.alert('No Profile', 'Please select a profile first');
            return;
        }
        
        const confirmed = await Modal.confirm(
            'Delete Profile',
            `Are you sure you want to delete "${profileName}"?\n\n` +
            'This will permanently delete:\n' +
            '• All profile data\n' +
            '• Weight history\n' +
            '• Waist history\n' +
            '• Workout routines\n' +
            '• Workout logs\n\n' +
            'This action cannot be undone!'
        );
        
        if (!confirmed) return;
        
        try {
            const result = await API.deleteProfile(profileName);
            
            if (result.success) {
                await Modal.alert('Success', `Profile "${profileName}" has been deleted.`);
                
                window.appState.reset();
                localStorage.removeItem('lastProfile');
                
                await this.loadProfiles();
            } else {
                await Modal.alert('Error', result.error || 'Failed to delete profile');
            }
        } catch (error) {
            console.error('Failed to delete profile:', error);
            await Modal.alert('Error', 'Failed to delete profile: ' + error.message);
        }
    }
    
    loadTheme() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = saved === 'dark' || (!saved && prefersDark);
        
        if (isDark) {
            document.documentElement.classList.add('dark-mode');
        }
        
        window.appState.set('ui.theme', isDark ? 'dark' : 'light', true);
        this.updateThemeButton();
    }
    
    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        window.appState.set('ui.theme', isDark ? 'dark' : 'light', true);
        this.updateThemeButton();
    }
    
    updateThemeButton() {
        const isDark = document.documentElement.classList.contains('dark-mode');
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.textContent = isDark ? '☀️' : '🌙';
        }
    }
    
    async toggleCompactMode() {
        const isCompact = document.body.classList.toggle('compact-mode');
        localStorage.setItem('compactMode', isCompact ? 'true' : 'false');
        this.updateCompactButton();
        
        try {
            const screenInfo = await API.call('get_screen_size');
            
            if (screenInfo.success) {
                const screenWidth = screenInfo.width;
                const screenHeight = screenInfo.height;
                
                if (isCompact) {
                    const targetWidth = Math.floor(screenWidth / 2);
                    const targetHeight = screenHeight - 100;
                    
                    const result = await API.call('resize_window', targetWidth, targetHeight);
                    
                    if (result.success && window.Toast) {
                        window.Toast.success(`🔒 Window locked to half width (${targetWidth}px)`);
                    }
                } else {
                    await API.call('unlock_window');
                    
                    const targetWidth = Math.floor(screenWidth * 0.9);
                    const targetHeight = screenHeight - 100;
                    
                    const result = await API.call('resize_window', targetWidth, targetHeight);
                    
                    if (result.success && window.Toast) {
                        window.Toast.success(`🔓 Window expanded and unlocked (${targetWidth}px)`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Exception during window resize:', error);
        }
    }
    
    updateCompactButton() {
        const isCompact = document.body.classList.contains('compact-mode');
        const icon = document.getElementById('compactIcon');
        const text = document.getElementById('compactText');
        
        if (icon && text) {
            if (isCompact) {
                icon.textContent = '🔓';
                text.textContent = 'Normal';
            } else {
                icon.textContent = '🔒';
                text.textContent = 'Compact';
            }
        }
    }
}

// Create global instance
window.app = new Application();

// Register with init manager
if (window.initManager) {
    window.initManager.register('app', async () => {
        await window.app.init();
    }, []);
}

// ============================================================================
// CHANGELOG:
// ============================================================================
// - FIXED: Corrupted emojis in theme and compact mode buttons
// - Theme button: ☀️ (sun) for dark mode, 🌙 (moon) for light mode
// - Compact button: 🔒 (locked) for compact mode, 🔓 (unlocked) for normal mode
// ============================================================================