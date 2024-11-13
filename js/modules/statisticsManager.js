import { CONFIG } from './config.js';
import { historyManager } from './historyManager.js';

class StatisticsManager {
    constructor() {
        this.stats = {
            temperatures: new Map(),
            heatingTime: new Map(),
            efficiency: new Map(),
            alarms: {
                total: 0,
                critical: 0,
                warning: 0
            }
        };
        this.timeRange = {
            start: null,
            end: null
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startCollection();
        this.simulateTemperature();
    }

    setupEventListeners() {
        document.addEventListener('temperatureUpdate', (event) => {
            const { source } = event.detail;
            if (source === 'statisticsManager') {
                this.handleTemperatureChange(event);
            }
        });
        document.addEventListener('alarmTriggered', this.handleAlarm.bind(this));
        document.addEventListener('dimensionChange', this.handleDimensionChange.bind(this));
    }

    handleTemperatureChange(event) {
        const { zoneId, temperature, target } = event.detail;
        
        if (!this.stats.temperatures.has(zoneId)) {
            this.stats.temperatures.set(zoneId, []);
        }

        const zoneStats = this.stats.temperatures.get(zoneId);
        zoneStats.push({
            timestamp: new Date(),
            temperature,
            target
        });

        this.calculateEfficiency(zoneId);
        this.updateHeatingTime(zoneId);
    }

    handleAlarm(event) {
        const { severity } = event.detail;
        this.stats.alarms.total++;
        if (severity in this.stats.alarms) {
            this.stats.alarms[severity]++;
        }
    }

    handleDimensionChange(event) {
        // Implémentez la logique pour gérer les changements de dimension ici
    }

    calculateEfficiency(zoneId) {
        const temperatures = this.stats.temperatures.get(zoneId);
        if (!temperatures || temperatures.length < 2) return;

        const recentTemps = temperatures.slice(-10);
        const avgDeviation = recentTemps.reduce((sum, reading) => {
            return sum + Math.abs(reading.temperature - reading.target);
        }, 0) / recentTemps.length;

        const efficiency = Math.max(0, 100 - (avgDeviation * 2));
        this.stats.efficiency.set(zoneId, efficiency);
    }

    updateHeatingTime(zoneId) {
        const temperatures = this.stats.temperatures.get(zoneId);
        if (!temperatures || temperatures.length < 2) return;

        const startTime = temperatures[0].timestamp;
        const currentTime = new Date();
        const heatingTime = (currentTime - startTime) / 1000; // en secondes

        this.stats.heatingTime.set(zoneId, heatingTime);
    }

    getZoneStats(zoneId) {
        const temperatures = this.stats.temperatures.get(zoneId) || [];
        const efficiency = this.stats.efficiency.get(zoneId) || 0;
        const heatingTime = this.stats.heatingTime.get(zoneId) || 0;

        return {
            averageTemp: this.calculateAverageTemperature(temperatures),
            efficiency: Math.round(efficiency),
            heatingTime: this.formatHeatingTime(heatingTime),
            readings: temperatures.length
        };
    }

    calculateAverageTemperature(temperatures) {
        if (!temperatures.length) return 0;
        const sum = temperatures.reduce((acc, reading) => acc + reading.temperature, 0);
        return Math.round(sum / temperatures.length);
    }

    formatHeatingTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    getGlobalStats() {
        const allZones = Array.from(this.stats.temperatures.keys());
        const zoneStats = allZones.map(zoneId => this.getZoneStats(zoneId));

        return {
            averageTemp: this.calculateGlobalAverage(zoneStats, 'averageTemp'),
            efficiency: this.calculateGlobalAverage(zoneStats, 'efficiency'),
            heatingTime: this.calculateTotalHeatingTime(),
            alarms: { ...this.stats.alarms }
        };
    }

    calculateGlobalAverage(stats, property) {
        if (!stats.length) return 0;
        const sum = stats.reduce((acc, stat) => acc + stat[property], 0);
        return Math.round(sum / stats.length);
    }

    calculateTotalHeatingTime() {
        const totalSeconds = Array.from(this.stats.heatingTime.values())
            .reduce((sum, time) => sum + time, 0);
        return this.formatHeatingTime(totalSeconds);
    }

    exportStats() {
        return {
            global: this.getGlobalStats(),
            zones: Array.from(this.stats.temperatures.keys()).map(zoneId => ({
                zoneId,
                ...this.getZoneStats(zoneId)
            })),
            timeRange: this.timeRange
        };
    }

    initializeStats() {
        // Initialiser les statistiques ici
        console.log('Initialisation des statistiques');
    }

    startCollection() {
        // Implémentez la logique de collecte ici
        console.log('Collection started');
    }

    simulateTemperature() {
        setInterval(() => {
            const temperature = this.generateRandomTemperature();
            console.log(`Simulated Temperature: ${temperature}`);
            // Mettez à jour l'interface utilisateur ou stockez la température
        }, 1000); // Simule toutes les secondes
    }

    generateRandomTemperature() {
        // Génère une température aléatoire entre 15 et 25 degrés
        return (Math.random() * 10 + 15).toFixed(2);
    }
}

export const statisticsManager = new StatisticsManager();
