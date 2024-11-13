import { CONFIG } from './config.js';
import { historyManager } from './historyManager.js';
import { securityManager } from './securityManager.js';

export const alarmManager = {
    init() {
        this.alarms = new Map();
        this.activeAlarms = new Set();
        this.thresholds = this.initializeThresholds();
        this.initializeAlarms();
        this.setupEventListeners();
    },

    initializeThresholds() {
        return {
            temperature: {
                warning: CONFIG.alarms?.temperature?.warning || 150,
                critical: CONFIG.alarms?.temperature?.critical || 175
            },
            pressure: {
                warning: CONFIG.alarms?.pressure?.warning || 80,
                critical: CONFIG.alarms?.pressure?.critical || 90
            }
        };
    },

    setupEventListeners() {
        document.addEventListener('temperatureChange', this.handleTemperatureAlarm.bind(this));
        document.addEventListener('pressureChange', this.handlePressureAlarm.bind(this));
        document.addEventListener('securityAlert', this.handleSecurityAlarm.bind(this));
        document.addEventListener('systemAlert', this.handleSystemAlarm.bind(this));
    },

    startMonitoring() {
        setInterval(() => {
            this.checkActiveAlarms();
        }, CONFIG.alarms?.checkInterval || 5000);
    },

    addAlarm(alarm) {
        const alarmId = Date.now().toString();
        const newAlarm = {
            id: alarmId,
            timestamp: new Date(),
            status: 'active',
            ...alarm
        };

        this.alarms.set(alarmId, newAlarm);
        this.activeAlarms.add(alarmId);

        if (alarm.severity === 'critical') {
            this.handleCriticalAlarm(newAlarm);
        }

        this.notifyAlarm(newAlarm);
        this.updateAlarmStats();
        
        historyManager.addEntry({
            type: 'alarm',
            severity: alarm.severity,
            details: newAlarm
        });

        return alarmId;
    },

    handleCriticalAlarm(alarm) {
        if (this.activeAlarms.size >= CONFIG.alarms?.maxCritical) {
            securityManager.lockSystem('Trop d\'alarmes critiques actives');
        }
    },

    acknowledgeAlarm(alarmId, userId) {
        const alarm = this.alarms.get(alarmId);
        if (!alarm) return false;

        alarm.status = 'acknowledged';
        alarm.acknowledgedBy = userId;
        alarm.acknowledgedAt = new Date();

        this.activeAlarms.delete(alarmId);
        this.acknowledgedAlarms.add(alarmId);

        this.notifyAlarmUpdate(alarm);
        this.updateAlarmStats();

        return true;
    },

    resolveAlarm(alarmId, resolution) {
        const alarm = this.alarms.get(alarmId);
        if (!alarm) return false;

        alarm.status = 'resolved';
        alarm.resolution = resolution;
        alarm.resolvedAt = new Date();

        this.activeAlarms.delete(alarmId);
        this.acknowledgedAlarms.delete(alarmId);

        this.notifyAlarmUpdate(alarm);
        this.updateAlarmStats();

        return true;
    },

    notifyAlarm(alarm) {
        const event = new CustomEvent('alarmTriggered', {
            detail: alarm
        });
        document.dispatchEvent(event);
    },

    notifyAlarmUpdate(alarm) {
        const event = new CustomEvent('alarmUpdated', {
            detail: alarm
        });
        document.dispatchEvent(event);
    },

    getActiveAlarms() {
        return Array.from(this.activeAlarms)
            .map(id => this.alarms.get(id))
            .filter(alarm => alarm !== undefined);
    },

    getAlarmStats() {
        const stats = {
            total: this.alarms.size,
            active: this.activeAlarms.size,
            acknowledged: this.acknowledgedAlarms.size,
            bySeverity: {
                critical: 0,
                warning: 0,
                info: 0
            }
        };

        this.alarms.forEach(alarm => {
            if (alarm.severity in stats.bySeverity) {
                stats.bySeverity[alarm.severity]++;
            }
        });

        return stats;
    }
};
