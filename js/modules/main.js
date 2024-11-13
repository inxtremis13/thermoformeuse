import { app } from './app.js';
import { CONFIG } from './config.js';
import { temperatureControl } from './temperatureControl.js';
import { caissonControl } from './caissonControl.js';
import { dashboardManager } from './dashboardManager.js';
import { alarmManager } from './alarmManager.js';
import { menuManager } from './menu.js';

// Configuration de l'environnement
const ENV = process.env.NODE_ENV || 'development';

// Initialisation globale
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Vérification de la compatibilité du navigateur
        checkBrowserCompatibility();
        
        // Initialisation des gestionnaires principaux
        await initializeCore();
        
        // Configuration du mode debug si nécessaire
        if (ENV === 'development') {
            enableDebugMode();
        }
        
        // Démarrage de l'application
        app.startApplication();
        
    } catch (error) {
        handleInitializationError(error);
    }
});

function checkBrowserCompatibility() {
    const requiredFeatures = ['customElements', 'shadowRoot', 'ES6'];
    const missingFeatures = requiredFeatures.filter(feature => !isFeatureSupported(feature));
    
    if (missingFeatures.length > 0) {
        throw new Error(`Navigateur non compatible. Fonctionnalités manquantes: ${missingFeatures.join(', ')}`);
    }
}

async function initializeCore() {
    // Chargement de la configuration
    await loadConfiguration();
    
    // Initialisation des contrôles principaux
    temperatureControl.init();
    caissonControl.init();
    
    // Initialisation du tableau de bord
    dashboardManager.init();
    
    // Initialisation du système d'alarmes
    alarmManager.init();
    
    menuManager.init();
}

function enableDebugMode() {
    window.DEBUG = true;
    console.info('Mode debug activé');
    
    // Exposition des gestionnaires pour le débogage
    window.app = app;
    window.temperatureControl = temperatureControl;
    window.caissonControl = caissonControl;
}

function handleInitializationError(error) {
    console.error('Erreur lors de l\'initialisation:', error);
    
    // Notification à l'utilisateur
    const errorMessage = ENV === 'development' ? error.stack : 'Erreur lors du démarrage de l\'application';
    alert(errorMessage);
}
