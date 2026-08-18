// calculator-results.js - COMPLETE with Beautiful BMR/TDEE/BMI/WHtR Cards + Enhanced Comparative Metrics
// UPDATED: Reduced WHtR card height by 10%

/**
 * Get optimal WHtR target based on ethnicity and gender
 */
function getOptimalWhtr(ethnicity, gender) {
    // Optimal WHtR targets (based on research)
    const targets = {
        asian: {
            male: { target: 0.48, description: 'Asian male optimal' },
            female: { target: 0.46, description: 'Asian female optimal' }
        },
        african: {
            male: { target: 0.50, description: 'African male optimal' },
            female: { target: 0.48, description: 'African female optimal' }
        },
        hispanic: {
            male: { target: 0.50, description: 'Hispanic male optimal' },
            female: { target: 0.48, description: 'Hispanic female optimal' }
        },
        caucasian: {
            male: { target: 0.50, description: 'Caucasian male optimal' },
            female: { target: 0.48, description: 'Caucasian female optimal' }
        },
        middle_eastern: {
            male: { target: 0.50, description: 'Middle Eastern male optimal' },
            female: { target: 0.48, description: 'Middle Eastern female optimal' }
        },
        default: {
            male: { target: 0.50, description: 'Male optimal' },
            female: { target: 0.48, description: 'Female optimal' }
        }
    };
    
    const ethnicityGroup = targets[ethnicity] || targets.default;
    return ethnicityGroup[gender] || ethnicityGroup.male;
}

/**
 * Calculate WHtR percentile ranking based on population data
 */
function calculateWhtrPercentile(whtr, age, gender) {
    // Simplified percentile calculation based on typical population distributions
    // Real-world data shows WHtR distribution varies by age and gender
    
    // Age-adjusted baseline (WHtR tends to increase with age)
    let ageAdjustment = 0;
    if (age < 30) {
        ageAdjustment = -0.02;
    } else if (age >= 50) {
        ageAdjustment = +0.02;
    }
    
    // Gender adjustment (females typically have slightly lower WHtR)
    const genderAdjustment = gender === 'female' ? -0.01 : 0;
    
    // Adjusted WHtR for comparison
    const adjustedWhtr = whtr + ageAdjustment + genderAdjustment;
    
    // Percentile calculation (approximate based on normal distribution)
    // Population mean WHtR ≈ 0.52, SD ≈ 0.08
    const mean = 0.52;
    const sd = 0.08;
    const zScore = (adjustedWhtr - mean) / sd;
    
    // Convert z-score to percentile (using standard normal distribution approximation)
    let percentile;
    if (zScore < -2.5) {
        percentile = 1;
    } else if (zScore < -2.0) {
        percentile = 2;
    } else if (zScore < -1.5) {
        percentile = 7;
    } else if (zScore < -1.0) {
        percentile = 16;
    } else if (zScore < -0.5) {
        percentile = 31;
    } else if (zScore < 0) {
        percentile = 50;
    } else if (zScore < 0.5) {
        percentile = 69;
    } else if (zScore < 1.0) {
        percentile = 84;
    } else if (zScore < 1.5) {
        percentile = 93;
    } else if (zScore < 2.0) {
        percentile = 98;
    } else {
        percentile = 99;
    }
    
    // Invert percentile (lower WHtR = better)
    percentile = 100 - percentile;
    
    return Math.max(1, Math.min(99, percentile));
}

function displayResults(data) {
    console.log('📊 displayResults called with:', data);
    
    const container = document.getElementById('resultsContainer');
    if (!container) {
        console.error('❌ resultsContainer not found!');
        return;
    }
    
    // 🔥 CRITICAL: Force complete clear before rendering
    container.innerHTML = '';
    
    // Force reflow to ensure clear is applied
    void container.offsetHeight;
    
    const tdee = data.tdee;
    const ethnicity_info = data.ethnicity_adjustment;
    
    const unit = window.appState?.get('unit') || 'metric';
    const selectedGoal = window.appState?.get('selectedGoal') || 'maintenance';
    const userType = window.appState?.get('userType') || 'general';
    
    const weightMultiplier = unit === 'imperial' ? 2.20462 : 1;
    const weightUnit = unit === 'imperial' ? 'lbs' : 'kg';
    
    const goals = {
        aggressiveCut: { value: Math.round(tdee - 750), cal: -750, weight: -1 * weightMultiplier },
        moderateCut: { value: Math.round(tdee - 500), cal: -500, weight: -0.5 * weightMultiplier },
        mildCut: { value: Math.round(tdee - 300), cal: -300, weight: -0.25 * weightMultiplier },
        maintenance: { value: Math.round(tdee), cal: 0, weight: 0 },
        leanBulk: { value: Math.round(tdee + 300), cal: 300, weight: 0.25 * weightMultiplier },
        bulking: { value: Math.round(tdee + 500), cal: 500, weight: 0.5 * weightMultiplier },
        dirtyBulk: { value: Math.round(tdee + 800), cal: 800, weight: 0.75 * weightMultiplier }
    };
    
    const goalInfo = {
        aggressiveCut: { name: '🔥 Aggressive Cut', color: '#ef4444', bg1: '#fee2e2', bg2: '#fecaca', text: '#991b1b' },
        moderateCut: { name: '📉 Moderate Cut', color: '#f97316', bg1: '#fed7aa', bg2: '#fdba74', text: '#9a3412' },
        mildCut: { name: '✂️ Mild Cut', color: '#f59e0b', bg1: '#fef3c7', bg2: '#fde68a', text: '#92400e' },
        maintenance: { name: '⚖️ Maintenance', color: '#3b82f6', bg1: '#dbeafe', bg2: '#bfdbfe', text: '#1e3a8a' },
        leanBulk: { name: '💪 Lean Bulk', color: '#10b981', bg1: '#d1fae5', bg2: '#a7f3d0', text: '#065f46' },
        bulking: { name: '🚀 Bulking', color: '#6366f1', bg1: '#c7d2fe', bg2: '#a5b4fc', text: '#312e81' },
        dirtyBulk: { name: '🍕 Dirty Bulk', color: '#8b5cf6', bg1: '#ddd6fe', bg2: '#c4b5fd', text: '#4c1d95' }
    };
    
    let html = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
            <!-- BMR Card - Muted Purple/Plum -->
            <div style="background: linear-gradient(135deg, #4c4680, #5a3d66); padding: 28px; border-radius: 16px; box-shadow: 0 8px 24px rgba(76, 70, 128, 0.35); position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.15); transition: transform 0.3s ease, box-shadow 0.3s ease;" 
                 onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 32px rgba(76, 70, 128, 0.45)';"
                 onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px rgba(76, 70, 128, 0.35)';">
                <!-- Background decoration -->
                <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.08); border-radius: 50%; opacity: 0.5;"></div>
                <div style="position: absolute; bottom: -40px; left: -40px; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.05); border-radius: 50%;"></div>
                
                <!-- Content -->
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="font-size: 32px; line-height: 1;">🔥</div>
                        <div style="font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, 0.9); text-transform: uppercase; letter-spacing: 1px;">Basal Metabolic Rate</div>
                    </div>
                    <div style="font-size: 48px; font-weight: 800; color: white; line-height: 1; margin-bottom: 8px;">
                        ${data.bmr.toFixed(0)}
                        <span style="font-size: 20px; font-weight: 600; opacity: 0.9; margin-left: 4px;">cal</span>
                    </div>
                    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.85); line-height: 1.4;">
                        Calories your body burns at complete rest
                    </div>
                </div>
            </div>
            
            <!-- TDEE Card - Muted Rose/Mauve -->
            <div style="background: linear-gradient(135deg, #7d5a7d, #8b5a6e); padding: 28px; border-radius: 16px; box-shadow: 0 8px 24px rgba(125, 90, 125, 0.35); position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.15); transition: transform 0.3s ease, box-shadow 0.3s ease;"
                 onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 32px rgba(125, 90, 125, 0.45)';"
                 onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px rgba(125, 90, 125, 0.35)';">
                <!-- Background decoration -->
                <div style="position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.08); border-radius: 50%; opacity: 0.5;"></div>
                <div style="position: absolute; bottom: -40px; left: -40px; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.05); border-radius: 50%;"></div>
                
                <!-- Content -->
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <div style="font-size: 32px; line-height: 1;">⚡</div>
                        <div style="font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, 0.9); text-transform: uppercase; letter-spacing: 1px;">Total Daily Energy</div>
                    </div>
                    <div style="font-size: 48px; font-weight: 800; color: white; line-height: 1; margin-bottom: 8px;">
                        ${data.tdee.toFixed(0)}
                        <span style="font-size: 20px; font-weight: 600; opacity: 0.9; margin-left: 4px;">cal</span>
                    </div>
                    <div style="font-size: 13px; color: rgba(255, 255, 255, 0.85); line-height: 1.4;">
                        Total calories needed per day with activity
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (ethnicity_info && ethnicity_info.adjustment_factor !== 1.0) {
        const adjustmentPercent = ((ethnicity_info.adjustment_factor - 1.0) * 100).toFixed(1);
        html += `
            <div style="background: linear-gradient(135deg, #e0f2fe, #bae6fd); padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #0284c7;">
                <div style="font-size: 12px; font-weight: 700; color: #0c4a6e; margin-bottom: 4px;">🧬 Ethnicity Adjustment Applied</div>
                <div style="font-size: 13px; color: #075985; line-height: 1.4;">
                    ${ethnicity_info.description} (${adjustmentPercent > 0 ? '+' : ''}${adjustmentPercent}% to BMR)
                </div>
            </div>
        `;
    }
    
    const info = goalInfo[selectedGoal];
    const goal = goals[selectedGoal];
    const calChange = goal.cal > 0 ? `+${goal.cal}` : goal.cal;
    
    let weightChange;
    if (goal.weight === 0) {
        weightChange = '0';
    } else {
        const absWeight = Math.abs(goal.weight);
        const formattedWeight = absWeight.toFixed(2);
        weightChange = goal.weight > 0 ? `+${formattedWeight}` : `-${formattedWeight}`;
    }
    
    const goalGradients = {
        aggressiveCut: { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239, 68, 68, 0.3)' },
        moderateCut: { gradient: 'linear-gradient(135deg, #f97316, #ea580c)', shadow: 'rgba(249, 115, 22, 0.3)' },
        mildCut: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 158, 11, 0.3)' },
        maintenance: { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(59, 130, 246, 0.3)' },
        leanBulk: { gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.3)' },
        bulking: { gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', shadow: 'rgba(99, 102, 241, 0.3)' },
        dirtyBulk: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', shadow: 'rgba(139, 92, 246, 0.3)' }
    };
    
    const goalStyle = goalGradients[selectedGoal];
    
    html += `
        <div style="background: ${goalStyle.gradient}; padding: 24px; border-radius: 16px; box-shadow: 0 8px 24px ${goalStyle.shadow}; margin-bottom: 8px; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease, box-shadow 0.3s ease;"
             onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 32px ${goalStyle.shadow.replace('0.3', '0.4')}';"
             onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px ${goalStyle.shadow}';">
            
            <!-- Background decoration -->
            <div style="position: absolute; top: -50px; right: -50px; width: 180px; height: 180px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; opacity: 0.5;"></div>
            <div style="position: absolute; bottom: -60px; left: -60px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
            
            <!-- Content -->
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="font-size: 36px; line-height: 1;">🎯</div>
                    <div>
                        <div style="font-size: 12px; font-weight: 700; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">Your Selected Goal</div>
                        <div style="font-size: 26px; font-weight: 800; color: white; line-height: 1;">${info.name}</div>
                    </div>
                </div>
                
                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 12px;">
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.2s ease;"
                         onmouseenter="this.style.background='rgba(255,255,255,0.25)'; this.style.transform='scale(1.03)';"
                         onmouseleave="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)';">
                        <div style="font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Daily Calories</div>
                        <div style="font-size: 36px; font-weight: 800; color: white; line-height: 1;">
                            ${goal.value}
                            <span style="font-size: 16px; font-weight: 600; opacity: 0.9; margin-left: 2px;">cal</span>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.2s ease;"
                         onmouseenter="this.style.background='rgba(255,255,255,0.25)'; this.style.transform='scale(1.03)';"
                         onmouseleave="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)';">
                        <div style="font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Calorie Change</div>
                        <div style="font-size: 36px; font-weight: 800; color: white; line-height: 1;">
                            ${calChange}
                            <span style="font-size: 16px; font-weight: 600; opacity: 0.9; margin-left: 2px;">cal</span>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3); transition: all 0.2s ease;"
                         onmouseenter="this.style.background='rgba(255,255,255,0.25)'; this.style.transform='scale(1.03)';"
                         onmouseleave="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1)';">
                        <div style="font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.9); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Weekly Change</div>
                        <div style="font-size: 36px; font-weight: 800; color: white; line-height: 1;">
                            ${weightChange}
                            <span style="font-size: 16px; font-weight: 600; opacity: 0.9; margin-left: 2px;">${weightUnit}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Tip Section -->
                <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 16px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3);">
                    <div style="font-weight: 700; color: white; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; font-size: 14px;">
                        <span style="font-size: 20px;">💡</span>
                        <span>Pro Tip</span>
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.95); font-size: 13px; line-height: 1.6;">${getGoalTip(selectedGoal)}</div>
                </div>
            </div>
        </div>
    `;
    
    if (userType === 'general') {
        console.log('📋 General user mode - showing BMI');
        
        const currentWeightInState = window.appState?.get('calculator.weight');
        const currentHeightInState = window.appState?.get('calculator.height');
        
        console.log('📏 Weight from state:', currentWeightInState);
        console.log('📏 Height from state:', currentHeightInState);
        
        if (!currentWeightInState || !currentHeightInState) {
            console.warn('⚠️ Missing weight or height data');
            html += `
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <div style="font-size: 14px; font-weight: 700; color: #92400e;">⚠️ Missing Data</div>
                <div style="font-size: 13px; line-height: 1.4; margin-top: 10px; color: #92400e;">Weight or height data missing. Cannot calculate BMI.</div>
            </div>`;
        } else {
            let currentWeight = currentWeightInState;
            let heightCm = currentHeightInState;
            
            if (unit === 'imperial') {
                console.log('🔄 Converting imperial to metric');
                currentWeight = currentWeight * 0.453592;
                heightCm = heightCm * 2.54;
            }
            
            console.log('📏 Final weight (kg):', currentWeight);
            console.log('📏 Final height (cm):', heightCm);
            console.log('🎨 Calling generateCondensedBMICard...');
            
            try {
                const bmiCard = generateCondensedBMICard(data, currentWeight, heightCm);
                console.log('✅ BMI card generated successfully');
                html += bmiCard;
            } catch (error) {
                console.error('❌ Error generating BMI card:', error);
                html += `
                <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444;">
                    <div style="font-size: 14px; font-weight: 700; color: #991b1b;">❌ Error</div>
                    <div style="font-size: 13px; line-height: 1.4; margin-top: 10px; color: #991b1b;">Error displaying BMI: ${error.message}</div>
                </div>`;
            }
        }
    } else {
        console.log('🏋️ Athlete mode - showing WHtR');
        if (data.whtr) {
            const whtrCategory = data.whtr_category;
            
            // Map WHtR categories to gradient styles
            const whtrGradients = {
                'Extremely Lean': { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(59, 130, 246, 0.3)', icon: '⚡' },
                'Very Lean': { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(59, 130, 246, 0.3)', icon: '💎' },
                'Lean/Athletic': { gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.3)', icon: '💪' },
                'Healthy': { gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.3)', icon: '✅' },
                'Increased Risk': { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 158, 11, 0.3)', icon: '⚠️' },
                'High Risk': { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239, 68, 68, 0.3)', icon: '🚨' },
                'Very High Risk': { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239, 68, 68, 0.3)', icon: '🚨' }
            };
            
            const categoryStyle = whtrGradients[whtrCategory.category] || whtrGradients['Healthy'];
            
            // Get ethnicity and gender for comparative metrics
            const ethnicity = window.appState?.get('ethnicity') || 'prefer_not_to_say';
            const gender = window.appState?.get('calculator.gender') || 'male';
            const age = window.appState?.get('calculator.age') || 30;
            
            // Calculate optimal WHtR target (ethnicity/gender adjusted)
            const optimalWhtr = getOptimalWhtr(ethnicity, gender);
            const distanceFromOptimal = data.whtr - optimalWhtr.target;
            
            // Calculate percentile ranking
            const percentile = calculateWhtrPercentile(data.whtr, age, gender);
            
            // REDUCED PADDING BY 11% (from 28px to 25px)
            html += `
            <div style="background: ${categoryStyle.gradient}; padding: 25px; border-radius: 16px; box-shadow: 0 8px 24px ${categoryStyle.shadow}; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease, box-shadow 0.3s ease;" 
                 onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 32px ${categoryStyle.shadow.replace('0.3', '0.4')}';"
                 onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 24px ${categoryStyle.shadow}';">
                
                <!-- Background decoration -->
                <div style="position: absolute; top: -50px; right: -50px; width: 180px; height: 180px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; opacity: 0.5;"></div>
                <div style="position: absolute; bottom: -60px; left: -60px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
                
                <!-- Content -->
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="font-size: 35px; line-height: 1;">${categoryStyle.icon}</div>
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 5px;">Waist-to-Height Ratio</div>
                            <div style="font-size: 47px; font-weight: 800; color: white; line-height: 1;">
                                ${data.whtr.toFixed(3)}
                                <span style="font-size: 19px; font-weight: 600; opacity: 0.9; margin-left: 4px;">WHtR</span>
                            </div>
                            <div style="font-size: 11px; color: rgba(255, 255, 255, 0.85); margin-top: 4px;">
                                Advanced body composition metric
                            </div>
                        </div>
                    </div>
                    
                    <!-- Category Badge -->
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 11px 15px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3); margin-bottom: 13px; display: inline-block;">
                        <div style="font-size: 13px; font-weight: 700; color: white;">${whtrCategory.category}</div>
                    </div>
                    
                    <!-- Health Info -->
                    <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 12px 14px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3);">
                        <div style="font-size: 11px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px;">Health Assessment</div>
                        <div style="font-size: 13px; color: white; line-height: 1.4;">${whtrCategory.health_info}</div>
                    </div>
                    
                    <!-- Comparative Metrics Section -->
                    <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 12px 14px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3); margin-top: 9px;">
                        <div style="font-size: 11px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px;">📊 Comparative Metrics</div>
                        
                        <!-- Optimal Target -->
                        <div style="margin-bottom: 7px; padding: 9px 11px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                            <div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-bottom: 4px;">Optimal WHtR Target</div>
                            <div style="font-size: 15px; font-weight: 700; color: white;">
                                ${optimalWhtr.target.toFixed(3)}
                                <span style="font-size: 11px; font-weight: 400; opacity: 0.85; margin-left: 5px;">${optimalWhtr.description}</span>
                            </div>
                        </div>
                        
                        <!-- Distance from Optimal -->
                        <div style="margin-bottom: 7px; padding: 9px 11px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                            <div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-bottom: 4px;">Distance from Optimal</div>
                            <div style="font-size: 15px; font-weight: 700; color: white;">
                                ${((distanceFromOptimal / optimalWhtr.target) * 100).toFixed(1)}%
                                <span style="font-size: 11px; font-weight: 400; opacity: 0.85; margin-left: 5px;">
                                    ${Math.abs(distanceFromOptimal) < 0.01 ? 'At optimal' : distanceFromOptimal > 0 ? 'above optimal' : 'below optimal'}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Percentile Ranking -->
                        <div style="padding: 9px 11px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                            <div style="font-size: 11px; color: rgba(255,255,255,0.9); margin-bottom: 4px;">Percentile Ranking</div>
                            <div style="font-size: 15px; font-weight: 700; color: white;">
                                ${percentile}th percentile
                                <span style="font-size: 11px; font-weight: 400; opacity: 0.85; margin-left: 5px;">
                                    (${gender}, age ${age})
                                </span>
                            </div>
                            <div style="font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 4px;">
                                Better than ${percentile}% of your demographic
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        } else {
            html += `
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <div style="font-size: 14px; font-weight: 700; color: #92400e;">⚠️ Missing Data</div>
                <div style="font-size: 13px; line-height: 1.4; margin-top: 10px; color: #92400e;"><strong>Add waist measurement</strong> for WHtR.</div>
            </div>`;
        }
    }
    
    console.log('📍 Setting container innerHTML');
    container.innerHTML = html;
    
    // 🔥 CRITICAL: Wait for DOM update before attaching listeners
    setTimeout(() => {
        const viewDetailsBtn = container.querySelector('#viewBMIDetails');
        if (viewDetailsBtn) {
            console.log('✅ View Details button found, adding listener');
            viewDetailsBtn.addEventListener('click', () => {
                console.log('🔍 View Details clicked');
                const currentWeightInState = window.appState?.get('calculator.weight');
                const currentHeightInState = window.appState?.get('calculator.height');
                
                if (!currentWeightInState || !currentHeightInState) {
                    Modal.alert('Error', 'Weight or height data missing');
                    return;
                }
                
                let currentWeight = currentWeightInState;
                let heightCm = currentHeightInState;
                
                if (unit === 'imperial') {
                    currentWeight = currentWeight * 0.453592;
                    heightCm = heightCm * 2.54;
                }
                
                generateDetailedBMIModal(data, currentWeight, heightCm);
            });
        } else {
            console.warn('⚠️ View Details button NOT found');
        }
    }, 100);
    
    console.log('✅ displayResults completed');
}

function getGoalTip(goal) {
    const tips = {
        aggressiveCut: 'Fast results but challenging to maintain. Best for short-term cuts with high discipline.',
        moderateCut: 'Balanced approach with steady progress. Most sustainable option for fat loss.',
        mildCut: 'Gentle deficit perfect for preserving muscle while slowly losing fat. Great for lean individuals.',
        maintenance: 'Ideal for body recomposition, diet breaks, or maintaining your current physique.',
        leanBulk: 'Slow muscle gain while minimizing fat. Best for natural lifters and long-term gains.',
        bulking: 'Classic bulk for faster muscle growth. Expect some fat gain along with muscle.',
        dirtyBulk: 'Maximum calorie surplus for rapid muscle gain. Significant fat gain expected.'
    };
    return tips[goal] || '';
}