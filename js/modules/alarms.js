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
        this.updateAlarmStats();
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.addEventListener('alarmCreated', this.handleNewAlarm.bind(this));
        document.addEventListener('alarmAcknowledged', this.handleAcknowledgedAlarm.bind(this));
    },

    initializeAlarms() {
        const container = document.getElementById('alarm-container');
        if (container) {
            container.innerHTML = '';
            testAlarms.forEach(alarm => {
                const alarmElement = this.createAlarmCard(alarm);
                container.insertAdjacentHTML('beforeend', alarmElement);
            });
            this.updateAlarmStats();
        }
    },

    createAlarmCard(alarm) {
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
    },

    viewAlarm(id) {
        alert(`Voir les détails de l'alarme ID: ${id}`);
    },

    ignoreAlarm(id) {
        alert(`Alarme ID: ${id} ignorée`);
    },

    deleteAlarm(id) {
        const alarmElement = document.querySelector(`.alarm-card[data-id="${id}"]`);
        if (alarmElement) {
            alarmElement.remove();
            this.updateAlarmStats();
        }
    },

    acknowledgeAlarm(id) {
        const alarmElement = document.querySelector(`.alarm-card[data-id="${id}"]`);
        if (alarmElement) {
            const statusElement = alarmElement.querySelector('.alarm-status');
            statusElement.className = 'alarm-status status-acknowledged';
            statusElement.textContent = 'traité';
            this.updateAlarmStats();
            document.dispatchEvent(new CustomEvent('alarmAcknowledged', { detail: { id } }));
        }
    },

    updateAlarmStats() {
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
    },

    getAlarmIcon(type) {
        const icons = {
            temperature: 'fa-thermometer-half',
            pressure: 'fa-tachometer-alt',
            maintenance: 'fa-tools',
            security: 'fa-shield-alt',
            system: 'fa-server'
        };
        return icons[type] || 'fa-exclamation-circle';
    }
};

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.alarm-dashboard')) {
        alarmManager.init();
    }
});

export { alarmManager }; 