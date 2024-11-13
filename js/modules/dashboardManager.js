import { CONFIG } from './config.js';
import { temperatureControl } from './temperatureControl.js';
import { alarmManager } from './alarmManager.js';
import { caissonControl } from './caissonControl.js';
import { statisticsManager } from './statisticsManager.js';

class DashboardManager {
    constructor() {
        this.widgets = new Map();
        this.updateInterval = CONFIG.dashboard?.updateInterval || 1000;
        this.layout = CONFIG.dashboard?.defaultLayout || 'standard';
        this.init();
    }

    init() {
        this.initializeWidgets();
        this.setupEventListeners();
        this.startUpdates();
    }

    initializeWidgets() {
        // Widgets de température
        this.widgets.set('temperature', {
            update: this.updateTemperatureWidget.bind(this),
            interval: 1000
        });

        // Widget du caisson
        this.widgets.set('caisson', {
            update: this.updateCaissonWidget.bind(this),
            interval: 500
        });

        // Widget des alarmes
        this.widgets.set('alarms', {
            update: this.updateAlarmWidget.bind(this),
            interval: 2000
        });

        // Widget des statistiques
        this.widgets.set('stats', {
            update: this.updateStatsWidget.bind(this),
            interval: 5000
        });
    }

    setupEventListeners() {
        document.addEventListener('temperatureChange', this.handleTemperatureChange.bind(this));
        document.addEventListener('caissonChange', this.handleCaissonChange.bind(this));
        document.addEventListener('alarmTriggered', this.handleAlarmEvent.bind(this));
        
        // Gestion du redimensionnement des widgets
        document.querySelectorAll('.widget-resize').forEach(handle => {
            handle.addEventListener('mousedown', this.startResize.bind(this));
        });
    }

    startUpdates() {
        this.widgets.forEach((widget, key) => {
            setInterval(() => {
                if (document.visibilityState === 'visible') {
                    widget.update();
                }
            }, widget.interval);
        });
    }

    updateTemperatureWidget() {
        const widget = document.querySelector('#temperature-widget');
        if (!widget) return;

        const zones = temperatureControl.getZonesStatus();
        const template = zones.map(zone => `
            <div class="zone-status ${zone.status}">
                <span class="zone-name">${zone.name}</span>
                <span class="zone-temp">${zone.current}°C</span>
                <span class="zone-target">(Cible: ${zone.target}°C)</span>
            </div>
        `).join('');

        widget.querySelector('.widget-content').innerHTML = template;
    }

    updateCaissonWidget() {
        const widget = document.querySelector('#caisson-widget');
        if (!widget) return;

        const status = caissonControl.getStatus();
        widget.querySelector('.widget-content').innerHTML = `
            <div class="caisson-status ${status.state}">
                <div class="position">Position: ${status.position}cm</div>
                <div class="mode">Mode: ${status.mode}</div>
                <div class="status">État: ${status.state}</div>
            </div>
        `;
    }

    updateAlarmWidget() {
        const widget = document.querySelector('#alarm-widget');
        if (!widget) return;

        const activeAlarms = alarmManager.getActiveAlarms();
        const template = activeAlarms.slice(0, 5).map(alarm => `
            <div class="alarm-item ${alarm.severity}">
                <span class="alarm-time">${alarm.timestamp}</span>
                <span class="alarm-message">${alarm.message}</span>
            </div>
        `).join('');

        widget.querySelector('.widget-content').innerHTML = template;
    }

    updateStatsWidget() {
        const widget = document.querySelector('#stats-widget');
        if (!widget) return;

        const stats = statisticsManager.getCurrentStats();
        widget.querySelector('.widget-content').innerHTML = `
            <div class="stats-summary">
                <div class="stat-item">
                    <span class="stat-label">Température moyenne</span>
                    <span class="stat-value">${stats.averageTemp}°C</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Temps de chauffe</span>
                    <span class="stat-value">${stats.heatingTime}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Efficacité</span>
                    <span class="stat-value">${stats.efficiency}%</span>
                </div>
            </div>
        `;
    }

    handleTemperatureChange(event) {
        const { zoneId, temperature } = event.detail;
        this.updateTemperatureWidget();
    }

    handleCaissonChange(event) {
        const { position, status } = event.detail;
        this.updateCaissonWidget();
    }

    handleAlarmEvent(event) {
        const { alarm } = event.detail;
        this.updateAlarmWidget();
    }

    startResize(event) {
        const widget = event.target.closest('.widget');
        if (!widget) return;

        const startX = event.clientX;
        const startY = event.clientY;
        const startWidth = widget.offsetWidth;
        const startHeight = widget.offsetHeight;

        const handleResize = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            widget.style.width = `${startWidth + deltaX}px`;
            widget.style.height = `${startHeight + deltaY}px`;
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    }
}

export const dashboardManager = new DashboardManager();
