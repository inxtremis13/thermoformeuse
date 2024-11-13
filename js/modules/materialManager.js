import { CONFIG } from './config.js';
import { validationManager } from './validationManager.js';
import { temperatureControl } from './temperatureControl.js';
import { caissonControl } from './caissonControl.js';

class MaterialManager {
    constructor() {
        this.currentMaterial = null;
        this.materials = new Map();
        this.customMaterials = new Map();
        this.presets = new Map();
        this.init();
    }

    init() {
        this.loadMaterials();
        this.loadPresets();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('materialSelected', this.handleMaterialSelection.bind(this));
        document.addEventListener('temperatureChange', this.handleTemperatureChange.bind(this));
        document.addEventListener('presetSaved', this.handlePresetSave.bind(this));
    }

    loadMaterials() {
        CONFIG.materials?.forEach(material => {
            this.materials.set(material.id, material);
        });
    }

    loadPresets() {
        const savedPresets = localStorage.getItem('materialPresets');
        if (savedPresets) {
            try {
                const presets = JSON.parse(savedPresets);
                presets.forEach(preset => this.presets.set(preset.id, preset));
            } catch (error) {
                console.error('Erreur lors du chargement des présets:', error);
            }
        }
    }

    setMaterial(materialId) {
        const material = this.materials.get(materialId) || this.customMaterials.get(materialId);
        
        if (!material) {
            console.error(`Matériau ${materialId} non trouvé`);
            return false;
        }

        const validation = validationManager.validateMaterial(material);
        if (!validation.isValid) {
            console.error(validation.message);
            return false;
        }

        this.currentMaterial = material;
        this.applyMaterialSettings(material);
        this.notifyMaterialChange(material);
        return true;
    }

    applyMaterialSettings(material) {
        // Appliquer les températures par zone
        Object.entries(material.temperatures).forEach(([zoneId, temp]) => {
            temperatureControl.setTargetTemperature(zoneId, temp);
        });

        // Configurer le caisson aspirant
        if (material.caissonMode) {
            caissonControl.setMode(material.caissonMode);
        }

        // Appliquer d'autres paramètres spécifiques au matériau
        if (material.additionalSettings) {
            this.applyAdditionalSettings(material.additionalSettings);
        }
    }

    applyAdditionalSettings(settings) {
        if (settings.autoMode) {
            this.setAutoMode(settings.autoMode);
        }
        
        if (settings.customParameters) {
            this.setCustomParameters(settings.customParameters);
        }
    }

    createCustomMaterial(materialData) {
        const materialId = Date.now().toString();
        const newMaterial = {
            id: materialId,
            createdAt: new Date(),
            ...materialData
        };

        const validation = validationManager.validateMaterial(newMaterial);
        if (!validation.isValid) {
            console.error(validation.message);
            return false;
        }

        this.customMaterials.set(materialId, newMaterial);
        this.saveCustomMaterials();
        this.notifyMaterialCreated(newMaterial);
        return materialId;
    }

    savePreset(name, settings) {
        const presetId = Date.now().toString();
        const preset = {
            id: presetId,
            name,
            settings,
            createdAt: new Date()
        };

        this.presets.set(presetId, preset);
        this.savePresetsToStorage();
        this.notifyPresetSaved(preset);
        return presetId;
    }

    notifyMaterialChange(material) {
        const event = new CustomEvent('materialChange', {
            detail: { material }
        });
        document.dispatchEvent(event);
    }

    notifyMaterialCreated(material) {
        const event = new CustomEvent('materialCreated', {
            detail: { material }
        });
        document.dispatchEvent(event);
    }

    notifyPresetSaved(preset) {
        const event = new CustomEvent('presetSaved', {
            detail: { preset }
        });
        document.dispatchEvent(event);
    }

    getCurrentMaterial() {
        return this.currentMaterial;
    }

    getMaterialById(id) {
        return this.materials.get(id) || this.customMaterials.get(id);
    }

    getAllMaterials() {
        return {
            standard: Array.from(this.materials.values()),
            custom: Array.from(this.customMaterials.values())
        };
    }

    getPresets() {
        return Array.from(this.presets.values());
    }
}

export const materialManager = new MaterialManager();
