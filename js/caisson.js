
    const sliders = document.querySelectorAll('.slider');
    
    sliders.forEach(slider => {
        // Initialiser la valeur
        const container = slider.closest('.slider-container');
        const label = container.querySelector('label');
        
        // Créer le span pour la valeur s'il n'existe pas
        let valueSpan = label.querySelector('.slider-value');
        if (!valueSpan) {
            valueSpan = document.createElement('span');
            valueSpan.classList.add('slider-value');
            label.appendChild(valueSpan);
        }
        
        // Définir la valeur initiale
        valueSpan.textContent = `${slider.value}°C`;
        
        // Mettre à jour lors du changement
        slider.addEventListener('input', function() {
            valueSpan.textContent = `${this.value}°C`;
        });
    });
    
    // Effet spline 3D simplifié
    const caisson = document.querySelector('.caisson');
    if (caisson) {
        let isDragging = false;
        let startX, startY;
        const initialRotation = { x: 60, y: 0 };
        let currentRotation = { ...initialRotation };

        caisson.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            caisson.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = (e.clientX - startX) * 0.5;
            const deltaY = (e.clientY - startY) * 0.5;

            currentRotation.y = Math.max(-20, Math.min(20, deltaX));
            currentRotation.x = Math.max(40, Math.min(80, 60 + deltaY));

            caisson.style.transform = `rotateX(${currentRotation.x}deg) rotateY(${currentRotation.y}deg)`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                caisson.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                caisson.style.transform = `rotateX(${initialRotation.x}deg) rotateY(${initialRotation.y}deg)`;
                currentRotation = { ...initialRotation };
            }
        });
    }
