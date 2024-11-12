document.addEventListener('DOMContentLoaded', function() {
    // Ajout des données de test pour les alarmes
    const testAlarms = [
        {
            id: 1,
            type: 'temperature',
            severity: 'critical',
            timestamp: 'Il y a 5 min',
            message: 'Température critique - Zone de chauffe 1',
            temperature: 180,
            location: 'Zone 1',
            details: 'Dépassement du seuil critique de 175°C',
            status: 'active'
        },
        {
            id: 2,
            type: 'pressure',
            severity: 'warning',
            timestamp: 'Il y a 15 min',
            message: 'Pression anormale - Circuit hydraulique',
            temperature: 160,
            location: 'Circuit principal',
            details: 'Pression en hausse progressive',
            status: 'active'
        },
        {
            id: 3,
            type: 'maintenance',
            severity: 'normal',
            timestamp: 'Il y a 30 min',
            message: 'Maintenance préventive recommandée',
            temperature: 145,
            location: 'Système général',
            details: 'Inspection périodique requise',
            status: 'pending'
        },
        {
            id: 4,
            type: 'security',
            severity: 'critical',
            timestamp: 'Il y a 2 min',
            message: 'Accès non autorisé détecté',
            location: 'Salle de contrôle',
            details: 'Tentative d\'accès avec badge invalide',
            status: 'active'
        },
        {
            id: 5,
            type: 'system',
            severity: 'warning',
            timestamp: 'Il y a 45 min',
            message: 'Performances système dégradées',
            location: 'Unité de traitement',
            details: 'Ralentissement détecté sur le process principal',
            status: 'acknowledged'
        }
    ];
// Alarm initialization
const alarmManager = {
    init() {
        this.initializeAlarms();
        this.updateCounts();
    },

    initializeAlarms() {
        const criticalAlarms = testAlarms.filter(a => a.severity === 'critical');
        const warningAlarms = testAlarms.filter(a => a.severity === 'warning');
        const normalAlarms = testAlarms.filter(a => a.severity === 'normal');

        this.renderAlarmList('critical-alarms', criticalAlarms);
        this.renderAlarmList('warning-alarms', warningAlarms);
        this.renderAlarmList('normal-alarms', normalAlarms);
    },

    renderAlarmList(containerId, alarms) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = alarms.map(alarm => this.createAlarmItem(alarm)).join('');
        }
    },

    createAlarmItem(alarm) {
        return `
            <div class="alarm-item ${alarm.severity}">
                <div class="alarm-message">${alarm.message}</div>
                <div class="alarm-details">
                    <span class="alarm-time">
                        <i class="far fa-clock"></i>
                        ${alarm.timestamp}
                    </span>
                    <span class="alarm-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${alarm.location}
                    </span>
                    <span class="alarm-temp">
                        <i class="fas fa-thermometer-half"></i>
                        ${alarm.temperature}°C
                    </span>
                </div>
            </div>
        `;
    },

    updateCounts() {
        document.querySelector('.alarm-content.critical .count').textContent = 
            document.querySelectorAll('#critical-alarms .alarm-item').length;
        
        document.querySelector('.alarm-content.warning .count').textContent = 
            document.querySelectorAll('#warning-alarms .alarm-item').length;
        
        document.querySelector('.alarm-content.normal .count').textContent = 
            document.querySelectorAll('#normal-alarms .alarm-item').length;
    }
};

// Initialize alarms if we're on the alarms page
if (document.querySelector('.alarm-grid')) {
    alarmManager.init();
}

// Fonction pour créer une carte d'alarme avec des options
function createAlarmCard(alarm) {
    const statusColors = {
        actif: '#ff4444',      // Rouge vif pour les alarmes actives
        traité: '#00C851',     // Vert pour les alarmes traitées
        en_cours: '#ffbb33'    // Orange pour les alarmes en cours de traitement
    };

    const statusTranslations = {
        active: 'actif',
        acknowledged: 'traité',
        pending: 'en_cours'
    };

    const statusText = statusTranslations[alarm.status] || alarm.status;

    return `
        <div class="alarm-card ${alarm.severity}" data-id="${alarm.id}">
            <div class="alarm-header">
                <div class="alarm-type">
                    <i class="fas ${getAlarmIcon(alarm.type)}"></i>
                    ${alarm.type.toUpperCase()}
                </div>
                <div class="alarm-status status-${alarm.status}">
                    ${statusText}
                </div>
            </div>
            <div class="alarm-message">${alarm.message}</div>
            <div class="alarm-details">
                <span class="alarm-time">
                    <i class="far fa-clock"></i>
                    ${alarm.timestamp}
                </span>
                <span class="alarm-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${alarm.location}
                </span>
            </div>
            <div class="alarm-actions">
                <button class="action-btn view-btn" onclick="viewAlarm(${alarm.id})">
                    <i class="fas fa-eye"></i>
                    Détails
                </button>
                <button class="action-btn acknowledge-btn" onclick="acknowledgeAlarm(${alarm.id})">
                    <i class="fas fa-check"></i>
                    Acquitter
                </button>
                <button class="action-btn ignore-btn" onclick="ignoreAlarm(${alarm.id})">
                    <i class="fas fa-bell-slash"></i>
                    Ignorer
                </button>
                <button class="action-btn delete-btn" onclick="deleteAlarm(${alarm.id})">
                    <i class="fas fa-trash"></i>
                    Supprimer
                </button>
            </div>
        </div>
    `;
}

// Fonction pour voir une alarme
function viewAlarm(id) {
    alert(`Voir les détails de l'alarme ID: ${id}`);
}

// Fonction pour ignorer une alarme
function ignoreAlarm(id) {
    alert(`Alarme ID: ${id} ignorée`);
}

// Fonction pour supprimer une alarme
function deleteAlarm(id) {
    const alarmElement = document.querySelector(`.alarm-card[data-id="${id}"]`);
    if (alarmElement) {
        alarmElement.remove();
        updateAlarmStats();
    }
}

// Initialisation des alarmes de test
function initializeTestAlarms() {
    const container = document.getElementById('alarm-container');
    if (container) {
        container.innerHTML = ''; // Nettoie le conteneur
        testAlarms.forEach(alarm => {
            const alarmElement = createAlarmCard(alarm);
            container.insertAdjacentHTML('beforeend', alarmElement);
        });
    }
}

// Appel de l'initialisation quand on est sur la page des alarmes
if (document.querySelector('.alarm-dashboard')) {
    initializeTestAlarms();
}

// Mise à jour des statistiques
function updateAlarmStats() {
    const stats = {
        critical: document.querySelectorAll('.alarm-card.critical').length,
        warning: document.querySelectorAll('.alarm-card.warning').length,
        normal: document.querySelectorAll('.alarm-card.normal').length
    };

    Object.entries(stats).forEach(([key, value]) => {
        const statElement = document.querySelector(`.stat-box.${key} .stat-count`);
        if (statElement) {
            statElement.textContent = value;
        }
    });
}

// Fonction pour obtenir l'icône selon le type d'alarme
function getAlarmIcon(type) {
    const icons = {
        temperature: 'fa-thermometer-half',
        pressure: 'fa-tachometer-alt',
        maintenance: 'fa-tools',
        security: 'fa-shield-alt',
        system: 'fa-server'
    };
    return icons[type] || 'fa-exclamation-circle';
}

// Fonction pour acquitter une alarme
function acknowledgeAlarm(id) {
    const alarmElement = document.querySelector(`.alarm-card[data-id="${id}"]`);
    if (alarmElement) {
        const statusElement = alarmElement.querySelector('.alarm-status');
        statusElement.className = 'alarm-status status-acknowledged';
        statusElement.textContent = 'traité';
        updateAlarmStats();
    }
}

// Initialisation des alarmes
const container = document.getElementById('alarm-container');
if (container) {
    container.innerHTML = ''; // Nettoie le conteneur
    testAlarms.forEach(alarm => {
        const alarmElement = createAlarmCard(alarm);
        container.insertAdjacentHTML('beforeend', alarmElement);
    });
    updateAlarmStats();
}
}); 