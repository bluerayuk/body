// calculator-core.js - Perfect round-trip conversion with original value storage

// Store original metric values for perfect round-trip
window._originalMetricValues = {
    weight: null,
    height: null,
    waist: null
};

/**
 * Update unit labels in UI
 */
function updateUnitLabels() {
    const unit = window.appState?.get('unit') || 'metric';
    
    const weightLabel = document.getElementById('weightLabel');
    const heightLabel = document.getElementById('heightLabel');
    const waistLabel = document.getElementById('waistLabel');
    
    if (unit === 'metric') {
        if (weightLabel) weightLabel.textContent = 'Weight (kg)';
        if (heightLabel) heightLabel.textContent = 'Height (cm)';
        if (waistLabel) waistLabel.textContent = 'Waist (cm)';
    } else {
        if (weightLabel) weightLabel.textContent = 'Weight (lbs)';
        if (heightLabel) heightLabel.textContent = 'Height (inches)';
        if (waistLabel) waistLabel.textContent = 'Waist (inches)';
    }
}

/**
 * Convert ONLY INPUT FIELDS when unit system changes
 * Stores original metric values for perfect round-trip conversion
 */
function convertExistingValues(fromUnit, toUnit) {
    if (fromUnit === toUnit) return;
    
    console.log(`🔄 Converting inputs from ${fromUnit} to ${toUnit}`);
    
    const weightInput = document.getElementById('weight');
    const heightInput = document.getElementById('height');
    const waistInput = document.getElementById('waist');
    
    // Conversion factors
    const LBS_TO_KG = 0.453592;
    const INCHES_TO_CM = 2.54;
    
    if (fromUnit === 'metric' && toUnit === 'imperial') {
        // 🔥 SAVE original metric values before converting
        if (weightInput?.value) {
            window._originalMetricValues.weight = parseFloat(weightInput.value);
        }
        if (heightInput?.value) {
            window._originalMetricValues.height = parseFloat(heightInput.value);
        }
        if (waistInput?.value) {
            window._originalMetricValues.waist = parseFloat(waistInput.value);
        }
        
        console.log('💾 Saved original metric values:', window._originalMetricValues);
        
        // Metric to Imperial
        if (weightInput?.value) {
            const kg = parseFloat(weightInput.value);
            const lbs = parseFloat((kg / LBS_TO_KG).toFixed(1));
            weightInput.value = lbs;
            window.appState.set('calculator.weight', lbs, true);
            console.log(`  Weight: ${kg} kg → ${lbs} lbs`);
        }
        
        if (heightInput?.value) {
            const cm = parseFloat(heightInput.value);
            const inches = parseFloat((cm / INCHES_TO_CM).toFixed(1));
            heightInput.value = inches;
            window.appState.set('calculator.height', inches, true);
            console.log(`  Height: ${cm} cm → ${inches} inches`);
        }
        
        if (waistInput?.value) {
            const cm = parseFloat(waistInput.value);
            const inches = parseFloat((cm / INCHES_TO_CM).toFixed(1));
            waistInput.value = inches;
            window.appState.set('calculator.waist', inches, true);
            console.log(`  Waist: ${cm} cm → ${inches} inches`);
        }
    } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        // 🔥 RESTORE original metric values if available (perfect round-trip!)
        if (window._originalMetricValues.weight && weightInput) {
            weightInput.value = window._originalMetricValues.weight;
            window.appState.set('calculator.weight', window._originalMetricValues.weight, true);
            console.log(`  Weight: restored to ${window._originalMetricValues.weight} kg (original)`);
        } else if (weightInput?.value) {
            // Fallback: calculate from imperial
            const lbs = parseFloat(weightInput.value);
            const kg = parseFloat((lbs * LBS_TO_KG).toFixed(1));
            weightInput.value = kg;
            window.appState.set('calculator.weight', kg, true);
            console.log(`  Weight: ${lbs} lbs → ${kg} kg`);
        }
        
        if (window._originalMetricValues.height && heightInput) {
            heightInput.value = window._originalMetricValues.height;
            window.appState.set('calculator.height', window._originalMetricValues.height, true);
            console.log(`  Height: restored to ${window._originalMetricValues.height} cm (original)`);
        } else if (heightInput?.value) {
            // Fallback: calculate from imperial
            const inches = parseFloat(heightInput.value);
            const cm = parseFloat((inches * INCHES_TO_CM).toFixed(1));
            heightInput.value = cm;
            window.appState.set('calculator.height', cm, true);
            console.log(`  Height: ${inches} inches → ${cm} cm`);
        }
        
        if (window._originalMetricValues.waist && waistInput?.value) {
            waistInput.value = window._originalMetricValues.waist;
            window.appState.set('calculator.waist', window._originalMetricValues.waist, true);
            console.log(`  Waist: restored to ${window._originalMetricValues.waist} cm (original)`);
        } else if (waistInput?.value) {
            // Fallback: calculate from imperial
            const inches = parseFloat(waistInput.value);
            const cm = parseFloat((inches * INCHES_TO_CM).toFixed(1));
            waistInput.value = cm;
            window.appState.set('calculator.waist', cm, true);
            console.log(`  Waist: ${inches} inches → ${cm} cm`);
        }
        
        console.log('♻️ Restored to original metric values');
    }
    
    // Update unit labels
    updateUnitLabels();
    
    console.log('✅ Input conversion complete');
    console.log('   State now has:', {
        weight: window.appState.get('calculator.weight'),
        height: window.appState.get('calculator.height'),
        waist: window.appState.get('calculator.waist')
    });
}