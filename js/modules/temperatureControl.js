import { CONFIG } from './config.js';
import { alarmManager } from './alarmManager.js';
import { temperatureSimulator } from './temperatureSimulator.js';

export const temperatureControl = {
    temperatures: {},
    activeZones: new Set(),
    simulations: new Map(),

    init() {
        console.log('Temperature control initialized');
        this.initializeSliders();
        this.initializeButtons();
        this.setupEventListeners();
        temperatureSimulator.init();
    },

    initializeSliders() {
        const temperatureBlocks = document.querySelectorAll('.temperature-block');
        
        temperatureBlocks.forEach(block => {
            const zoneId = block.id.split('-')[2];
            
            // Slider de consigne
            const targetSlider = block.querySelector('.slider:not(.alarme)');
            const targetLabel = targetSlider.previousElementSibling.querySelector('.slider-value');
            
            // Slider d'alarme
            const alarmSlider = block.querySelector('.slider.alarme');
            const alarmLabel = alarmSlider.previousElementSibling.querySelector('.slider-value');
            
            // Initialisation des valeurs
            const initialTemp = temperatureSimulator.temperatures[zoneId]?.current || 0;
            
            // Configuration initiale du slider de consigne
            targetSlider.value = initialTemp;
            targetLabel.textContent = `${initialTemp}°C`;
            
            // Configuration initiale du slider d'alarme (+50°C par défaut)
            const initialAlarmTemp = initialTemp + 50;
            alarmSlider.value = initialAlarmTemp;
            alarmLabel.textContent = `${initialAlarmTemp}°C`;

            let lastTargetValue = initialTemp;
            let isAlarmManuallySet = false;

            // Événement pour le slider de consigne
            targetSlider.addEventListener('input', (e) => {
                const targetValue = parseInt(e.target.value);
                targetLabel.textContent = `${targetValue}°C`;
                
                // Si l'alarme n'est pas en mode manuel ou si on monte la consigne
                if (!isAlarmManuallySet || targetValue > lastTargetValue) {
                    const newAlarmValue = targetValue + 50;
                    alarmSlider.value = newAlarmValue;
                    alarmLabel.textContent = `${newAlarmValue}°C`;
                } else {
                    // En mode manuel, on garde l'écart si on baisse la consigne
                    const currentDiff = parseInt(alarmSlider.value) - lastTargetValue;
                    const newAlarmValue = targetValue + currentDiff;
                    alarmSlider.value = newAlarmValue;
                    alarmLabel.textContent = `${newAlarmValue}°C`;
                }
                
                lastTargetValue = targetValue;
                this.updateTargetTemperature(zoneId, targetValue);
                this.updateAlarmThreshold(zoneId, parseInt(alarmSlider.value));
            });

            // Événement pour le slider d'alarme
            alarmSlider.addEventListener('input', (e) => {
                const alarmValue = parseInt(e.target.value);
                const targetValue = parseInt(targetSlider.value);
                const maxAlarmValue = targetValue + 50;

                if (alarmValue > maxAlarmValue) {
                    // Bloquer à consigne + 50°C si on essaie de monter plus haut
                    alarmSlider.value = maxAlarmValue;
                    alarmLabel.textContent = `${maxAlarmValue}°C`;
                    isAlarmManuallySet = false;
                } else {
                    // Permettre de descendre en dessous de consigne + 50°C
                    alarmLabel.textContent = `${alarmValue}°C`;
                    isAlarmManuallySet = true;
                }
                
                this.updateAlarmThreshold(zoneId, parseInt(alarmSlider.value));
            });

            // Ajout de l'édition des valeurs avec popup
            const editButtons = block.querySelectorAll('.edit-value');
            
            editButtons.forEach(editBtn => {
                editBtn.addEventListener('click', (e) => {
                    // Vérifier si le bouton OFF est actif
                    const offButton = block.querySelector('.control-btn[onclick*="off"].active');
                    if (offButton) {
                        return; // Ne rien faire si OFF est actif
                    }

                    const container = e.target.closest('.slider-value-container');
                    const valueSpan = container.querySelector('.slider-value');
                    const currentValue = parseInt(valueSpan.textContent);
                    const slider = container.closest('.slider-container').querySelector('.slider');
                    
                    // Création de la popup
                    const popup = document.createElement('div');
                    popup.className = 'edit-popup';
                    popup.innerHTML = `
                        <div class="popup-content">
                            <h3>Éditer la température</h3>
                            <input type="number" class="popup-input" value="${currentValue}" min="0" max="${slider.max}">
                            <div class="popup-buttons">
                                <button class="popup-btn cancel">Annuler</button>
                                <button class="popup-btn confirm">Confirmer</button>
                            </div>
                        </div>
                    `;
                    
                    document.body.appendChild(popup);
                    const input = popup.querySelector('.popup-input');
                    input.focus();
                    input.select();

                    // Gestion des boutons
                    const handleConfirm = () => {
                        const newValue = Math.min(Math.max(0, parseInt(input.value) || 0), parseInt(slider.max));
                        slider.value = newValue;
                        valueSpan.textContent = `${newValue}°C`;
                        popup.remove();
                        
                        // Déclencher l'événement input pour mettre à jour la simulation
                        slider.dispatchEvent(new Event('input'));
                    };

                    popup.querySelector('.confirm').addEventListener('click', handleConfirm);
                    popup.querySelector('.cancel').addEventListener('click', () => popup.remove());
                    
                    // Validation avec Enter
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleConfirm();
                        }
                    });
                });
            });
        });
    },

    initializeButtons() {
        const temperatureBlocks = document.querySelectorAll('.temperature-block');
        
        temperatureBlocks.forEach(block => {
            const zoneId = block.id.split('-')[2];
            const buttons = block.querySelectorAll('.control-btn');
            const statusText = block.querySelector('.status-text');

            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.textContent.trim().toLowerCase();
                    const offButton = Array.from(buttons).find(btn => 
                        btn.textContent.trim().toLowerCase() === 'off'
                    );
                    
                    // Vérifier si OFF est actif et qu'on veut changer d'état
                    if (offButton.classList.contains('active') && action !== 'off') {
                        let actionText = '';
                        switch(action) {
                            case 'on':
                                actionText = 'démarrer';
                                break;
                            case 'auto':
                                actionText = 'passer en mode automatique';
                                break;
                        }

                        const popup = document.createElement('div');
                        popup.className = 'security-popup';
                        popup.innerHTML = `
                            <div class="popup-content">
                                <div class="popup-header">
                                    <i class="fas fa-exclamation-triangle warning-icon"></i>
                                    <h3>Confirmation de sécurité</h3>
                                </div>
                                <p>Êtes-vous sûr de vouloir ${actionText} le chauffage de la zone ${zoneId} ?</p>
                                <p class="warning-text">Cette action nécessite une confirmation de sécurité.</p>
                                <div class="popup-buttons">
                                    <button class="popup-btn cancel">Annuler</button>
                                    <button class="popup-btn confirm">Confirmer</button>
                                </div>
                            </div>
                        `;
                        
                        document.body.appendChild(popup);

                        popup.querySelector('.cancel').addEventListener('click', () => {
                            popup.remove();
                        });

                        popup.querySelector('.confirm').addEventListener('click', () => {
                            // Réinitialiser tous les boutons
                            buttons.forEach(btn => {
                                btn.classList.remove('active');
                                btn.style.backgroundColor = '#12121B';
                            });
                            // Activer le nouveau bouton
                            button.classList.add('active');
                            button.style.backgroundColor = '#94824f';
                            
                            this.handleZoneControl(zoneId, action, statusText);
                            popup.remove();
                        });
                    } else {
                        // Réinitialiser tous les boutons
                        buttons.forEach(btn => {
                            btn.classList.remove('active');
                            btn.style.backgroundColor = '#12121B';
                        });
                        // Activer le nouveau bouton
                        button.classList.add('active');
                        button.style.backgroundColor = '#94824f';
                        
                        this.handleZoneControl(zoneId, action, statusText);
                    }
                });
            });
        });
    },

    setupEventListeners() {
        document.addEventListener('temperatureUpdate', (event) => {
            const { zone, current, target } = event.detail;
            this.updateDisplay(zone, current);
            this.checkAlarms(zone, current);
        });
    },

    handleZoneControl(zoneId, action, statusElement) {
        let status = '';
        const targetTemp = action === 'off' ? 0 : 
            parseFloat(document.querySelector(`#temperature-zone-${zoneId} .slider:not(.alarme)`).value);

        switch (action) {
            case 'on':
                status = 'actif';
                this.enableSliders(zoneId);
                this.simulateTemperature(zoneId, targetTemp);
                break;
            case 'off':
                status = 'inactif';
                this.disableAndResetSliders(zoneId);
                this.simulateTemperature(zoneId, 0);
                break;
            case 'auto':
                status = 'automatique';
                this.enableSliders(zoneId);
                this.simulateTemperature(zoneId, targetTemp);
                break;
        }
        if (statusElement) {
            statusElement.textContent = status;
        }
    },

    // Nouvelle méthode pour désactiver et réinitialiser les sliders
    disableAndResetSliders(zoneId) {
        const block = document.querySelector(`#temperature-zone-${zoneId}`);
        if (!block) return;

        const sliders = block.querySelectorAll('.slider');
        const targetSlider = block.querySelector('.slider:not(.alarme)');
        const alarmSlider = block.querySelector('.slider.alarme');
        const targetLabel = targetSlider.previousElementSibling.querySelector('.slider-value');
        const alarmLabel = alarmSlider.previousElementSibling.querySelector('.slider-value');
        const editButtons = block.querySelectorAll('.edit-value');

        // Désactiver les crayons d'édition
        editButtons.forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.3';
        });

        // Désactiver les sliders
        sliders.forEach(slider => {
            slider.disabled = true;
            slider.classList.add('disabled');
        });

        // Animation de retour à zéro
        const startValue = parseInt(targetSlider.value);
        const duration = 1000;
        const startTime = performance.now();

        const animateSliders = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
            const smoothProgress = easeOutCubic(progress);

            const currentValue = Math.round(startValue * (1 - smoothProgress));
            
            targetSlider.value = currentValue;
            targetLabel.textContent = `${currentValue}°C`;

            alarmSlider.value = currentValue + 50;
            alarmLabel.textContent = `${currentValue + 50}°C`;

            if (progress < 1) {
                requestAnimationFrame(animateSliders);
            }
        };

        requestAnimationFrame(animateSliders);
    },

    // Nouvelle méthode pour réactiver les sliders
    enableSliders(zoneId) {
        const block = document.querySelector(`#temperature-zone-${zoneId}`);
        if (!block) return;

        const sliders = block.querySelectorAll('.slider');
        const editButtons = block.querySelectorAll('.edit-value');

        // Réactiver les crayons d'édition
        editButtons.forEach(btn => {
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        });

        // Réactiver les sliders
        sliders.forEach(slider => {
            slider.disabled = false;
            slider.classList.remove('disabled');
        });
    },

    startHeating(zoneId) {
        console.log(`Démarrage du chauffage de la zone ${zoneId}`);
        const zone = document.querySelector(`#temperature-zone-${zoneId}`);
        if (zone) {
            // Logique de démarrage du chauffage
        }
    },

    updateTargetTemperature(zoneId, temperature) {
        console.log(`Mise à jour de la température cible de la zone ${zoneId}: ${temperature}°C`);
        temperatureSimulator.setTargetTemperature(zoneId, temperature);
    },

    updateAlarmThreshold(zoneId, alarmThreshold) {
        // Logique de mise à jour du seuil d'alarme
    },

    setAutoMode(zoneId) {
        // Logique de mise en mode automatique
    },

    stopHeating(zoneId) {
        // Logique d'arrêt du chauffage
    },

    updateDisplay(zone, current) {
        const tempValue = document.querySelector(`#temperature-zone-${zone} .temp-value`);
        const tempCircle = document.querySelector(`#temperature-zone-${zone} .temp-circle`);
        const warningContainer = document.querySelector(`#temperature-zone-${zone} .warning-container`);
        
        if (tempValue) {
            tempValue.textContent = `${Math.round(current)}°C`;
        }

        if (!warningContainer) {
            // Créer le conteneur d'avertissement s'il n'existe pas
            const container = document.createElement('div');
            container.className = 'warning-container';
            container.innerHTML = `
                <div class="warning-triangle">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="warning-message"></div>
            `;
            tempCircle.parentNode.insertBefore(container, tempCircle.nextSibling);
        }

        const warningTriangle = document.querySelector(`#temperature-zone-${zone} .warning-triangle`);
        const warningMessage = document.querySelector(`#temperature-zone-${zone} .warning-message`);
        
        // Définition des seuils et leurs caractéristiques
        const dangerLevels = {
            safe: { maxTemp: 40, color: 'hsla(210, 100%, 50%, %o)', message: 'Température normale' },
            attention: { maxTemp: 60, color: 'hsla(30, 100%, 50%, %o)', message: 'Attention : Surface chaude' },
            danger: { maxTemp: 100, color: 'hsla(0, 100%, 50%, %o)', message: 'Danger : Risque de brûlure' },
            extreme: { maxTemp: 150, color: 'hsla(60, 100%, 50%, %o)', message: 'Danger extrême : Zone interdite' },
            critical: { maxTemp: Infinity, color: 'hsla(0, 0%, 100%, %o)', message: 'DANGER CRITIQUE : Brulure Critique ! ' }
        };

        // Déterminer le niveau de danger actuel
        let currentLevel = Object.entries(dangerLevels).find(([_, level]) => current <= level.maxTemp) || 'critical';
        currentLevel = currentLevel[0];

        // Mise à jour du triangle et du message
        const levelColor = dangerLevels[currentLevel].color.replace('%o', '1');
        warningTriangle.style.color = levelColor;
        warningMessage.textContent = dangerLevels[currentLevel].message;
        warningMessage.style.color = levelColor;

        // Gestion de l'affichage du warning
        if (currentLevel === 'safe') {
            warningTriangle.style.display = 'none';
            warningMessage.style.display = 'none';
        } else {
            warningTriangle.style.display = 'block';
            warningMessage.style.display = 'block';
        }

        if (current > 100) {
            // Pulsations pour les températures extrêmes
            const maxDiff = 200 - 100;
            const currentDiff = current - 100;
            const intensity = Math.min(currentDiff / maxDiff, 1);
            this.startDangerPulsing(tempCircle, intensity, dangerLevels[currentLevel].color);
            return;
        }

        // Arrêt des pulsations si la température redescend
        this.stopPulsing(tempCircle);

        // Gestion des lueurs normales
        let glowColor = dangerLevels[currentLevel].color;
        let opacity = 0.3 + (current / 200) * 0.6;
        let glowIntensity = 5 + (current / 200) * 15;

        const innerGlow = `0 0 ${glowIntensity/2}px ${glowColor.replace('%o', opacity)}`;
        const outerGlow = `0 0 ${glowIntensity}px ${glowColor.replace('%o', opacity)}`;
        tempCircle.style.boxShadow = `${innerGlow}, ${outerGlow}`;
        tempCircle.style.borderColor = glowColor.replace('%o', '1');
    },

    startDangerPulsing(element, intensity, colorTemplate) {
        if (element.pulseAnimation) {
            clearInterval(element.pulseAnimation);
        }

        let phase = 0;
        const pulseSpeed = 0.08 + (intensity * 0.15);
        const pulseRange = 8 + (intensity * 12);
        const baseIntensity = 15 + (intensity * 10);

        element.pulseAnimation = setInterval(() => {
            phase = (phase + pulseSpeed) % (2 * Math.PI);
            const currentIntensity = baseIntensity + Math.sin(phase) * pulseRange;
            const opacity = 0.7 + Math.sin(phase) * 0.3;
            
            const innerGlow = `0 0 ${currentIntensity/2}px ${colorTemplate.replace('%o', opacity)}`;
            const outerGlow = `0 0 ${currentIntensity}px ${colorTemplate.replace('%o', opacity)}`;
            
            element.style.boxShadow = `${innerGlow}, ${outerGlow}`;
            element.style.borderColor = colorTemplate.replace('%o', '1');
        }, 50);
    },

    stopPulsing(element) {
        if (element.pulseAnimation) {
            clearInterval(element.pulseAnimation);
            element.pulseAnimation = null;
        }
    },

    checkAlarms(zone, temperature) {
        const thresholds = CONFIG.alarms.thresholds.temperature;
        if (temperature >= thresholds.critical) {
            this.triggerAlarm(zone, temperature, 'critical');
        } else if (temperature >= thresholds.warning) {
            this.triggerAlarm(zone, temperature, 'warning');
        }
    },

    triggerAlarm(zone, temperature, severity) {
        document.dispatchEvent(new CustomEvent('alarmTriggered', {
            detail: {
                type: 'temperature',
                zone,
                temperature,
                severity
            }
        }));
    },

    simulateTemperature(zone, target) {
        if (this.simulations.has(zone)) {
            clearInterval(this.simulations.get(zone));
        }

        let current = parseFloat(document.querySelector(`#temperature-zone-${zone} .temp-value`).textContent);
        
        const simulation = setInterval(() => {
            if (Math.abs(current - target) < 0.1) {
                current = target;
                this.updateDisplay(zone, current);
                clearInterval(simulation);
                this.simulations.delete(zone);
                return;
            }

            current += (target - current) * 0.1;
            this.updateDisplay(zone, current);
        }, 100);

        this.simulations.set(zone, simulation);
    }
};
