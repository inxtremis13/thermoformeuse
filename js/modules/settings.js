import { CONFIG } from './config.js';
import { validationManager } from './validationManager.js';
import { securityManager } from './securityManager.js';

class SettingsManager {
    constructor() {
        this.settings = new Map();
        this.defaultSettings = new Map();
        this.userSettings = new Map();
        this.init();
    }

    init() {
        this.loadDefaultSettings();
        this.loadUserSettings();
        this.setupEventListeners();
    }

    loadDefaultSettings() {
        // Paramètres système par défaut
        this.defaultSettings.set('temperature', {
            min: CONFIG.temperatures.min,
            max: CONFIG.temperatures.max,
            default: CONFIG.temperatures.default,
            updateInterval: CONFIG.temperatures.updateInterval
        });

        this.defaultSettings.set('caisson', {
            positions: CONFIG.caisson.positions,
            moveSpeed: CONFIG.caisson.moveSpeed,
            updateInterval: CONFIG.caisson.updateInterval
        });

        this.defaultSettings.set('dashboard', {
            layout: CONFIG.dashboard.defaultLayout,
            updateInterval: CONFIG.dashboard.updateInterval
        });
    }

    loadUserSettings() {
        try {
            const savedSettings = localStorage.getItem('userSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                Object.entries(parsedSettings).forEach(([key, value]) => {
                    this.userSettings.set(key, value);
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres utilisateur:', error);
        }
    }

    async updateSetting(category, key, value) {
        // Vérification des permissions
        if (!securityManager.hasPermission('configure')) {
            throw new Error('Permissions insuffisantes pour modifier les paramètres');
        }

        // Validation de la valeur
        const isValid = await validationManager.validateSetting(category, key, value);
        if (!isValid) {
            throw new Error('Valeur invalide pour ce paramètre');
        }

        // Mise à jour du paramètre
        const categorySettings = this.userSettings.get(category) || {};
        categorySettings[key] = value;
        this.userSettings.set(category, categorySettings);

        // Sauvegarde des paramètres
        this.saveSettings();

        // Notification du changement
        this.notifySettingChange(category, key, value);
    }

    saveSettings() {
        try {
            const settingsObject = Object.fromEntries(this.userSettings);
            localStorage.setItem('userSettings', JSON.stringify(settingsObject));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
        }
    }

    notifySettingChange(category, key, value) {
        const event = new CustomEvent('settingChanged', {
            detail: { category, key, value }
        });
        document.dispatchEvent(event);
    }

    getSetting(category, key) {
        const userSetting = this.userSettings.get(category)?.[key];
        const defaultSetting = this.defaultSettings.get(category)?.[key];
        return userSetting ?? defaultSetting;
    }

    resetToDefault(category) {
        this.userSettings.delete(category);
        this.saveSettings();
        this.notifySettingChange(category, null, null);
    }
}

export const settingsManager = new SettingsManager();