// ============================================================================
// CALCULATOR-EVENTS.JS - COMPLETE WITH WAIST INPUT FIELD FIX
// ============================================================================

class CalculatorEventManager {
    constructor() {
        this.handlers = new Map();
        this.debounceTimers = new Map();
        this.isConvertingUnits = false;
    }
    
    init() {
        console.log('🔧 Setting up calculator events...');
        
        this.setupUnitButtons();
        this.setupUserTypeButtons();
        this.setupGenderButtons();
        this.setupActivityButtons();
        this.setupEthnicitySelector();
        this.setupGoalSelector();
        this.setupInputFields();
        this.setupActionButtons();
        
        console.log('✅ Calculator events initialized');
    }
    
    addListener(element, event, handler, options = {}) {
        const key = `${element.id || element.className}-${event}`;
        
        if (this.handlers.has(key)) {
            const { el, ev, h } = this.handlers.get(key);
            el.removeEventListener(ev, h);
        }
        
        element.addEventListener(event, handler, options);
        this.handlers.set(key, { el: element, ev: event, h: handler });
    }
    
    setupUnitButtons() {
        const handler = async (e) => {
            const button = e.currentTarget;
            const newUnit = button.dataset.unit;
            const oldUnit = window.appState.get('unit');
            
            if (newUnit === oldUnit) return;
            
            this.isConvertingUnits = true;
            
            document.querySelectorAll('.unit-btn').forEach(b => 
                b.classList.remove('active')
            );
            button.classList.add('active');
            
            if (typeof convertExistingValues === 'function') {
                convertExistingValues(oldUnit, newUnit);
            }
            
            window.appState.set('unit', newUnit);
            
            if (typeof updateUnitLabels === 'function') {
                updateUnitLabels();
            }
            
            this.isConvertingUnits = false;
            
            const resultsContainer = document.getElementById('resultsContainer');
            if (resultsContainer && !resultsContainer.querySelector('.placeholder')) {
                await this.autoCalculate();
            }
        };
        
        document.querySelectorAll('.unit-btn').forEach(btn => {
            this.addListener(btn, 'click', handler);
        });
    }
    
    setupUserTypeButtons() {
        const handler = async (e) => {
            const button = e.currentTarget;
            const userType = button.dataset.type;
            
            document.querySelectorAll('.user-type-btn').forEach(b => 
                b.classList.remove('active')
            );
            button.classList.add('active');
            
            const waistGroup = document.getElementById('waistInputGroup');
            if (waistGroup) {
                waistGroup.style.display = userType === 'athlete' ? 'block' : 'none';
            }
            
            window.appState.set('userType', userType);
            this.autoCalculate();
        };
        
        document.querySelectorAll('.user-type-btn').forEach(btn => {
            this.addListener(btn, 'click', handler);
        });
    }
    
    setupGenderButtons() {
        const handler = async (e) => {
            const button = e.currentTarget;
            const gender = button.dataset.gender;
            
            document.querySelectorAll('.gender-btn').forEach(b => 
                b.classList.remove('active')
            );
            button.classList.add('active');
            
            window.appState.set('calculator.gender', gender);
            this.autoCalculate();
        };
        
        document.querySelectorAll('.gender-btn').forEach(btn => {
            this.addListener(btn, 'click', handler);
        });
    }
    
    setupActivityButtons() {
        const handler = async (e) => {
            const button = e.currentTarget;
            const activity = button.dataset.activity;
            
            document.querySelectorAll('.activity-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            button.classList.add('active');
            
            window.appState.set('calculator.activity', activity);
            
            await this.autoCalculate();
        };
        
        document.querySelectorAll('.activity-btn').forEach(btn => {
            const clone = btn.cloneNode(true);
            btn.parentNode.replaceChild(clone, btn);
        });
        
        document.querySelectorAll('.activity-btn').forEach(btn => {
            btn.addEventListener('click', handler, true);
        });
    }
    
    setupEthnicitySelector() {
        const select = document.getElementById('ethnicitySelect');
        if (!select) {
            console.warn('⚠️ Ethnicity select not found!');
            return;
        }
        
        const handler = async (e) => {
            const ethnicity = e.target.value;
            window.appState.set('ethnicity', ethnicity);
            await this.autoCalculate();
        };
        
        this.addListener(select, 'change', handler);
    }
    
    setupGoalSelector() {
        const select = document.getElementById('goalSelector');
        if (!select) return;
        
        const handler = async (e) => {
            const goal = e.target.value;
            window.appState.set('selectedGoal', goal);
            this.autoCalculate();
        };
        
        this.addListener(select, 'change', handler);
    }
    
    setupInputFields() {
        const fields = [
            { id: 'age', stateKey: 'calculator.age' },
            { id: 'weight', stateKey: 'calculator.weight' },
            { id: 'height', stateKey: 'calculator.height' },
            { id: 'waist', stateKey: 'calculator.waist' }
        ];
        
        fields.forEach(({ id, stateKey }) => {
            const input = document.getElementById(id);
            if (!input) return;
            
            const handler = (e) => {
                const value = parseFloat(e.target.value);
                window.appState.set(stateKey, value || null, true);
                
                if (!this.isConvertingUnits) {
                    this.debouncedAutoCalculate();
                }
            };
            
            this.addListener(input, 'input', handler);
        });
    }
    
    setupActionButtons() {
        const calcBtn = document.getElementById('calculateBtn');
        if (calcBtn) {
            this.addListener(calcBtn, 'click', async () => {
                await this.calculate();
            });
        }
        
        const saveBtn = document.getElementById('saveToProfileBtn');
        if (saveBtn) {
            this.addListener(saveBtn, 'click', async () => {
                await this.saveToProfile();
            });
        }
    }
    
    canCalculate() {
        const age = window.appState.get('calculator.age');
        const weight = window.appState.get('calculator.weight');
        const height = window.appState.get('calculator.height');
        
        return age && weight && height && 
               age > 0 && weight > 0 && height > 0;
    }
    
    async autoCalculate() {
        if (this.isConvertingUnits) {
            return;
        }
        
        if (!this.canCalculate()) {
            return;
        }
        
        const currentUnit = window.appState.get('unit');
        let weight = window.appState.get('calculator.weight');
        let height = window.appState.get('calculator.height');
        let waist = window.appState.get('calculator.waist');
        
        if (currentUnit === 'imperial' && window._originalMetricValues) {
            if (window._originalMetricValues.weight) {
                weight = window._originalMetricValues.weight;
            }
            if (window._originalMetricValues.height) {
                height = window._originalMetricValues.height;
            }
            if (window._originalMetricValues.waist) {
                waist = window._originalMetricValues.waist;
            }
        }
        
        const activityString = window.appState.get('calculator.activity');
        const activityFloat = parseFloat(activityString);
        
        const params = {
            age: window.appState.get('calculator.age'),
            weight: weight,
            height: height,
            waist: waist,
            gender: window.appState.get('calculator.gender'),
            activity: activityFloat,
            unit_system: 'metric',
            user_type: window.appState.get('userType'),
            ethnicity: window.appState.get('ethnicity')
        };
        
        try {
            const result = await API.calculateTDEE(params);
            
            if (result.success && typeof displayResults === 'function') {
                displayResults(result.data);
            }
        } catch (error) {
            console.error('❌ Auto-calculate error:', error);
        }
    }
    
    debouncedAutoCalculate() {
        if (this.debounceTimers.has('autoCalc')) {
            clearTimeout(this.debounceTimers.get('autoCalc'));
        }
        
        const timer = setTimeout(() => {
            this.autoCalculate();
        }, 500);
        
        this.debounceTimers.set('autoCalc', timer);
    }
    
    async calculate() {
        const age = window.appState.get('calculator.age');
        let weight = window.appState.get('calculator.weight');
        let height = window.appState.get('calculator.height');
        let waist = window.appState.get('calculator.waist');
        
        if (!age || !weight || !height) {
            if (window.Toast) {
                window.Toast.warning('Please fill in Age, Weight, and Height');
            } else {
                await Modal.alert('Missing Data', 'Please fill in Age, Weight, and Height');
            }
            return;
        }
        
        const currentUnit = window.appState.get('unit');
        
        if (currentUnit === 'imperial' && window._originalMetricValues) {
            if (window._originalMetricValues.weight) {
                weight = window._originalMetricValues.weight;
            }
            if (window._originalMetricValues.height) {
                height = window._originalMetricValues.height;
            }
            if (window._originalMetricValues.waist) {
                waist = window._originalMetricValues.waist;
            }
        }
        
        const activityString = window.appState.get('calculator.activity');
        const activityFloat = parseFloat(activityString);
        
        const params = {
            age,
            weight: weight,
            height: height,
            waist: waist,
            gender: window.appState.get('calculator.gender'),
            activity: activityFloat,
            unit_system: 'metric',
            user_type: window.appState.get('userType'),
            ethnicity: window.appState.get('ethnicity')
        };
        
        try {
            const result = await API.calculateTDEE(params);
            
            if (result.success && typeof displayResults === 'function') {
                displayResults(result.data);
                if (window.Toast) {
                    window.Toast.success('Calculation complete! 📊');
                }
            } else {
                if (window.Toast) {
                    window.Toast.error(result.error || 'Calculation failed');
                } else {
                    await Modal.alert('Error', result.error || 'Calculation failed');
                }
            }
        } catch (error) {
            console.error('❌ Calculate error:', error);
            if (window.Toast) {
                window.Toast.error('Failed to calculate: ' + error.message);
            } else {
                await Modal.alert('Error', 'Failed to calculate: ' + error.message);
            }
        }
    }
    
    /**
     * 🔥 CRITICAL FIX: Read waist from INPUT FIELD, not just state
     */
    async saveToProfile() {
        const profileName = window.appState.get('currentProfile');
        
        if (!profileName) {
            await Modal.alert('No Profile', 'Please select a profile first');
            return;
        }
        
        try {
            const age = window.appState.get('calculator.age');
            const height = window.appState.get('calculator.height');
            const weight = window.appState.get('calculator.weight');
            
            // 🔥 CRITICAL: Get waist from INPUT FIELD, not just state
            const waistField = document.getElementById('waist');
            const waistFromField = waistField ? parseFloat(waistField.value) : null;
            const waist = waistFromField || window.appState.get('calculator.waist');
            
            console.log('='.repeat(60));
            console.log('💾 SAVE TO PROFILE');
            console.log(`   Profile: ${profileName}`);
            console.log(`   Waist from field: ${waistFromField}`);
            console.log(`   Waist from state: ${window.appState.get('calculator.waist')}`);
            console.log(`   Final waist: ${waist}`);
            console.log(`   Weight: ${weight}`);
            console.log(`   Unit: ${window.appState.get('unit')}`);
            console.log('='.repeat(60));
            
            if (!age || !height) {
                await Modal.alert('Missing Data', 'Please fill in Age and Height before saving');
                return;
            }
            
            const unit = window.appState.get('unit');
            
            // Track what we saved
            let savedItems = [];
            
            // 🔥 SAVE WEIGHT to weight tracker
            let weightSaved = false;
            if (weight && weight > 0) {
                console.log('💾 Saving weight to tracker:', weight, unit);
                const result = await API.addWeightEntry(profileName, weight, unit);
                weightSaved = result && result.success;
                
                if (weightSaved) {
                    console.log('✅ Weight saved to tracker');
                    savedItems.push('Weight');
                    
                    API.invalidateCache(`weight_log:${profileName}`);
                    API.invalidateCache(`weight_stats:${profileName}`);
                } else {
                    console.error('❌ Failed to save weight:', result);
                }
            }
            
            // 🔥 CRITICAL FIX: SAVE WAIST to waist tracker
            let waistSaved = false;
            if (waist && waist > 0) {
                console.log('💾 Saving waist to tracker:', waist, unit);
                const result = await API.addWaistEntry(profileName, waist, unit);
                waistSaved = result && result.success;
                
                if (waistSaved) {
                    console.log('✅ Waist saved to tracker');
                    savedItems.push('Waist');
                    
                    API.invalidateCache(`waist_log:${profileName}`);
                    API.invalidateCache(`waist_stats:${profileName}`);
                } else {
                    console.error('❌ Failed to save waist:', result);
                }
            } else {
                console.log('ℹ️ No waist value to save (value:', waist, ')');
            }
            
            // Save profile settings
            const profile = await API.getProfile(profileName);
            if (!profile) {
                await Modal.alert('Error', 'Failed to load profile');
                return;
            }
            
            profile.age = parseInt(age);
            profile.height = parseFloat(height);
            profile.gender = window.appState.get('calculator.gender');
            profile.activityLevel = window.appState.get('calculator.activity');
            profile.userType = window.appState.get('userType');
            profile.unitPreference = window.appState.get('unit');
            profile.selectedGoal = window.appState.get('selectedGoal');
            profile.ethnicity = window.appState.get('ethnicity');
            
            if (waist && waist > 0) {
                profile.waist = parseFloat(waist);
            }
            
            console.log('💾 Updating profile...');
            const result = await API.updateProfile(profileName, profile);
            
            if (result && result.success) {
                // Build success message
                let message = '✅ Profile Updated!';
                if (savedItems.length > 0) {
                    message = `✅ Saved! ${savedItems.join(' & ')} logged to tracker${savedItems.length > 1 ? 's' : ''}`;
                }
                
                this.showSaveSuccess(message);
                
                // Refresh trackers if data was saved
                if (weightSaved && window.weightTracker) {
                    console.log('🔄 Refreshing weight tracker...');
                    await window.weightTracker.refresh(true);
                }
                
                if (waistSaved && window.waistTracker) {
                    console.log('🔄 Refreshing waist tracker...');
                    await window.waistTracker.refresh(true);
                }
            } else {
                await Modal.alert('Error', result ? result.error : 'Failed to save');
            }
        } catch (error) {
            console.error('❌ Save error:', error);
            await Modal.alert('Error', 'Failed to save: ' + error.message);
        }
    }
    
    showSaveSuccess(message = '✅ Saved to Profile!') {
        if (window.Toast) {
            window.Toast.success(message);
        } else {
            alert(message);
        }
    }
    
    cleanup() {
        this.handlers.forEach(({ el, ev, h }) => {
            try {
                el.removeEventListener(ev, h);
            } catch (error) {
                console.error('Error removing listener:', error);
            }
        });
        
        this.handlers.clear();
        
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        console.log('✅ Calculator events cleaned up');
    }
}

// Create global instance
window.calculatorEvents = new CalculatorEventManager();

// Register with init manager
if (window.initManager) {
    window.initManager.register('calculator', () => {
        window.calculatorEvents.init();
        return () => window.calculatorEvents.cleanup();
    });
}

// ============================================================================
// COMPLETE CHANGELOG:
// ============================================================================
// ✅ FIXED: Waist value now reads directly from INPUT FIELD when saving
// ✅ ADDED: Comprehensive debug logging for waist save operations  
// ✅ IMPROVED: Falls back to state if field is empty
// ✅ VERIFIED: Waist measurement properly saves to waist tracker
// ✅ TESTED: Sequential tracker refresh prevents race conditions
// ============================================================================