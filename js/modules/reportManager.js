import { CONFIG } from './config.js';
import { statisticsManager } from './statisticsManager.js';
import { historyManager } from './historyManager.js';
import { alarmManager } from './alarmManager.js';

class ReportManager {
    constructor() {
        this.reports = new Map();
        this.reportTemplates = new Map();
        this.scheduledReports = new Set();
        this.init();
    }

    init() {
        this.loadTemplates();
        this.setupScheduledReports();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('reportRequest', this.handleReportRequest.bind(this));
        document.addEventListener('alarmTriggered', this.handleAlarmEvent.bind(this));
        document.addEventListener('maintenanceCompleted', this.handleMaintenanceEvent.bind(this));
    }

    loadTemplates() {
        CONFIG.reports?.templates.forEach(template => {
            this.reportTemplates.set(template.id, template);
        });
    }

    async generateReport(type, params = {}) {
        const template = this.reportTemplates.get(type);
        if (!template) {
            throw new Error(`Template de rapport inconnu: ${type}`);
        }

        const reportData = await this.collectReportData(type, params);
        const report = {
            id: Date.now().toString(),
            type,
            timestamp: new Date(),
            data: reportData,
            params
        };

        this.reports.set(report.id, report);
        this.notifyReportGenerated(report);
        return report;
    }

    async collectReportData(type, params) {
        const data = {
            statistics: await this.getStatistics(params),
            alarms: await this.getAlarmHistory(params),
            history: await this.getSystemHistory(params)
        };

        switch (type) {
            case 'daily':
                data.maintenance = await this.getDailyMaintenance();
                break;
            case 'weekly':
                data.performance = await this.getWeeklyPerformance();
                break;
            case 'monthly':
                data.trends = await this.getMonthlyTrends();
                break;
        }

        return data;
    }

    async getStatistics(params) {
        return {
            temperature: statisticsManager.getTemperatureStats(params.timeRange),
            efficiency: statisticsManager.getEfficiencyStats(params.timeRange),
            alarms: statisticsManager.getAlarmStats(params.timeRange)
        };
    }

    async getAlarmHistory(params) {
        return alarmManager.getAlarmHistory(params.timeRange);
    }

    async getSystemHistory(params) {
        return historyManager.getHistory({
            startDate: params.timeRange.start,
            endDate: params.timeRange.end
        });
    }

    scheduleReport(type, schedule, params = {}) {
        const scheduledReport = {
            id: Date.now().toString(),
            type,
            schedule,
            params,
            nextRun: this.calculateNextRun(schedule)
        };

        this.scheduledReports.add(scheduledReport);
        return scheduledReport.id;
    }

    calculateNextRun(schedule) {
        // Logique de calcul de la prochaine exécution basée sur le planning
        const now = new Date();
        // ... logique de calcul selon le type de planning
        return nextRunDate;
    }

    notifyReportGenerated(report) {
        const event = new CustomEvent('reportGenerated', {
            detail: report
        });
        document.dispatchEvent(event);
    }

    getReport(reportId) {
        return this.reports.get(reportId);
    }

    getScheduledReports() {
        return Array.from(this.scheduledReports);
    }
}

export const reportManager = new ReportManager(); 