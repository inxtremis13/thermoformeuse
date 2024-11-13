import { CONFIG } from './config.js';
import { historyManager } from './historyManager.js';

class LogManager {
    constructor() {
        this.logs = [];
        this.maxLogs = CONFIG.logging?.maxEntries || 1000;
        this.logLevels = new Set(['info', 'warning', 'error', 'critical']);
        this.activeFilters = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeLogRotation();
    }

    setupEventListeners() {
        document.addEventListener('alarmTriggered', this.handleAlarmEvent.bind(this));
        document.addEventListener('systemStateChange', this.handleSystemEvent.bind(this));
        document.addEventListener('maintenanceTask', this.handleMaintenanceEvent.bind(this));
        document.addEventListener('securityAlert', this.handleSecurityEvent.bind(this));
    }

    addLog(entry) {
        const logEntry = {
            id: Date.now(),
            timestamp: new Date(),
            ...entry
        };

        this.logs.unshift(logEntry);
        this.trimLogs();
        this.notifyNewLog(logEntry);
        
        if (entry.severity === 'critical' || entry.severity === 'error') {
            historyManager.addEntry({
                type: 'log',
                severity: entry.severity,
                details: entry
            });
        }
    }

    handleAlarmEvent(event) {
        const { type, severity, message } = event.detail;
        this.addLog({
            type: 'alarm',
            severity,
            message,
            source: 'AlarmManager'
        });
    }

    handleSystemEvent(event) {
        const { state, details } = event.detail;
        this.addLog({
            type: 'system',
            severity: 'info',
            message: `État système: ${state}`,
            details,
            source: 'SystemManager'
        });
    }

    handleMaintenanceEvent(event) {
        const { taskType, description } = event.detail;
        this.addLog({
            type: 'maintenance',
            severity: 'info',
            message: description,
            details: { taskType },
            source: 'MaintenanceManager'
        });
    }

    handleSecurityEvent(event) {
        const { type, severity, details } = event.detail;
        this.addLog({
            type: 'security',
            severity,
            message: `Alerte sécurité: ${type}`,
            details,
            source: 'SecurityManager'
        });
    }

    trimLogs() {
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
    }

    notifyNewLog(logEntry) {
        const event = new CustomEvent('newLogEntry', {
            detail: logEntry
        });
        document.dispatchEvent(event);
    }

    getLogs(filters = {}) {
        let filteredLogs = [...this.logs];

        if (filters.severity) {
            filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
        }
        if (filters.type) {
            filteredLogs = filteredLogs.filter(log => log.type === filters.type);
        }
        if (filters.source) {
            filteredLogs = filteredLogs.filter(log => log.source === filters.source);
        }

        return filteredLogs;
    }

    clearLogs() {
        this.logs = [];
        document.dispatchEvent(new CustomEvent('logsCleared'));
    }
}

export const logManager = new LogManager(); 