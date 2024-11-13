// Configuration globale du système
const CONFIG = {
    // Configuration des dimensions et zones
    dimensions: {
        '120x60': {
            zones: [true, true, true],
            guillotine: { left: 0, right: 0 }
        },
        '90x60': {
            zones: [true, true, false],
            guillotine: { left: 0, right: 5 }
        },
        '60x60': {
            zones: [false, true, false],
            guillotine: { left: 5, right: 5 }
        }
    },

    // Configuration des températures
    temperatures: {
        min: 0,
        max: 500,
        default: 150,
        alarmThreshold: 50,
        criticalThreshold: 175,
        updateInterval: 1000
    },

    // Configuration du caisson
    caisson: {
        positions: {
            closed: 5,
            open: 0
        },
        moveSpeed: 1,
        updateInterval: 500
    },

    // Configuration des alarmes
    alarms: {
        maxCritical: 3,
        checkInterval: 5000,
        thresholds: {
            temperature: {
                warning: 160,
                critical: 175
            },
            pressure: {
                warning: 8,
                critical: 9.5
            }
        }
    },

    // Configuration de la sécurité
    security: {
        maxAlerts: 5,
        monitoringInterval: 5000,
        levels: [
            { id: 0, name: 'Opérateur', permissions: ['view', 'acknowledge'] },
            { id: 1, name: 'Superviseur', permissions: ['view', 'acknowledge', 'resolve'] },
            { id: 2, name: 'Administrateur', permissions: ['view', 'acknowledge', 'resolve', 'configure'] }
        ]
    },

    // Configuration du tableau de bord
    dashboard: {
        updateInterval: 1000,
        defaultLayout: 'standard',
        widgets: ['temperature', 'caisson', 'alarms', 'stats']
    }
};

export { CONFIG };
