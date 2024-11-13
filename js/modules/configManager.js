import { validationManager } from './validationManager.js';
import { historyManager } from './historyManager.js';

class ConfigManager {
    constructor() {
        this.config = {};
        this.defaultConfig = {};
        this.configHistory = [];
        this.init();
    }

    init() {
        this.loadDefaultConfig();
        this.loadConfig();
        this.setupEventListeners();
    }

    loadDefaultConfig() {
        this.defaultConfig = {
            temperature: {
                updateInterval: 1000,
                zones: [
                    { id: 'zone1', name: 'Zone 1', minTemp: 20, maxTemp: 200 },
                    { id: 'zone2', name: 'Zone 2', minTemp: 20, maxTemp: 180 }
                ]
            },
            caisson: {
                positions: { closed: 5, open: 0 },
                updateInterval: 500
            },
            alarms: {
                checkInterval: 5000,
                maxCritical: 3,
                thresholds: [
                    { type: 'temperature', warning: 170, critical: 190 },
                    { type: 'pressure', warning: 8, critical: 9.5 }
                ]
            },
            security: {
                monitoringInterval: 5000,
                maxAlerts: 5,
                unlockLevel: 2
            },
            dashboard: {
                updateInterval: 1000,
                defaultLayout: 'standard'
            }
        };
    }

    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('appConfig');
            if (savedConfig) {
                this.config = JSON.parse(savedConfig);
                this.validateConfig(this.config);
            } else {
                this.config = { ...this.defaultConfig };
                this.saveConfig();
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            this.config = { ...this.defaultConfig };
        }
    }

    setupEventListeners() {
        document.addEventListener('configUpdate', this.handleConfigUpdate.bind(this));
        document.addEventListener('configReset', this.handleConfigReset.bind(this));
    }

    validateConfig(config) {
        const validation = validationManager.validateConfig(config);
        if (!validation.isValid) {
            console.warn('Configuration invalide:', validation.message);
            return false;
        }
        return true;
    }

    updateConfig(path, value) {
        const oldValue = this.getConfigValue(path);
        if (this.setConfigValue(path, value)) {
            this.saveConfig();
            this.logConfigChange(path, oldValue, value);
            this.notifyConfigUpdate(path);
            return true;
        }
        return false;
    }

    getConfigValue(path) {
        return path.split('.').reduce((obj, key) => 
            obj && obj[key] !== undefined ? obj[key] : undefined, 
            this.config
        );
    }

    setConfigValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!(key in obj)) obj[key] = {};
            return obj[key];
        }, this.config);

        target[lastKey] = value;
        return true;
    }

    saveConfig() {
        try {
            localStorage.setItem('appConfig', JSON.stringify(this.config));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la configuration:', error);
            return false;
        }
        return true;
    }

    resetConfig() {
        this.config = { ...this.defaultConfig };
        this.saveConfig();
        this.notifyConfigReset();
    }

    logConfigChange(path, oldValue, newValue) {
        const change = {
            timestamp: new Date(),
            path,
            oldValue,
            newValue
        };
        
        this.configHistory.push(change);
        historyManager.addEntry({
            type: 'config',
            severity: 'info',
            details: change
        });
    }

    notifyConfigUpdate(path) {
        const event = new CustomEvent('configChanged', {
            detail: {
                path,
                value: this.getConfigValue(path)
            }
        });
        document.dispatchEvent(event);
    }

    notifyConfigReset() {
        document.dispatchEvent(new CustomEvent('configReset'));
    }

    exportConfig() {
        return {
            config: this.config,
            history: this.configHistory,
            timestamp: new Date()
        };
    }
}

export const configManager = new ConfigManager(); 