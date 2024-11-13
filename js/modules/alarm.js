import { CONFIG } from './config.js';
import { securityManager } from './securityManager.js';
import { historyManager } from './historyManager.js';

class AlarmSystem {
    constructor() {
        this.alarms = new Map();
        this.activeAlarms = new Set();
        this.acknowledgedAlarms = new Set();
        this.alarmThresholds = new Map();
        this.severityLevels = ['normal', 'warning', 'critical'];
        this.init();
    }

    init() {
        this.loadThresholds();
        this.setupEventListeners();
        this.startMonitoring();
    }

    loadThresholds() {
        CONFIG.alarms?.thresholds.forEach(threshold => {
            this.alarmThresholds.set(threshold.type, {
                warning: threshold.warning,
                critical: threshold.critical
            });
        });
    }

    setupEventListeners() {
        document.addEventListener('temperatureChange', this.handleTemperatureEvent.bind(this));
        document.addEventListener('pressureChange', this.handlePressureEvent.bind(this));
        document.addEventListener('securityAlert', this.handleSecurityEvent.bind(this));
        document.addEventListener('systemAlert', this.handleSystemEvent.bind(this));
    }

    startMonitoring() {
        setInterval(() => {
            this.checkActiveAlarms();
            this.updateAlarmStats();
        }, CONFIG.alarms?.checkInterval || 5000);
    }

    handleTemperatureEvent(event) {
        const { zoneId, temperature } = event.detail;
        const threshold = this.alarmThresholds.get('temperature');
        
        if (temperature >= threshold.critical) {
            this.createAlarm({
                type: 'temperature',
                severity: 'critical',
                message: `Température critique - Zone ${zoneId}`,
                location: `Zone ${zoneId}`,
                temperature,
                details: `Dépassement du seuil critique de ${threshold.critical}°C`
            });
        } else if (temperature >= threshold.warning) {
            this.createAlarm({
                type: 'temperature',
                severity: 'warning',
                message: `Température élevée - Zone ${zoneId}`,
                location: `Zone ${zoneId}`,
                temperature,
                details: `Dépassement du seuil d'avertissement de ${threshold.warning}°C`
            });
        }
    }

    createAlarm(alarmData) {
        const alarmId = Date.now().toString();
        const alarm = {
            id: alarmId,
            timestamp: new Date(),
            status: 'active',
            ...alarmData
        };

        this.alarms.set(alarmId, alarm);
        this.activeAlarms.add(alarmId);

        if (alarm.severity === 'critical') {
            this.handleCriticalAlarm(alarm);
        }

        this.notifyAlarmCreated(alarm);
        this.updateAlarmStats();
        
        historyManager.addEntry({
            type: 'alarm',
            severity: alarm.severity,
            details: alarm
        });

        return alarmId;
    }

    handleCriticalAlarm(alarm) {
        if (this.getActiveCriticalAlarms().length >= CONFIG.alarms?.maxCritical) {
            securityManager.lockSystem('Trop d\'alarmes critiques actives');
        }
    }

    getActiveCriticalAlarms() {
        return Array.from(this.activeAlarms)
            .map(id => this.alarms.get(id))
            .filter(alarm => alarm.severity === 'critical');
    }

    notifyAlarmCreated(alarm) {
        document.dispatchEvent(new CustomEvent('alarmCreated', { detail: alarm }));
    }

    updateAlarmStats() {
        const stats = this.severityLevels.reduce((acc, severity) => {
            acc[severity] = Array.from(this.activeAlarms)
                .map(id => this.alarms.get(id))
                .filter(alarm => alarm.severity === severity)
                .length;
            return acc;
        }, {});

        document.dispatchEvent(new CustomEvent('alarmStatsUpdated', { detail: stats }));
    }
}

export const alarmSystem = new AlarmSystem(); 