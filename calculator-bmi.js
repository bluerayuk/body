// calculator-bmi.js - COMPLETE with Beautiful Gradient Styling - ENHANCED VERSION (20% Taller)

function getBMIDetails(bmi, heightCm, currentWeight) {
    const heightM = heightCm / 100;
    const minHealthyWeight = (18.5 * heightM * heightM);
    const maxHealthyWeight = (25 * heightM * heightM);
    
    let weightToLose = 0;
    let weightToGain = 0;
    let status = '';
    
    if (bmi < 18.5) {
        weightToGain = minHealthyWeight - currentWeight;
        status = 'underweight';
    } else if (bmi >= 30) {
        weightToLose = currentWeight - maxHealthyWeight;
        status = 'obese';
    } else if (bmi >= 25) {
        weightToLose = currentWeight - maxHealthyWeight;
        status = 'overweight';
    } else {
        status = 'healthy';
    }
    
    const categories = {
        'Underweight': {
            icon: '⚠️',
            color: '#3b82f6',
            bg1: '#dbeafe',
            bg2: '#bfdbfe',
            text: '#1e3a8a',
            insight: 'May indicate malnutrition or health issues',
            recommendation: 'Consider consulting a healthcare provider about healthy weight gain strategies',
            riskLevel: 'Increased health risks'
        },
        'Normal Weight': {
            icon: '✅',
            color: '#10b981',
            bg1: '#d1fae5',
            bg2: '#a7f3d0',
            text: '#065f46',
            insight: 'Associated with lowest health risks',
            recommendation: 'Maintain current weight through balanced diet and regular exercise',
            riskLevel: 'Optimal health range'
        },
        'Overweight': {
            icon: '⚠️',
            color: '#f59e0b',
            bg1: '#fef3c7',
            bg2: '#fde68a',
            text: '#92400e',
            insight: 'Increased risk of cardiovascular disease',
            recommendation: 'Consider gradual weight loss through calorie deficit and increased activity',
            riskLevel: 'Moderate health risks'
        },
        'Obese': {
            icon: '🚨',
            color: '#ef4444',
            bg1: '#fee2e2',
            bg2: '#fecaca',
            text: '#991b1b',
            insight: 'Significantly elevated health risks',
            recommendation: 'Strongly recommend consulting healthcare provider for personalized weight loss plan',
            riskLevel: 'High health risks'
        }
    };
    
    return {
        minHealthyWeight: minHealthyWeight.toFixed(1),
        maxHealthyWeight: maxHealthyWeight.toFixed(1),
        weightToLose: weightToLose.toFixed(1),
        weightToGain: weightToGain.toFixed(1),
        status,
        ...categories
    };
}

function getThresholdsForEthnicity(ethnicity) {
    console.log('🔍 Getting thresholds for ethnicity:', ethnicity);
    
    if (ethnicity === 'asian') {
        return {
            underweight: '< 18.5',
            normal: '18.5 - 22.9',
            overweight: '23.0 - 27.4',
            obese: '≥ 27.5',
            type: '🧬 Asian-Specific',
            color: '#f59e0b'
        };
    } else if (ethnicity === 'african') {
        return {
            underweight: '< 18.5',
            normal: '18.5 - 24.9',
            overweight: '25.0 - 29.9',
            obese: '≥ 30.0',
            type: '🧬 African (Standard)',
            color: '#3b82f6'
        };
    } else if (ethnicity === 'hispanic') {
        return {
            underweight: '< 18.5',
            normal: '18.5 - 24.9',
            overweight: '25.0 - 29.9',
            obese: '≥ 30.0',
            type: '🧬 Hispanic (Standard)',
            color: '#10b981'
        };
    } else {
        return {
            underweight: '< 18.5',
            normal: '18.5 - 24.9',
            overweight: '25.0 - 29.9',
            obese: '≥ 30.0',
            type: '📊 Standard (WHO)',
            color: '#6366f1'
        };
    }
}

function generateCondensedBMICard(data, currentWeight, heightCm) {
    // 🔥 FORCE FRESH VALUES - no caching
    const unit = window.appState?.get('unit') || 'metric';
    const ethnicity = window.appState?.get('ethnicity') || 'prefer_not_to_say';
    
    console.log('🎨 Rendering BMI card with ethnicity:', ethnicity);
    
    const bmi = data.bmi;
    const category = data.bmi_category.category;
    const details = getBMIDetails(bmi, heightCm, currentWeight);
    const categoryInfo = details[category];
    const thresholds = getThresholdsForEthnicity(ethnicity);
    
    // Map category to gradient colors - MUTED TONES
    const categoryGradients = {
        'Underweight': { gradient: 'linear-gradient(135deg, #3d6ba8, #2d5789)', shadow: 'rgba(61, 107, 168, 0.35)' },
        'Normal Weight': { gradient: 'linear-gradient(135deg, #1e8866, #177054)', shadow: 'rgba(30, 136, 102, 0.35)' },
        'Overweight': { gradient: 'linear-gradient(135deg, #c78229, #ad6f1f)', shadow: 'rgba(199, 130, 41, 0.35)' },
        'Obese': { gradient: 'linear-gradient(135deg, #b93838, #a02f2f)', shadow: 'rgba(185, 56, 56, 0.35)' }
    };
    
    const categoryStyle = categoryGradients[category] || categoryGradients['Normal Weight'];
    
    const weightUnit = unit === 'imperial' ? 'lbs' : 'kg';
    
    // Calculate optimal padding (17% increase from base)
    const basePadding = 22;
    const enhancedPadding = Math.round(basePadding * 1.17); // 26px
    
    let minWeight = parseFloat(details.minHealthyWeight);
    let maxWeight = parseFloat(details.maxHealthyWeight);
    let weightDiff = parseFloat(details.status === 'underweight' ? details.weightToGain : details.weightToLose);
    
    if (unit === 'imperial') {
        minWeight = (minWeight * 2.20462).toFixed(1);
        maxWeight = (maxWeight * 2.20462).toFixed(1);
        weightDiff = (weightDiff * 2.20462).toFixed(1);
    } else {
        minWeight = minWeight.toFixed(1);
        maxWeight = maxWeight.toFixed(1);
        weightDiff = weightDiff.toFixed(1);
    }
    
    const ethnicityNote = data.bmi_category.ethnicity_note || '';
    
    let comparisonNote = '';
    if (ethnicity === 'asian' && bmi >= 23 && bmi < 25) {
        comparisonNote = `Your BMI (${bmi.toFixed(1)}) would be "Normal Weight" under standard thresholds, but is "<strong>${category}</strong>" using Asian-specific thresholds.`;
    } else if (ethnicity === 'asian' && bmi >= 27.5 && bmi < 30) {
        comparisonNote = `Your BMI (${bmi.toFixed(1)}) would be "Overweight" under standard thresholds, but is "<strong>${category}</strong>" using Asian-specific thresholds.`;
    }
    
    // 🔥 UNIQUE ID using both ethnicity AND random number to FORCE re-render
    const uniqueId = `bmi-${ethnicity}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return `
        <div id="${uniqueId}" style="background: ${categoryStyle.gradient}; padding: ${enhancedPadding}px; border-radius: 15px; box-shadow: 0 7px 22px ${categoryStyle.shadow}; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.2); transition: transform 0.3s ease, box-shadow 0.3s ease;" 
             onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 28px ${categoryStyle.shadow.replace('0.3', '0.4')}';"
             onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 7px 22px ${categoryStyle.shadow}';">
            
            <!-- Background decoration -->
            <div style="position: absolute; top: -44px; right: -44px; width: 154px; height: 154px; background: rgba(255, 255, 255, 0.1); border-radius: 50%; opacity: 0.5;"></div>
            <div style="position: absolute; bottom: -55px; left: -55px; width: 176px; height: 176px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
            
            <!-- Content -->
            <div style="position: relative; z-index: 1;">
                <!-- BMI Header Section - Slightly increased spacing -->
                <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 17px;">
                    <div style="font-size: 37px; line-height: 1;">${categoryInfo.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 11px; font-weight: 700; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Body Mass Index</div>
                        <div style="font-size: 47px; font-weight: 800; color: white; line-height: 1;">
                            ${bmi.toFixed(1)}
                            <span style="font-size: 19px; font-weight: 600; opacity: 0.9; margin-left: 4px;">BMI</span>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 11px 17px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3);">
                        <div style="font-size: 14px; font-weight: 700; color: white; white-space: nowrap;">${category}</div>
                    </div>
                </div>
                
                <!-- Ethnicity Type Badge - Balanced -->
                <div style="font-size: 11px; color: rgba(255, 255, 255, 0.85); margin-bottom: 15px; padding: 7px 11px; background: rgba(255,255,255,0.15); border-radius: 8px; display: inline-block;">
                    ${thresholds.type}
                </div>
                
                ${comparisonNote ? `
                    <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 11px 15px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3); margin-bottom: 13px;">
                        <div style="font-size: 11px; color: white; line-height: 1.4;">
                            ${comparisonNote.includes('27.5') ? '<strong>🚨 Important:</strong>' : '<strong>⚠️ Important:</strong>'} 
                            ${comparisonNote}
                        </div>
                    </div>
                ` : ''}
                
                ${ethnicityNote ? `
                    <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 11px 15px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3); margin-bottom: 13px;">
                        <div style="font-size: 11px; color: white; line-height: 1.4;">
                            <strong>🧬 Note:</strong> ${ethnicityNote}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Thresholds Grid - Balanced -->
                <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 13px 15px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3); margin-bottom: 13px;">
                    <div style="font-size: 10px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 11px;">
                        ${thresholds.type} Thresholds
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 11px; color: white;">
                        <div style="padding: 8px 10px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 7px; border: 1px solid rgba(255,255,255,0.2);">
                            <strong>Underweight:</strong> ${thresholds.underweight}
                        </div>
                        <div style="padding: 8px 10px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 7px; border: 1px solid rgba(255,255,255,0.2);">
                            <strong>Normal:</strong> ${thresholds.normal}
                        </div>
                        <div style="padding: 8px 10px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 7px; border: 1px solid rgba(255,255,255,0.2);">
                            <strong>Overweight:</strong> ${thresholds.overweight}
                        </div>
                        <div style="padding: 8px 10px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 7px; border: 1px solid rgba(255,255,255,0.2);">
                            <strong>Obese:</strong> ${thresholds.obese}
                        </div>
                    </div>
                </div>
                
                <!-- Healthy Weight Range - Balanced layout -->
                <div style="background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); padding: 13px 15px; border-radius: 11px; border: 1px solid rgba(255,255,255,0.3); margin-bottom: 13px;">
                    <div style="font-size: 10px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 11px;">Healthy Weight Range</div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 11px;">
                        <div style="text-align: center;">
                            <div style="font-size: 23px; font-weight: 700; color: white;">${minWeight}</div>
                            <div style="font-size: 10px; color: rgba(255,255,255,0.85); margin-top: 2px;">${weightUnit}</div>
                        </div>
                        <div style="font-size: 17px; color: rgba(255,255,255,0.7);">—</div>
                        <div style="text-align: center;">
                            <div style="font-size: 23px; font-weight: 700; color: white;">${maxWeight}</div>
                            <div style="font-size: 10px; color: rgba(255,255,255,0.85); margin-top: 2px;">${weightUnit}</div>
                        </div>
                    </div>
                    
                    ${details.status !== 'healthy' ? `
                        <div style="margin-top: 11px; padding: 8px 12px; background: rgba(255,255,255,0.2); backdrop-filter: blur(5px); border-radius: 7px; text-align: center; border: 1px solid rgba(255,255,255,0.2);">
                            <div style="font-size: 12px; color: white; line-height: 1.3;">
                                ${details.status === 'underweight' ? 
                                    `<strong>💡 To reach healthy:</strong> Gain ~<strong>${weightDiff} ${weightUnit}</strong>` :
                                    `<strong>💡 To reach healthy:</strong> Lose ~<strong>${weightDiff} ${weightUnit}</strong>`
                                }
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- View Details Button - Balanced size -->
                <button id="viewBMIDetails" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); border-radius: 11px; color: white; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.3s ease;" 
                        onmouseover="this.style.background='rgba(255,255,255,0.35)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.2)';" 
                        onmouseout="this.style.background='rgba(255,255,255,0.25)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    ℹ️ View Detailed Analysis
                </button>
            </div>
        </div>
    `;
}

function generateDetailedBMIModal(data, currentWeight, heightCm) {
    const bmi = data.bmi;
    const category = data.bmi_category.category;
    const details = getBMIDetails(bmi, heightCm, currentWeight);
    const categoryInfo = details[category];
    const ethnicity = window.appState?.get('ethnicity') || 'prefer_not_to_say';
    const thresholds = getThresholdsForEthnicity(ethnicity);
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; overflow-y: auto;';
    
    const isDark = document.documentElement.classList.contains('dark-mode');
    const bgColor = isDark ? '#1e293b' : 'white';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    
    const standardCategory = bmi < 18.5 ? 'Underweight' : 
                             bmi < 25 ? 'Normal Weight' :
                             bmi < 30 ? 'Overweight' : 'Obese';
    
    const asianCategory = bmi < 18.5 ? 'Underweight' : 
                         bmi < 23 ? 'Normal Weight' :
                         bmi < 27.5 ? 'Overweight' : 'Obese';
    
    const showComparison = (ethnicity === 'asian' && standardCategory !== asianCategory) ||
                          (ethnicity !== 'asian' && ethnicity !== 'prefer_not_to_say');
    
    modal.innerHTML = `
        <div style="background: ${bgColor}; color: ${textColor}; padding: 30px; border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="font-size: 22px; margin: 0;">📊 Detailed BMI Analysis</h2>
                <button id="closeBMIModal" style="background: none; border: none; font-size: 28px; cursor: pointer; color: ${textColor}; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(0,0,0,0.1)'" onmouseout="this.style.background='none'">×</button>
            </div>
            
            <div style="background: linear-gradient(135deg, ${categoryInfo.bg1}, ${categoryInfo.bg2}); padding: 20px; border-radius: 12px; border-left: 6px solid ${categoryInfo.color}; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 13px; font-weight: 700; color: ${categoryInfo.text}; text-transform: uppercase; margin-bottom: 3px;">Your BMI</div>
                        <div style="font-size: 36px; font-weight: 700; color: ${categoryInfo.text};">${bmi.toFixed(1)}</div>
                        <div style="font-size: 11px; color: ${categoryInfo.text}; opacity: 0.7; margin-top: 2px;">${thresholds.type}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.7); padding: 12px 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 28px; margin-bottom: 5px;">${categoryInfo.icon}</div>
                        <div style="font-size: 13px; font-weight: 700; color: ${categoryInfo.text};">${category}</div>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.6); padding: 10px 15px; border-radius: 8px;">
                    <div style="font-size: 11px; font-weight: 700; color: ${categoryInfo.text}; text-transform: uppercase; margin-bottom: 5px;">Health Risk Level</div>
                    <div style="font-size: 14px; font-weight: 600; color: ${categoryInfo.text};">${categoryInfo.riskLevel}</div>
                </div>
            </div>
            
            ${showComparison || ethnicity === 'asian' ? `
                <div style="background: ${isDark ? '#334155' : '#f8fafc'}; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #f59e0b;">
                    <div style="font-size: 13px; font-weight: 700; color: ${textColor}; margin-bottom: 10px;">⚖️ Threshold Comparison</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border-radius: 6px; ${ethnicity === 'asian' ? 'border: 1px solid var(--border);' : 'border: 2px solid #3b82f6;'}">
                            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">Standard (WHO)</div>
                            <div style="font-size: 15px; font-weight: 600; color: ${textColor}; margin-bottom: 8px;">${standardCategory}</div>
                            <div style="font-size: 10px; color: var(--text-secondary);">
                                Normal: 18.5-24.9<br>
                                Overweight: 25-29.9<br>
                                Obese: ≥30
                            </div>
                        </div>
                        <div style="padding: 12px; background: ${isDark ? '#1e293b' : 'white'}; border-radius: 6px; ${ethnicity === 'asian' ? 'border: 2px solid #f59e0b;' : 'border: 1px solid var(--border);'}">
                            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 4px;">Asian-Specific</div>
                            <div style="font-size: 15px; font-weight: 600; color: #92400e; margin-bottom: 8px;">${asianCategory}</div>
                            <div style="font-size: 10px; color: var(--text-secondary);">
                                Normal: 18.5-22.9<br>
                                Overweight: 23-27.4<br>
                                Obese: ≥27.5
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: ${textColor}; opacity: 0.8; line-height: 1.4;">
                        ℹ️ Your BMI of <strong>${bmi.toFixed(1)}</strong> is categorized as <strong>${category}</strong> using ${thresholds.type} thresholds
                    </div>
                </div>
            ` : ''}
            
            <div style="background: ${isDark ? '#334155' : '#f8fafc'}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="font-size: 13px; font-weight: 700; color: ${textColor}; margin-bottom: 8px;">📊 Health Insight</div>
                <div style="font-size: 13px; color: ${textColor}; line-height: 1.5; opacity: 0.9;">${categoryInfo.insight}</div>
            </div>
            
            <div style="background: ${isDark ? '#334155' : '#f8fafc'}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="font-size: 13px; font-weight: 700; color: ${textColor}; margin-bottom: 8px;">💡 Recommendation</div>
                <div style="font-size: 13px; color: ${textColor}; line-height: 1.5; opacity: 0.9;">${categoryInfo.recommendation}</div>
            </div>
            
            <button id="closeBMIModalBtn" style="width: 100%; margin-top: 20px; padding: 12px; background: ${categoryInfo.color}; border: none; border-radius: 8px; color: white; font-weight: 600; font-size: 14px; cursor: pointer;">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    modal.querySelector('#closeBMIModal').addEventListener('click', closeModal);
    modal.querySelector('#closeBMIModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}