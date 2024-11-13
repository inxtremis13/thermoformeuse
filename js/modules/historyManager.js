import { CONFIG } from './config.js';

export const historyManager = {
    history: [],
    maxEntries: CONFIG.history?.maxEntries || 1000,

    init() {
        this.loadHistory();
        this.setupEventListeners();
    },

    loadHistory() {
        try {
            const savedHistory = localStorage.getItem('operationHistory');
            this.history = savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            this.history = [];
        }
    },

    setupEventListeners() {
        document.addEventListener('alarmCreated', this.handleAlarmEvent.bind(this));
        document.addEventListener('temperatureChange', this.handleTemperatureEvent.bind(this));
    }
};
