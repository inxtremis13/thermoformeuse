import { CONFIG } from './config.js';
import { validationManager } from './validationManager.js';
import { alarmManager } from './alarmManager.js';
import { historyManager } from './historyManager.js';

class PressureManager {
    constructor() {
        this.pressureReadings = new Map();
        this.pressureThresholds = CONFIG.pressure?.thresholds || {
            warning: 8,
            critical: 9.5
        };
        this.updateInterval = CONFIG.pressure?.updateInterval || 1000;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startMonitoring();
    }

    setupEventListeners() {
        document.addEventListener('pressureSensorData', this.handlePressureData.bind(this));
        document.addEventListener('pressureThresholdChange', this.handleThresholdChange.bind(this));
        document.addEventListener('systemStateChange', this.handleSystemStateChange.bind(this));
    }

    startMonitoring() {
        setInterval(() => {
            this.checkPressureLevels();
        }, this.updateInterval);
    }

    handlePressureData(event) {
        const { sensorId, pressure, timestamp } = event.detail;
        
        this.pressureReadings.set(sensorId, {
            pressure,
            timestamp,
            status: this.determinePressureStatus(pressure)
        });

        this.notifyPressureChange(sensorId);
        this.logPressureReading(sensorId);
    }

    determinePressureStatus(pressure) {
        if (pressure >= this.pressureThresholds.critical) return 'critical';
        if (pressure >= this.pressureThresholds.warning) return 'warning';
        return 'normal';
    }

    checkPressureLevels() {
        this.pressureReadings.forEach((reading, sensorId) => {
            const status = this.determinePressureStatus(reading.pressure);
            
            if (status === 'critical') {
                this.handleCriticalPressure(sensorId, reading);
            } else if (status === 'warning') {
                this.handleWarningPressure(sensorId, reading);
            }
        });
    }

    handleCriticalPressure(sensorId, reading) {
        alarmManager.createAlarm({
            type: 'pressure',
            severity: 'critical',
            source: sensorId,
            value: reading.pressure,
            threshold: this.pressureThresholds.critical,
            message: `Pression critique détectée sur ${sensorId}`
        });
    }

    handleWarningPressure(sensorId, reading) {
        alarmManager.createAlarm({
            type: 'pressure',
            severity: 'warning',
            source: sensorId,
            value: reading.pressure,
            threshold: this.pressureThresholds.warning,
            message: `Avertissement pression sur ${sensorId}`
        });
    }

    updateThresholds(newThresholds) {
        const validation = validationManager.validatePressureThresholds(newThresholds);
        if (!validation.isValid) {
            console.error('Seuils de pression invalides:', validation.message);
            return false;
        }

        this.pressureThresholds = newThresholds;
        this.notifyThresholdUpdate();
        return true;
    }

    logPressureReading(sensorId) {
        const reading = this.pressureReadings.get(sensorId);
        historyManager.addEntry({
            type: 'pressure',
            severity: reading.status,
            details: {
                sensorId,
                pressure: reading.pressure,
                timestamp: reading.timestamp
            }
        });
    }

    notifyPressureChange(sensorId) {
        const reading = this.pressureReadings.get(sensorId);
        const event = new CustomEvent('pressureChange', {
            detail: {
                sensorId,
                ...reading
            }
        });
        document.dispatchEvent(event);
    }

    notifyThresholdUpdate() {
        const event = new CustomEvent('pressureThresholdUpdated', {
            detail: this.pressureThresholds
        });
        document.dispatchEvent(event);
    }

    getPressureReading(sensorId) {
        return this.pressureReadings.get(sensorId);
    }

    getAllReadings() {
        return Array.from(this.pressureReadings.entries()).map(([sensorId, reading]) => ({
            sensorId,
            ...reading
        }));
    }
}

export const pressureManager = new PressureManager(); 