import { CONFIG } from './config.js';
import { historyManager } from './historyManager.js';
import { statisticsManager } from './statisticsManager.js';

class MaintenanceManager {
    constructor() {
        this.maintenanceSchedule = new Map();
        this.alerts = new Set();
        this.maintenanceHistory = [];
        this.currentTasks = new Map();
        this.init();
    }

    init() {
        this.loadSchedule();
        this.checkMaintenanceStatus();
        this.initAlerts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('temperatureChange', this.handleTemperatureEvent.bind(this));
        document.addEventListener('alarmTriggered', this.handleAlarmEvent.bind(this));
        document.addEventListener('maintenanceRequest', this.handleMaintenanceRequest.bind(this));
        document.addEventListener('taskComplete', this.handleTaskComplete.bind(this));
    }

    loadSchedule() {
        CONFIG.maintenance?.schedule.forEach(task => {
            this.addMaintenanceTask(task);
        });
    }

    addMaintenanceTask(task) {
        const taskId = Date.now().toString();
        const newTask = {
            id: taskId,
            status: 'pending',
            createdAt: new Date(),
            completedAt: null,
            ...task
        };

        this.maintenanceSchedule.set(taskId, newTask);
        this.checkTaskPriority(newTask);
        this.notifyNewTask(newTask);
    }

    checkTaskPriority(task) {
        const now = new Date();
        const taskDate = new Date(task.scheduledDate);
        const daysDiff = (taskDate - now) / (1000 * 60 * 60 * 24);

        if (daysDiff <= 1) {
            this.createAlert('urgent', task);
        } else if (daysDiff <= 7) {
            this.createAlert('warning', task);
        }
    }

    createAlert(severity, task) {
        const alert = {
            id: Date.now().toString(),
            severity,
            task: task.id,
            message: `Maintenance ${severity === 'urgent' ? 'urgente' : 'à prévoir'}: ${task.description}`,
            createdAt: new Date()
        };

        this.alerts.add(alert);
        this.notifyAlert(alert);
    }

    handleMaintenanceRequest(event) {
        const { taskId, technician } = event.detail;
        const task = this.maintenanceSchedule.get(taskId);

        if (task && task.status === 'pending') {
            task.status = 'in_progress';
            task.assignedTo = technician;
            task.startedAt = new Date();

            this.currentTasks.set(taskId, task);
            this.notifyTaskUpdate(task);
        }
    }

    handleTaskComplete(event) {
        const { taskId, report } = event.detail;
        const task = this.currentTasks.get(taskId);

        if (task) {
            task.status = 'completed';
            task.completedAt = new Date();
            task.report = report;

            this.maintenanceHistory.push(task);
            this.currentTasks.delete(taskId);
            this.maintenanceSchedule.delete(taskId);

            this.notifyTaskComplete(task);
            this.updateMaintenanceStats();
        }
    }

    handleTemperatureEvent(event) {
        const { zoneId, temperature } = event.detail;
        this.checkTemperatureAnomaly(zoneId, temperature);
    }

    handleAlarmEvent(event) {
        const { type, severity } = event.detail;
        if (type === 'equipment' && severity === 'critical') {
            this.scheduleEmergencyMaintenance(event.detail);
        }
    }

    checkTemperatureAnomaly(zoneId, temperature) {
        const stats = statisticsManager.getZoneStats(zoneId);
        const avgTemp = stats.averageTemp;
        const deviation = Math.abs(temperature - avgTemp);

        if (deviation > CONFIG.maintenance?.tempDeviationThreshold) {
            this.scheduleMaintenanceCheck({
                type: 'temperature_anomaly',
                zoneId,
                deviation
            });
        }
    }

    scheduleEmergencyMaintenance(alarm) {
        this.addMaintenanceTask({
            type: 'emergency',
            priority: 'critical',
            description: `Maintenance d'urgence suite à ${alarm.message}`,
            scheduledDate: new Date(),
            estimatedDuration: 120 // 2 heures par défaut
        });
    }

    scheduleMaintenanceCheck(anomaly) {
        this.addMaintenanceTask({
            type: 'check',
            priority: 'high',
            description: `Vérification suite à anomalie ${anomaly.type}`,
            scheduledDate: new Date(),
            estimatedDuration: 60,
            anomaly
        });
    }

    notifyNewTask(task) {
        const event = new CustomEvent('maintenanceTaskCreated', {
            detail: { task }
        });
        document.dispatchEvent(event);
    }

    notifyTaskUpdate(task) {
        const event = new CustomEvent('maintenanceTaskUpdated', {
            detail: { task }
        });
        document.dispatchEvent(event);
    }

    notifyTaskComplete(task) {
        const event = new CustomEvent('maintenanceTaskCompleted', {
            detail: { task }
        });
        document.dispatchEvent(event);
    }

    notifyAlert(alert) {
        const event = new CustomEvent('maintenanceAlert', {
            detail: { alert }
        });
        document.dispatchEvent(event);
    }

    updateMaintenanceStats() {
        historyManager.addEntry({
            type: 'maintenance',
            severity: 'info',
            details: this.generateMaintenanceReport()
        });
    }

    generateMaintenanceReport() {
        return {
            activeTasks: this.currentTasks.size,
            completedTasks: this.maintenanceHistory.length,
            highPriorityTasks: Array.from(this.maintenanceSchedule.values())
                .filter(task => task.priority === 'high').length,
            nextScheduledTask: this.getNextScheduledTask(),
            recentCompletions: this.getRecentCompletions()
        };
    }

    getNextScheduledTask() {
        return Array.from(this.maintenanceSchedule.values())
            .filter(task => task.status === 'pending')
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0];
    }

    getRecentCompletions() {
        return this.maintenanceHistory
            .slice(-5)
            .map(task => ({
                id: task.id,
                description: task.description,
                completedAt: task.completedAt
            }));
    }
}

export const maintenanceManager = new MaintenanceManager();
