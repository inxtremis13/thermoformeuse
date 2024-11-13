import { CONFIG } from './config.js';
import { validationManager } from './validationManager.js';
import { temperatureControl } from './temperatureControl.js';
import { caissonControl } from './caissonControl.js';

class DimensionManager {
    constructor() {
        this.currentDimension = null;
        this.dimensions = CONFIG.dimensions;
        this.guillotinePositions = new Map();
        this.activeZones = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDefaultDimension();
    }

    setupEventListeners() {
        document.querySelectorAll('.dimension-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setDimension(btn.dataset.dimension));
        });

        document.addEventListener('materialChange', (e) => {
            this.validateDimensionForMaterial(e.detail.material);
        });

        document.addEventListener('temperatureChange', (e) => {
            this.checkZoneStatus(e.detail.zoneId);
        });
    }

    loadDefaultDimension() {
        const defaultDimension = Object.keys(this.dimensions)[0];
        if (defaultDimension) {
            this.setDimension(defaultDimension);
        }
    }

    setDimension(dimension) {
        const validation = validationManager.validateDimensions(dimension);
        if (!validation.isValid) {
            console.error(validation.message);
            return false;
        }

        this.currentDimension = dimension;
        const config = this.dimensions[dimension];

        this.updateZones(config.zones);
        this.updateGuillotines(config.guillotine);
        this.updateUI();

        const event = new CustomEvent('dimensionChange', {
            detail: {
                dimension: dimension,
                config: config
            }
        });
        document.dispatchEvent(event);

        return true;
    }

    updateZones(zones) {
        this.activeZones.clear();
        zones.forEach((active, index) => {
            if (active) {
                this.activeZones.add(`zone${index + 1}`);
            }
        });

        temperatureControl.updateActiveZones(Array.from(this.activeZones));
    }

    updateGuillotines(positions) {
        this.guillotinePositions = new Map(Object.entries(positions));
        caissonControl.adjustForDimension(positions);
    }

    validateDimensionForMaterial(material) {
        if (!material.compatibleDimensions?.includes(this.currentDimension)) {
            const event = new CustomEvent('validationError', {
                detail: {
                    type: 'dimension',
                    message: `Dimension ${this.currentDimension} incompatible avec le matériau ${material.name}`
                }
            });
            document.dispatchEvent(event);
            return false;
        }
        return true;
    }

    checkZoneStatus(zoneId) {
        if (!this.activeZones.has(zoneId)) {
            console.warn(`Zone ${zoneId} inactive pour la dimension actuelle`);
            return false;
        }
        return true;
    }

    getCurrentConfig() {
        return {
            dimension: this.currentDimension,
            zones: Array.from(this.activeZones),
            guillotines: Object.fromEntries(this.guillotinePositions)
        };
    }

    updateUI() {
        const dimensionDisplay = document.querySelector('.current-dimension');
        if (dimensionDisplay) {
            dimensionDisplay.textContent = this.currentDimension;
        }

        document.querySelectorAll('.zone-indicator').forEach(indicator => {
            const zoneId = indicator.dataset.zone;
            indicator.classList.toggle('active', this.activeZones.has(zoneId));
        });

        this.updateGuillotineDisplay();
    }

    updateGuillotineDisplay() {
        const guillotineDisplay = document.querySelector('.guillotine-positions');
        if (!guillotineDisplay) return;

        const positions = Object.fromEntries(this.guillotinePositions);
        guillotineDisplay.innerHTML = `
            <div>Guillotine gauche: ${positions.left}cm</div>
            <div>Guillotine droite: ${positions.right}cm</div>
        `;
    }
}

export const dimensionManager = new DimensionManager();
