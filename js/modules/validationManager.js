import { CONFIG } from './config.js';

class ValidationManager {
    constructor() {
        this.validationHistory = [];
        this.validationRules = new Map();
        this.init();
    }

    init() {
        this.initializeRules();
        this.setupEventListeners();
    }

    initializeRules() {
        this.validationRules.set('temperature', {
            validate: this.validateTemperature.bind(this),
            limits: CONFIG.defaultTemperatures
        });

        this.validationRules.set('pressure', {
            validate: this.validatePressure.bind(this),
            limits: CONFIG.pressure
        });

        this.validationRules.set('dimensions', {
            validate: this.validateDimensions.bind(this),
            config: CONFIG.dimensions
        });

        this.validationRules.set('material', {
            validate: this.validateMaterial.bind(this),
            config: CONFIG.materials
        });
    }

    setupEventListeners() {
        document.addEventListener('temperatureChange', this.handleTemperatureChange.bind(this));
        document.addEventListener('pressureChange', this.handlePressureChange.bind(this));
        document.addEventListener('materialChange', this.handleMaterialChange.bind(this));
    }

    validate(type, value, config = null) {
        const rule = this.validationRules.get(type);
        if (!rule) {
            console.error(`Règle de validation non trouvée pour: ${type}`);
            return { isValid: false, message: 'Type de validation invalide' };
        }

        const result = rule.validate(value, config || rule.limits || rule.config);
        this.logValidation(type, value, result);
        return result;
    }

    validateTemperature(value, limits) {
        if (typeof value !== 'number') {
            return {
                isValid: false,
                message: 'La valeur de température doit être un nombre'
            };
        }

        return {
            isValid: value >= limits.min && value <= limits.max,
            message: `La température doit être entre ${limits.min}°C et ${limits.max}°C`
        };
    }

    validatePressure(value, limits) {
        if (typeof value !== 'number') {
            return {
                isValid: false,
                message: 'La valeur de pression doit être un nombre'
            };
        }

        return {
            isValid: value >= limits.min && value <= limits.max,
            message: `La pression doit être entre ${limits.min} et ${limits.max} bars`
        };
    }

    validateDimensions(dimensions) {
        if (!CONFIG.dimensions[dimensions]) {
            return {
                isValid: false,
                message: 'Dimensions non valides'
            };
        }

        return {
            isValid: true,
            message: 'Dimensions valides'
        };
    }

    validateMaterial(material) {
        if (!material || !material.id || !material.temperatures) {
            return {
                isValid: false,
                message: 'Configuration du matériau invalide'
            };
        }

        for (const [zone, temp] of Object.entries(material.temperatures)) {
            const tempValidation = this.validate('temperature', temp, CONFIG.defaultTemperatures);
            if (!tempValidation.isValid) {
                return {
                    isValid: false,
                    message: `Zone ${zone}: ${tempValidation.message}`
                };
            }
        }

        return {
            isValid: true,
            message: 'Configuration du matériau valide'
        };
    }

    handleTemperatureChange(event) {
        const { zoneId, temperature } = event.detail;
        const validation = this.validate('temperature', temperature);
        
        if (!validation.isValid) {
            document.dispatchEvent(new CustomEvent('validationError', {
                detail: {
                    type: 'temperature',
                    zoneId,
                    message: validation.message
                }
            }));
        }
    }

    handlePressureChange(event) {
        const { pressure } = event.detail;
        const validation = this.validate('pressure', pressure);
        
        if (!validation.isValid) {
            document.dispatchEvent(new CustomEvent('validationError', {
                detail: {
                    type: 'pressure',
                    message: validation.message
                }
            }));
        }
    }

    handleMaterialChange(event) {
        const { material } = event.detail;
        const validation = this.validate('material', material);
        
        if (!validation.isValid) {
            document.dispatchEvent(new CustomEvent('validationError', {
                detail: {
                    type: 'material',
                    materialId: material.id,
                    message: validation.message
                }
            }));
        }
    }

    logValidation(type, value, result) {
        this.validationHistory.push({
            timestamp: new Date(),
            type: type,
            value: value,
            result: result
        });

        if (this.validationHistory.length > 1000) {
            this.validationHistory.shift();
        }
    }

    getValidationHistory(type = null) {
        if (!type) return this.validationHistory;
        return this.validationHistory.filter(v => v.type === type);
    }

    getValidationStats() {
        const stats = {
            total: this.validationHistory.length,
            success: 0,
            failure: 0,
            byType: {}
        };

        this.validationHistory.forEach(validation => {
            if (validation.result.isValid) {
                stats.success++;
            } else {
                stats.failure++;
            }

            if (!stats.byType[validation.type]) {
                stats.byType[validation.type] = {
                    total: 0,
                    success: 0,
                    failure: 0
                };
            }

            stats.byType[validation.type].total++;
            if (validation.result.isValid) {
                stats.byType[validation.type].success++;
            } else {
                stats.byType[validation.type].failure++;
            }
        });

        return stats;
    }
}

export const validationManager = new ValidationManager();
