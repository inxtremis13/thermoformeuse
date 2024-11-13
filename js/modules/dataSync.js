import { CONFIG } from './config.js';
import { historyManager } from './historyManager.js';

class DataSync {
    constructor() {
        this.syncInterval = CONFIG.sync?.interval || 30000;
        this.lastSync = null;
        this.pendingChanges = new Set();
        this.retryAttempts = 0;
        this.maxRetries = CONFIG.sync?.maxRetries || 3;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startAutoSync();
    }

    setupEventListeners() {
        document.addEventListener('temperatureChange', this.handleChange.bind(this));
        document.addEventListener('alarmTriggered', this.handleChange.bind(this));
        document.addEventListener('maintenanceTaskCompleted', this.handleChange.bind(this));
        document.addEventListener('configChanged', this.handleChange.bind(this));
        
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    handleChange(event) {
        const change = {
            type: event.type,
            data: event.detail,
            timestamp: new Date()
        };
        this.pendingChanges.add(change);
        
        if (this.pendingChanges.size >= CONFIG.sync?.batchSize) {
            this.sync();
        }
    }

    async sync() {
        if (!navigator.onLine || this.pendingChanges.size === 0) return;

        try {
            const changes = Array.from(this.pendingChanges);
            const response = await this.sendChanges(changes);

            if (response.ok) {
                this.handleSyncSuccess(changes);
            } else {
                this.handleSyncError(response);
            }
        } catch (error) {
            this.handleSyncError(error);
        }
    }

    async sendChanges(changes) {
        const endpoint = CONFIG.sync?.endpoint || '/api/sync';
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                changes,
                deviceId: CONFIG.deviceId,
                timestamp: new Date()
            })
        });
    }

    handleSyncSuccess(changes) {
        changes.forEach(change => this.pendingChanges.delete(change));
        this.lastSync = new Date();
        this.retryAttempts = 0;
        this.notifySyncComplete();
    }

    handleSyncError(error) {
        if (this.retryAttempts < this.maxRetries) {
            this.retryAttempts++;
            setTimeout(() => this.sync(), this.calculateRetryDelay());
        } else {
            this.notifySyncError(error);
        }
    }

    calculateRetryDelay() {
        return Math.min(1000 * Math.pow(2, this.retryAttempts), 30000);
    }

    startAutoSync() {
        setInterval(() => this.sync(), this.syncInterval);
    }

    handleOnline() {
        this.sync();
        this.notifyConnectionStatus(true);
    }

    handleOffline() {
        this.notifyConnectionStatus(false);
    }

    notifySyncComplete() {
        const event = new CustomEvent('syncComplete', {
            detail: {
                timestamp: this.lastSync,
                pendingChanges: this.pendingChanges.size
            }
        });
        document.dispatchEvent(event);
    }

    notifySyncError(error) {
        const event = new CustomEvent('syncError', {
            detail: {
                error: error.message,
                timestamp: new Date()
            }
        });
        document.dispatchEvent(event);
    }

    notifyConnectionStatus(online) {
        const event = new CustomEvent('connectionStatus', {
            detail: {
                online,
                timestamp: new Date()
            }
        });
        document.dispatchEvent(event);
    }
}

export const dataSync = new DataSync();

