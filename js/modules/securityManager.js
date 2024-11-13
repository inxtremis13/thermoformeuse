import { CONFIG } from './config.js';
import { validationManager } from './validationManager.js';
import { alarmManager } from './alarmManager.js';
import { historyManager } from './historyManager.js';

class SecurityManager {
    constructor() {
        this.currentLevel = 0;
        this.accessLevels = new Map();
        this.securityAlerts = new Set();
        this.systemLocked = false;
        this.init();
    }

    init() {
        this.initializeAccessLevels();
        this.setupEventListeners();
        this.startMonitoring();
    }

    initializeAccessLevels() {
        CONFIG.security?.levels.forEach(level => {
            this.accessLevels.set(level.id, level);
        });
    }

    setupEventListeners() {
        document.addEventListener('temperatureChange', this.handleTemperatureChange.bind(this));
        document.addEventListener('pressureChange', this.handlePressureChange.bind(this));
        document.addEventListener('systemAlert', this.handleSystemAlert.bind(this));
        document.addEventListener('accessRequest', this.handleAccessRequest.bind(this));
    }

    startMonitoring() {
        setInterval(() => {
            this.checkSecurityStatus();
        }, CONFIG.security?.monitoringInterval || 5000);
    }

    checkSecurityStatus() {
        if (this.securityAlerts.size > CONFIG.security?.maxAlerts) {
            this.lockSystem('Trop d\'alertes de sécurité actives');
        }
    }

    validateAccess(userId, accessLevel, zone) {
        const userLevel = this.accessLevels.get(userId);
        if (!userLevel) return false;

        return userLevel.level >= accessLevel;
    }

    handleAccessRequest(event) {
        const { userId, zone, level } = event.detail;
        const access = this.validateAccess(userId, level, zone);

        if (!access) {
            this.triggerSecurityAlert('access', {
                userId,
                zone,
                level,
                message: 'Tentative d\'accès non autorisé'
            });
        }

        return access;
    }

    handleTemperatureChange(event) {
        const { zoneId, temperature } = event.detail;
        const validation = validationManager.validateTemperature(temperature, CONFIG.defaultTemperatures);

        if (!validation.isValid) {
            this.triggerSecurityAlert('temperature', {
                zoneId,
                temperature,
                message: validation.message
            });
        }
    }

    handlePressureChange(event) {
        const { pressure } = event.detail;
        const validation = validationManager.validatePressure(pressure, CONFIG.pressure);

        if (!validation.isValid) {
            this.triggerSecurityAlert('pressure', {
                pressure,
                message: validation.message
            });
        }
    }

    handleSystemAlert(event) {
        const { type, severity, details } = event.detail;
        
        if (severity === 'critical') {
            this.lockSystem();
        }
        
        this.triggerSecurityAlert('system', {
            type,
            severity,
            details,
            timestamp: new Date()
        });
    }

    triggerSecurityAlert(type, details) {
        const alert = {
            id: Date.now().toString(),
            type,
            timestamp: new Date(),
            ...details
        };

        this.securityAlerts.add(alert);
        this.notifySecurityAlert(alert);
        
        historyManager.addEntry({
            type: 'security',
            severity: 'high',
            details: alert
        });
    }

    notifySecurityAlert(alert) {
        const event = new CustomEvent('securityAlert', {
            detail: alert
        });
        document.dispatchEvent(event);
    }

    lockSystem(reason = 'Verrouillage de sécurité') {
        if (this.systemLocked) return;

        this.systemLocked = true;
        historyManager.addEntry({
            type: 'security',
            severity: 'critical',
            message: 'Système verrouillé',
            details: reason
        });

        const event = new CustomEvent('systemLock', {
            detail: { reason }
        });
        document.dispatchEvent(event);
    }

    unlockSystem(userId) {
        if (!this.validateAccess(userId, CONFIG.security?.unlockLevel)) {
            return false;
        }

        this.systemLocked = false;
        this.securityAlerts.clear();
        
        historyManager.addEntry({
            type: 'security',
            severity: 'info',
            message: 'Système déverrouillé',
            details: `Déverrouillé par l'utilisateur ${userId}`
        });

        const event = new CustomEvent('systemUnlock');
        document.dispatchEvent(event);
        return true;
    }
}

export const securityManager = new SecurityManager();
