import { CONFIG } from './config.js';
import { temperatureControl } from './temperatureControl.js';
import { caissonControl } from './caissonControl.js';
import { dimensionManager } from './dimensionManager.js';
import { materialManager } from './materialManager.js';
import { alarmManager } from './alarmManager.js';
import { dashboardManager } from './dashboardManager.js';
import { historyManager } from './historyManager.js';
import { statisticsManager } from './statisticsManager.js';
import { maintenanceManager } from './maintenanceManager.js';
import { securityManager } from './securityManager.js';
import { validationManager } from './validationManager.js';
import { dataSync } from './dataSync.js';

class App {
    constructor() {
        this.modules = new Map();
        this.init();
    }

    init() {
        this.initModules();
        this.initEventListeners();
        this.startApplication();
    }

    initModules() {
        // Initialiser et stocker les références aux modules
        this.modules.set('dimensions', dimensionManager);
        this.modules.set('materials', materialManager);
        this.modules.set('caisson', caissonControl);
        this.modules.set('history', historyManager);
        // ... autres modules
    }

    initEventListeners() {
        // Initialiser les écouteurs d'événements globaux
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        window.addEventListener('error', (e) => this.handleError(e));
    }

    startApplication() {
        // Démarrer l'application
        console.log('Application démarrée');
        this.checkInitialState();
    }

    handleError(error) {
        // Gestion globale des erreurs
    }

    checkInitialState() {
        // Vérifier l'état initial de l'application
    }
}

// Démarrer l'application
const app = new App();
export { app };
