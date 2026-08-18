// waist-tracker.js - Waist Measurement Tracker (parallel to weight tracker)

class WaistTracker {
    constructor() {
        this.chart = null;
        this.currentProfile = null;
        this.chartConfig = null;
        this.canvasParent = null;
        this.originalCanvasId = 'waistChart';
    }
    
    init() {
        const addBtn = document.getElementById('addWaistBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addWaistEntry());
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
        
        console.log('✅ Waist Tracker initialized');
    }
    
    updateTrackerUnitLabel() {
        const unitLabel = document.getElementById('trackerWaistUnit');
        if (unitLabel) {
            const unit = window.appState ? window.appState.get('unit') : 'metric';
            unitLabel.textContent = unit === 'metric' ? 'cm' : 'in';
        }
    }
    
    async addWaistEntry() {
        const profile = window.appState ? window.appState.get('currentProfile') : null;
        
        if (!profile) {
            Toast.warning('Please select a profile first');
            return;
        }
        
        const waistInput = document.getElementById('newWaist');
        const waist = parseFloat(waistInput.value);
        
        if (!waist || waist < 20 || waist > 200) {
            Toast.warning('Please enter a valid waist measurement between 20 and 200');
            return;
        }
        
        try {
            const unit = window.appState ? window.appState.get('unit') : 'metric';
            
            console.log('💾 Adding waist entry:', waist, unit);
            const result = await API.addWaistEntry(profile, waist, unit);
            
            if (result.success) {
                console.log('✅ Waist entry added successfully');
                waistInput.value = '';
                
                API.invalidateCache(`waist_log:${profile}`);
                API.invalidateCache(`waist_stats:${profile}`);
                
                await this.refresh(true);
                
                Toast.success(`Waist logged: ${waist} ${unit === 'metric' ? 'cm' : 'in'} 📏`);
            } else {
                console.error('❌ Failed to add waist entry:', result.error);
                Toast.error(result.error || 'Failed to add waist entry');
            }
        } catch (error) {
            console.error('❌ Exception adding waist entry:', error);
            Toast.error('Failed to add waist entry: ' + error.message);
        }
    }
    
    async deleteWaistEntry(index) {
        const profile = window.appState ? window.appState.get('currentProfile') : null;
        if (!profile) {
            console.error('❌ No profile selected');
            Toast.warning('Please select a profile first');
            return;
        }
        
        console.log('='.repeat(60));
        console.log('🗑️ DELETE WAIST ENTRY');
        console.log(`   Profile: ${profile}`);
        console.log(`   Index: ${index}`);
        console.log('='.repeat(60));
        
        try {
            const confirmed = await Modal.confirm(
                'Delete Entry',
                'Are you sure you want to delete this waist entry?'
            );
            
            console.log(`   User confirmed: ${confirmed}`);
            
            if (!confirmed) {
                console.log('❌ User cancelled deletion');
                return;
            }
            
            console.log('📤 Calling API.deleteWaistEntry...');
            const result = await API.deleteWaistEntry(profile, index);
            
            console.log('📥 API response:', result);
            
            if (result.success) {
                console.log('✅ Waist entry deleted successfully');
                
                API.invalidateCache(`waist_log:${profile}`);
                API.invalidateCache(`waist_stats:${profile}`);
                
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
            console.log(`🔄 Refreshing waist tracker (force=${forceRefresh})...`);
            
            const [log, stats] = await Promise.all([
                API.getWaistLog(profile, forceRefresh),
                API.getWaistStats(profile)
            ]);
            
            console.log(`📊 Loaded ${log.length} waist entries`);
            
            this.updateStats(stats, log);
            await this.updateChart(log);
            this.updateHistory(log);
            this.updateTrackerUnitLabel();
            
            console.log('✅ Waist tracker refresh complete');
        } catch (error) {
            console.error('❌ Error refreshing waist tracker:', error);
            Toast.error('Failed to load waist tracker data: ' + error.message);
        }
    }
    
    clearDisplays() {
        document.getElementById('waistStatsContainer').innerHTML = 
            '<p class="placeholder">Select a profile to view stats</p>';
        
        document.getElementById('waistHistoryList').innerHTML = 
            '<p class="placeholder">No data available</p>';
        
        this.destroyChart();
    }
    
    updateStats(stats, log) {
        const statsContainer = document.getElementById('waistStatsContainer');
        statsContainer.innerHTML = '';
        
        if (!stats || log.length === 0) {
            statsContainer.innerHTML = 
                '<p class="placeholder">No waist data yet. Add your first entry!</p>';
            return;
        }
        
        const unit = window.appState?.get('unit') === 'imperial' ? 'in' : 'cm';
        
        const statItems = [
            { 
                key: 'start_waist', 
                label: 'Starting Waist', 
                description: 'Your first recorded waist measurement'
            },
            { 
                key: 'current_waist', 
                label: 'Current Waist', 
                description: 'Your most recent waist measurement'
            },
            { 
                key: 'total_change', 
                label: 'Total Change', 
                description: 'Difference from start to current',
                signed: true 
            },
            { 
                key: 'avg_weekly_change', 
                label: 'Avg Weekly Change', 
                description: 'Calculated from trend line of all entries',
                signed: true
            }
        ];
        
        statItems.forEach(({ key, label, description, signed }) => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            
            const value = stats[key];
            let displayValue = '---';
            
            if (value !== null && value !== undefined) {
                displayValue = value.toFixed(1);
                if (signed && value > 0) displayValue = '+' + displayValue;
                displayValue += ` ${unit}`;
            }
            
            card.innerHTML = `
                <div class="stat-card-title">${label}</div>
                <div class="stat-card-value">${displayValue}</div>
                <div style="font-size: 11px; color: var(--text-light); margin-top: 6px; line-height: 1.3;">
                    ${description}
                </div>
            `;
            
            statsContainer.appendChild(card);
        });
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
        const waists = log.map(e => e.waist);
        
        // Detect trend
        const trend = waists.length > 1 ? waists[waists.length - 1] - waists[0] : 0;
        const isIncreasing = trend > 0;
        const isDecreasing = trend < 0;
        
        let lineColor = '#f59e0b'; // Default orange
        let gradientColor1 = 'rgba(245, 158, 11, 0.4)';
        let gradientColor2 = 'rgba(245, 158, 11, 0.01)';
        
        if (isDecreasing) {
            lineColor = '#10b981'; // Green for waist decrease
            gradientColor1 = 'rgba(16, 185, 129, 0.4)';
            gradientColor2 = 'rgba(16, 185, 129, 0.01)';
        } else if (isIncreasing) {
            lineColor = '#ef4444'; // Red for waist increase
            gradientColor1 = 'rgba(239, 68, 68, 0.4)';
            gradientColor2 = 'rgba(239, 68, 68, 0.01)';
        }
        
        const isDark = document.documentElement.classList.contains('dark-mode');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
        const textColor = isDark ? '#f1f5f9' : '#1e293b';
        
        this.chartConfig = {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Waist Progress',
                    data: waists,
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
                    pointBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: textColor,
                            font: { size: 14, weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: lineColor,
                        borderWidth: 2,
                        callbacks: {
                            label: (context) => {
                                const waist = context.parsed.y.toFixed(1);
                                const unit = window.appState?.get('unit') === 'imperial' ? 'in' : 'cm';
                                return `${waist} ${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            callback: (value) => {
                                const unit = window.appState?.get('unit') === 'imperial' ? 'in' : 'cm';
                                return `${value.toFixed(1)} ${unit}`;
                            }
                        }
                    }
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
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = canvas.parentElement.clientWidth || 600;
        canvas.height = canvas.parentElement.clientHeight || 400;
    }
    
    destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
    
    updateHistory(log) {
        const historyList = document.getElementById('waistHistoryList');
        
        if (log.length === 0) {
            historyList.innerHTML = '<p class="placeholder">No waist entries yet</p>';
            return;
        }
        
        const reversedLog = [...log].reverse();
        const profile = window.appState?.get('currentProfile');
        
        historyList.innerHTML = reversedLog.map((entry, i) => {
            const originalIndex = log.length - 1 - i;
            const unit = entry.unit === 'metric' ? 'cm' : 'in';
            const escapedProfile = profile.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            
            return `
                <div class="waist-entry" 
                     data-index="${originalIndex}"
                     style="display: flex; justify-content: space-between; align-items: center; 
                            padding: 12px; background: var(--bg-gray); border-radius: 8px; 
                            margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 15px;">
                            ${entry.waist.toFixed(1)} ${unit}
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                            ${entry.timestamp}
                        </div>
                    </div>
                    <button class="btn btn-danger" 
                            style="padding: 6px 10px; font-size: 12px;"
                            onclick="(async function() {
                                const confirmed = await window.Modal.confirm('Delete Entry', 'Are you sure?');
                                if (!confirmed) return;
                                const result = await window.API.deleteWaistEntry('${escapedProfile}', ${originalIndex});
                                if (result.success) {
                                    window.API.invalidateCache('waist_log:${escapedProfile}');
                                    window.API.invalidateCache('waist_stats:${escapedProfile}');
                                    await window.waistTracker.refresh(true);
                                    window.Toast.success('Entry deleted ✅');
                                } else {
                                    window.Toast.error(result.error || 'Delete failed');
                                }
                            })()"
                            type="button">
                        🗑️ Delete
                    </button>
                </div>
            `;
        }).join('');
    }
    
    cleanup() {
        this.destroyChart();
        this.currentProfile = null;
    }
}

// Create global instance
window.waistTracker = new WaistTracker();

// Register with init manager
if (window.initManager) {
    window.initManager.register('waistTracker', () => {
        window.waistTracker.init();
        return () => window.waistTracker.cleanup();
    }, ['app']);
}