import { CONFIG } from './config.js';
import { validationManager } from './validationManager.js';
import { alarmManager } from './alarmManager.js';

class CaissonControl {
    constructor() {
        this.position = CONFIG.caisson.positions.closed;
        this.targetPosition = this.position;
        this.mode = 'auto';
        this.state = 'idle';
        this.moving = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startMonitoring();
    }

    setupEventListeners() {
        document.addEventListener('materialChange', this.handleMaterialChange.bind(this));
        document.addEventListener('dimensionChange', this.handleDimensionChange.bind(this));
        document.addEventListener('pressureChange', this.handlePressureChange.bind(this));
    }

    startMonitoring() {
        setInterval(() => {
            if (this.moving) {
                this.updatePosition();
            }
            this.checkStatus();
        }, CONFIG.caisson?.updateInterval || 100);
    }

    setPosition(position) {
        const validation = validationManager.validatePosition(position, CONFIG.caisson.positions);
        if (!validation.isValid) {
            console.error(validation.message);
            return false;
        }

        this.targetPosition = position;
        this.moving = true;
        this.state = 'moving';
        this.emitCaissonChange();
        return true;
    }

    updatePosition() {
        const diff = this.targetPosition - this.position;
        if (Math.abs(diff) <= 0.1) {
            this.position = this.targetPosition;
            this.moving = false;
            this.state = 'idle';
        } else {
            this.position += diff > 0 ? 0.1 : -0.1;
        }
        this.emitCaissonChange();
    }

    checkStatus() {
        const pressure = this.getPressure();
        if (pressure > CONFIG.caisson.maxPressure) {
            this.triggerAlarm('pressure', 'critical', pressure);
        }
    }

    triggerAlarm(type, severity, value) {
        const alarm = {
            type: type,
            severity: severity,
            value: value,
            location: 'Caisson aspirant',
            message: `${type === 'pressure' ? 'Pression' : 'Paramètre'} ${severity === 'critical' ? 'critique' : 'anormal'}`,
            details: `Valeur actuelle: ${value}`
        };

        alarmManager.addAlarm(alarm);
    }

    handleMaterialChange(event) {
        const { material } = event.detail;
        if (material.caissonMode) {
            this.setMode(material.caissonMode);
        }
    }

    handleDimensionChange(event) {
        const { config } = event.detail;
        if (config.guillotine) {
            this.adjustForDimension(config.guillotine);
        }
    }

    handlePressureChange(event) {
        const { pressure } = event.detail;
        this.checkPressure(pressure);
    }

    setMode(mode) {
        if (mode === 'auto' || mode === 'manual') {
            this.mode = mode;
            this.emitCaissonChange();
            return true;
        }
        return false;
    }

    adjustForDimension(guillotine) {
        if (this.mode === 'auto') {
            const newPosition = (guillotine.left + guillotine.right) / 2;
            this.setPosition(newPosition);
        }
    }

    getPressure() {
        // Simulation de la pression
        return Math.random() * 10;
    }

    getStatus() {
        return {
            position: this.position,
            targetPosition: this.targetPosition,
            mode: this.mode,
            state: this.state,
            moving: this.moving
        };
    }

    emitCaissonChange() {
        const event = new CustomEvent('caissonChange', {
            detail: this.getStatus()
        });
        document.dispatchEvent(event);
    }
}

export const caissonControl = new CaissonControl();
