export const temperatureSimulator = {
    temperatures: {
        1: {
            current: 150,
            target: 160,
            min: 0,
            max: 1000,
            variation: 0.1,
            adjustmentSpeed: 0.01
        },
        2: {
            current: 165,
            target: 170,
            min: 0,
            max: 1000,
            variation: 0.1,
            adjustmentSpeed: 0.01
        },
        3: {
            current: 145,
            target: 155,
            min: 0,
            max: 1000,
            variation: 0.1,
            adjustmentSpeed: 0.01
        }
    },

    init() {
        console.log('Temperature simulator initialized');
        this.startSimulation();
    },

    startSimulation() {
        setInterval(() => {
            Object.keys(this.temperatures).forEach(zone => {
                this.updateTemperature(zone);
            });
        }, 500);
    },

    updateTemperature(zone) {
        const temp = this.temperatures[zone];
        const targetDiff = temp.target - temp.current;
        
        if (Math.abs(targetDiff) > 0.1) {
            const adjustment = targetDiff * temp.adjustmentSpeed;
            temp.current += adjustment;
        }

        const variation = (Math.random() - 0.5) * temp.variation;
        temp.current += variation;

        temp.current = Math.max(temp.min, Math.min(temp.max, temp.current));

        document.dispatchEvent(new CustomEvent('temperatureUpdate', {
            detail: {
                zone: parseInt(zone),
                current: temp.current,
                target: temp.target,
                source: 'temperatureSimulator'
            }
        }));
    },

    setTargetTemperature(zone, target) {
        if (this.temperatures[zone]) {
            this.temperatures[zone].target = target;
            console.log(`Nouvelle température cible pour zone ${zone}: ${target}°C`);
        }
    }
}; 