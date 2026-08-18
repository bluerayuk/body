// tracker.js - FIXED: Missing start_weight and current_weight values

class WeightTracker {
    constructor() {
        this.chart = null;
        this.currentProfile = null;
        this.chartConfig = null;
        this.canvasParent = null;
        this.originalCanvasId = 'weightChart';
    }
    
    init() {
        const addBtn = document.getElementById('addWeightBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addWeightEntry());
        }
        
        this.updateTrackerUnitLabel();
        
        const canvas = document.getElementById(this.originalCanvasId);
        if (canvas) {
            this.canvasParent = canvas.parentElement;
        }
        
        if (window.appState) {
            window.appState.subscribe('currentProfile', (profileName) => {
                this.currentProfile = profileName;
                this.refresh(true);
            });
            
            window.appState.subscribe('unit', () => {
                this.updateTrackerUnitLabel();
            });
        }
        
        console.log('✅ Weight Tracker initialized');
    }
    
    updateTrackerUnitLabel() {
        const unitLabel = document.getElementById('trackerWeightUnit');
        if (unitLabel) {
            const unit = window.appState ? window.appState.get('unit') : 'metric';
            unitLabel.textContent = unit === 'metric' ? 'kg' : 'lbs';
        }
    }
    
    async addWeightEntry() {
        const profile = window.appState ? window.appState.get('currentProfile') : null;
        
        if (!profile) {
            Toast.warning('Please select a profile first');
            return;
        }
        
        const weightInput = document.getElementById('newWeight');
        const weight = parseFloat(weightInput.value);
        
        if (!weight || weight < 10 || weight > 500) {
            Toast.warning('Please enter a valid weight between 10 and 500');
            return;
        }
        
        try {
            const unit = window.appState ? window.appState.get('unit') : 'metric';
            
            console.log('💾 Adding weight entry:', weight, unit);
            const result = await API.addWeightEntry(profile, weight, unit);
            
            if (result.success) {
                console.log('✅ Weight entry added successfully');
                weightInput.value = '';
                
                API.invalidateCache(`weight_log:${profile}`);
                API.invalidateCache(`weight_stats:${profile}`);
                
                await this.refresh(true);
                
                Toast.success(`Weight logged: ${weight} ${unit} 📊`);
            } else {
                console.error('❌ Failed to add weight entry:', result.error);
                Toast.error(result.error || 'Failed to add weight entry');
            }
        } catch (error) {
            console.error('❌ Exception adding weight entry:', error);
            Toast.error('Failed to add weight entry: ' + error.message);
        }
    }
    
    async deleteWeightEntry(index) {
        const profile = window.appState ? window.appState.get('currentProfile') : null;
        if (!profile) {
            console.error('❌ No profile selected');
            Toast.warning('Please select a profile first');
            return;
        }
        
        console.log('='.repeat(60));
        console.log('🗑️ DELETE WEIGHT ENTRY');
        console.log(`   Profile: ${profile}`);
        console.log(`   Index: ${index}`);
        console.log('='.repeat(60));
        
        try {
            const confirmed = await Modal.confirm(
                'Delete Entry',
                'Are you sure you want to delete this weight entry?'
            );
            
            console.log(`   User confirmed: ${confirmed}`);
            
            if (!confirmed) {
                console.log('❌ User cancelled deletion');
                return;
            }
            
            console.log('📤 Calling API.deleteWeightEntry...');
            const result = await API.deleteWeightEntry(profile, index);
            
            console.log('📥 API response:', result);
            
            if (result.success) {
                console.log('✅ Weight entry deleted successfully');
                
                API.invalidateCache(`weight_log:${profile}`);
                API.invalidateCache(`weight_stats:${profile}`);
                
                await this.refresh(true);
                
                Toast.success('Entry deleted successfully ✅');
            } else {
                console.error('❌ Failed to delete entry:', result.error);
                Toast.error(result.error || 'Failed to delete entry');
            }
        } catch (error) {
            console.error('❌ Exception deleting entry:', error);
            console.error('Stack trace:', error.stack);
            Toast.error('Failed to delete entry: ' + error.message);
        }
        
        console.log('='.repeat(60));
    }
    
    async refresh(forceRefresh = false) {
        const profile = window.appState ? window.appState.get('currentProfile') : null;
        
        if (!profile) {
            this.clearDisplays();
            return;
        }
        
        try {
            console.log(`🔄 Refreshing tracker (force=${forceRefresh})...`);
            
            const [log, stats] = await Promise.all([
                API.getWeightLog(profile, forceRefresh),
                API.getWeightStats(profile)
            ]);
            
            console.log(`📊 Loaded ${log.length} weight entries`);
            console.log('📊 Stats received:', stats);
            
            this.updateStats(stats, log);
            await this.updateChart(log);
            this.updateHistory(log);
            this.updateTrackerUnitLabel();
            
            console.log('✅ Tracker refresh complete');
        } catch (error) {
            console.error('❌ Error refreshing tracker:', error);
            Toast.error('Failed to load tracker data: ' + error.message);
        }
    }
    
    clearDisplays() {
        document.getElementById('statsContainer').innerHTML = 
            '<p class="placeholder">Select a profile to view stats</p>';
        
        document.getElementById('weightHistoryList').innerHTML = 
            '<p class="placeholder">No data available</p>';
        
        this.destroyChart();
    }
    
    updateStats(stats, log) {
        const statsContainer = document.getElementById('statsContainer');
        statsContainer.innerHTML = '';
        
        if (!stats || log.length === 0) {
            statsContainer.innerHTML = 
                '<p class="placeholder">No weight data yet. Add your first entry!</p>';
            return;
        }
        
        console.log('🔍 Processing stats:', stats);
        console.log('🔍 Log entries:', log.length);
        
        // 🔥 FIX: Get values from stats object OR calculate from log
        let startWeight = stats.start_value || stats.start_weight;
        let currentWeight = stats.current_value || stats.current_weight;
        
        // If still missing, calculate from log directly
        if (!startWeight && log.length > 0) {
            startWeight = log[0].weight;
            console.log('📊 Calculated start_weight from log:', startWeight);
        }
        
        if (!currentWeight && log.length > 0) {
            currentWeight = log[log.length - 1].weight;
            console.log('📊 Calculated current_weight from log:', currentWeight);
        }
        
        const totalChange = stats.total_change;
        const avgWeeklyChange = stats.avg_weekly_change;
        
        // Calculate days of tracking (unique calendar days)
        let daysTracking = 0;
        let uniqueCalendarDays = 0;
        
        if (log.length >= 2) {
            try {
                const firstDate = new Date(log[0].timestamp);
                const lastDate = new Date(log[log.length - 1].timestamp);
                daysTracking = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24));
                
                const uniqueDates = new Set();
                log.forEach(entry => {
                    const entryDate = new Date(entry.timestamp);
                    const dateString = entryDate.toISOString().split('T')[0];
                    uniqueDates.add(dateString);
                });
                uniqueCalendarDays = uniqueDates.size;
                
                console.log(`📅 Time span: ${daysTracking} days, Unique calendar days: ${uniqueCalendarDays}`);
            } catch (e) {
                console.error('Error calculating days:', e);
            }
        }
        
        const statItems = [
            { 
                key: 'start_weight', 
                value: startWeight,
                label: 'Starting Weight', 
                description: 'Your first recorded weight',
                unit: true 
            },
            { 
                key: 'current_weight', 
                value: currentWeight,
                label: 'Current Weight', 
                description: 'Your most recent weight',
                unit: true 
            },
            { 
                key: 'total_change',
                value: totalChange,
                label: 'Total Change', 
                description: 'Difference from start to current',
                unit: true, 
                signed: true 
            },
            { 
                key: 'avg_weekly_change',
                value: avgWeeklyChange,
                label: 'Avg Weekly Change', 
                description: 'Calculated from trend line of all entries',
                unit: true, 
                signed: true,
                isWeekly: true
            }
        ];
        
        statItems.forEach(({ key, value, label, description, unit, signed, isWeekly }) => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            
            let displayValue = '---';
            let tooltipContent = '';
            
            if (isWeekly && (value === null || value === undefined)) {
                if (log.length < 2) {
                    displayValue = '---';
                    tooltipContent = '📊 Need at least 2 entries to calculate weekly average';
                } else if (uniqueCalendarDays < 3) {
                    displayValue = '---';
                    tooltipContent = `⏱️ Tracked ${uniqueCalendarDays} day${uniqueCalendarDays !== 1 ? 's' : ''}\nNeed 3+ different days for calculation`;
                } else {
                    displayValue = '---';
                    tooltipContent = '📊 Calculating...';
                }
            } else if (value !== null && value !== undefined) {
                displayValue = value.toFixed(1);
                if (signed && value > 0) displayValue = '+' + displayValue;
                if (unit) displayValue += ' kg';
                
                // Build tooltip for weekly average
                if (isWeekly) {
                    let status = '';
                    if (uniqueCalendarDays < 7) {
                        status = '⚠️ Early estimate';
                    } else if (uniqueCalendarDays < 14) {
                        status = '📊 Good reliability';
                    } else {
                        status = '✅ Highly reliable';
                    }
                    
                    tooltipContent = `📊 Tracking Progress\n\n` +
                                   `• Tracked on ${uniqueCalendarDays} different day${uniqueCalendarDays !== 1 ? 's' : ''}\n` +
                                   `• Status: ${status}\n\n` +
                                   `Recommendations:\n` +
                                   `• Track 7+ days for reliability\n` +
                                   `• Track 14+ days for best accuracy`;
                }
            }
            
            // Add info icon for weekly average
            const titleHtml = isWeekly ? 
                `${label} <span class="info-icon" style="cursor: help; opacity: 0.6; font-size: 14px; margin-left: 4px;">ℹ️</span>` : 
                label;
            
            card.innerHTML = `
                <div class="stat-card-title">${titleHtml}</div>
                <div class="stat-card-value">${displayValue}</div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 6px; line-height: 1.3;">
                    ${description}
                </div>
            `;
            
            // Add tooltip functionality for weekly average
            if (isWeekly && tooltipContent) {
                card.style.position = 'relative';
                
                const tooltip = document.createElement('div');
                tooltip.className = 'stat-tooltip';
                tooltip.style.cssText = `
                    position: absolute;
                    bottom: 110%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 12px;
                    line-height: 1.6;
                    white-space: pre-line;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    z-index: 1000;
                    min-width: 280px;
                    max-width: 320px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                `;
                tooltip.textContent = tooltipContent;
                
                // Add arrow
                const arrow = document.createElement('div');
                arrow.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid rgba(0, 0, 0, 0.9);
                `;
                tooltip.appendChild(arrow);
                
                card.appendChild(tooltip);
                
                // Show/hide tooltip on hover
                card.addEventListener('mouseenter', () => {
                    tooltip.style.opacity = '1';
                });
                
                card.addEventListener('mouseleave', () => {
                    tooltip.style.opacity = '0';
                });
                
                card.style.cursor = 'help';
            }
            
            statsContainer.appendChild(card);
        });
        
        // Banners removed - all info now in tooltip on hover ✨
    }
    
    async updateChart(log) {
        console.log('📊 updateChart called with', log.length, 'entries');
        
        this.destroyChart();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        let canvas = document.getElementById(this.originalCanvasId);
        
        if (!canvas && this.canvasParent) {
            console.log('🔄 Recreating canvas element');
            canvas = document.createElement('canvas');
            canvas.id = this.originalCanvasId;
            this.canvasParent.appendChild(canvas);
        }
        
        if (!canvas) {
            console.error('❌ Canvas element not found');
            return;
        }
        
        if (log.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            console.log('📊 Chart cleared - no data');
            return;
        }
        
        this.resetCanvas(canvas);
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const dates = log.map(e => {
            const date = new Date(e.timestamp);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const weights = log.map(e => e.weight);
        
        const trend = weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0;
        const isGaining = trend > 0;
        const isLosing = trend < 0;
        
        let lineColor = '#667eea';
        let gradientColor1 = 'rgba(102, 126, 234, 0.4)';
        let gradientColor2 = 'rgba(102, 126, 234, 0.01)';
        
        if (isLosing) {
            lineColor = '#10b981';
            gradientColor1 = 'rgba(16, 185, 129, 0.4)';
            gradientColor2 = 'rgba(16, 185, 129, 0.01)';
        } else if (isGaining) {
            lineColor = '#3b82f6';
            gradientColor1 = 'rgba(59, 130, 246, 0.4)';
            gradientColor2 = 'rgba(59, 130, 246, 0.01)';
        }
        
        console.log('📊 Creating chart with', weights.length, 'data points');
        
        const isDark = document.documentElement.classList.contains('dark-mode');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
        const textColor = isDark ? '#f1f5f9' : '#1e293b';
        
        this.chartConfig = {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Weight Progress',
                    data: weights,
                    borderColor: lineColor,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, gradientColor1);
                        gradient.addColorStop(1, gradientColor2);
                        return gradient;
                    },
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: lineColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 3,
                    pointHoverBorderWidth: 4,
                    pointHoverBackgroundColor: lineColor,
                    pointHoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 10,
                        left: 10
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            font: {
                                size: 14,
                                weight: '600',
                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
                            },
                            color: textColor,
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8,
                            boxHeight: 8
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: lineColor,
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false,
                        titleFont: {
                            size: 13,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 15,
                            weight: '700'
                        },
                        callbacks: {
                            title: (context) => context[0].label,
                            label: (context) => {
                                const weight = context.parsed.y.toFixed(1);
                                const unit = window.appState?.get('unit') === 'imperial' ? 'lbs' : 'kg';
                                return `${weight} ${unit}`;
                            },
                            afterLabel: (context) => {
                                if (context.dataIndex > 0) {
                                    const current = context.parsed.y;
                                    const previous = context.dataset.data[context.dataIndex - 1];
                                    const change = current - previous;
                                    const sign = change > 0 ? '+' : '';
                                    const unit = window.appState?.get('unit') === 'imperial' ? 'lbs' : 'kg';
                                    return `\nChange: ${sign}${change.toFixed(1)} ${unit}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: true,
                            color: gridColor,
                            lineWidth: 1,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            padding: 8,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        display: true,
                        beginAtZero: false,
                        grid: {
                            display: true,
                            color: gridColor,
                            lineWidth: 1,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            font: {
                                size: 12,
                                weight: '600'
                            },
                            padding: 10,
                            callback: (value) => {
                                const unit = window.appState?.get('unit') === 'imperial' ? 'lbs' : 'kg';
                                return `${value.toFixed(1)} ${unit}`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        };
        
        try {
            this.chart = new Chart(canvas, this.chartConfig);
            console.log(`✅ Chart created with ${log.length} data points`);
        } catch (error) {
            console.error('❌ Failed to create chart:', error);
        }
    }
    
    resetCanvas(canvas) {
        console.log('🔄 Resetting canvas...');
        
        try {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const parentWidth = canvas.parentElement.clientWidth;
            const parentHeight = canvas.parentElement.clientHeight;
            
            canvas.width = 1;
            canvas.height = 1;
            void canvas.offsetHeight;
            
            canvas.width = parentWidth || 600;
            canvas.height = parentHeight || 400;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            console.log(`✅ Canvas reset to ${canvas.width}x${canvas.height}`);
        } catch (error) {
            console.error('❌ Error resetting canvas:', error);
        }
    }
    
    destroyChart() {
        if (this.chart) {
            console.log('🗑️ Destroying chart...');
            
            try {
                this.chart.destroy();
                this.chart = null;
                this.chartConfig = null;
                
                const canvas = document.getElementById(this.originalCanvasId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    canvas.width = 1;
                    canvas.height = 1;
                    void canvas.offsetHeight;
                    
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                if (window.gc) {
                    window.gc();
                }
                
                console.log('✅ Chart destroyed');
            } catch (error) {
                console.error('❌ Error destroying chart:', error);
            }
        }
    }
    
    updateHistory(log) {
        const historyList = document.getElementById('weightHistoryList');
        
        if (log.length === 0) {
            historyList.innerHTML = '<p class="placeholder">No weight entries yet</p>';
            return;
        }
        
        const reversedLog = [...log].reverse();
        const profile = window.appState?.get('currentProfile');
        
        console.log('='.repeat(60));
        console.log('📋 RENDERING WEIGHT HISTORY');
        console.log(`   Profile: ${profile}`);
        console.log(`   Entries: ${reversedLog.length}`);
        console.log('='.repeat(60));
        
        historyList.innerHTML = reversedLog.map((entry, i) => {
            const originalIndex = log.length - 1 - i;
            const unit = entry.unit === 'metric' ? 'kg' : 'lbs';
            const escapedProfile = profile.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            
            console.log(`   Entry ${i}: index=${originalIndex}, weight=${entry.weight} ${unit}`);
            
            return `
                <div class="weight-entry" 
                     data-index="${originalIndex}"
                     style="display: flex; justify-content: space-between; align-items: center; 
                            padding: 12px; background: var(--bg-gray); border-radius: 8px; 
                            margin-bottom: 10px; transition: all 0.2s ease;">
                    <div class="weight-entry-content" style="display: flex; align-items: center; gap: 12px; flex: 1;">
                        <div>
                            <div style="font-weight: 600; font-size: 15px;">
                                ${entry.weight.toFixed(1)} ${unit}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                                ${entry.timestamp}
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-danger" 
                            style="padding: 6px 10px; font-size: 12px;"
                            onclick="(async function() {
                                console.log('🗑️ Inline delete clicked for index ${originalIndex}');
                                try {
                                    const confirmed = await window.Modal.confirm('Delete Entry', 'Are you sure you want to delete this weight entry?');
                                    if (!confirmed) {
                                        console.log('❌ User cancelled');
                                        return;
                                    }
                                    console.log('📤 Calling API...');
                                    const result = await window.API.deleteWeightEntry('${escapedProfile}', ${originalIndex});
                                    console.log('📥 Result:', result);
                                    if (result.success) {
                                        window.API.invalidateCache('weight_log:${escapedProfile}');
                                        window.API.invalidateCache('weight_stats:${escapedProfile}');
                                        await window.weightTracker.refresh(true);
                                        window.Toast.success('Entry deleted ✅');
                                    } else {
                                        window.Toast.error(result.error || 'Delete failed');
                                    }
                                } catch (error) {
                                    console.error('❌ Delete error:', error);
                                    window.Toast.error('Delete failed: ' + error.message);
                                }
                            })()"
                            type="button">
                        🗑️ Delete
                    </button>
                </div>
            `;
        }).join('');
        
        console.log('✅ Weight history rendered with inline handlers');
        console.log('⛔ Drag and drop DISABLED for weight history');
        console.log('='.repeat(60));
    }
    
    cleanup() {
        console.log('🧹 Cleaning up Weight Tracker...');
        
        const historyList = document.getElementById('weightHistoryList');
        if (historyList && window.dragDropManager) {
            window.dragDropManager.cleanup(historyList);
        }
        
        this.destroyChart();
        this.currentProfile = null;
        this.canvasParent = null;
        
        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) statsContainer.innerHTML = '';
        
        if (historyList) historyList.innerHTML = '';
        
        console.log('✅ Weight Tracker cleaned up');
    }
}

// Create global instance
window.weightTracker = new WeightTracker();

// Register with init manager
if (window.initManager) {
    window.initManager.register('tracker', () => {
        window.weightTracker.init();
        return () => window.weightTracker.cleanup();
    });
}