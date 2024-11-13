class AspiratingControl {
    constructor() {
        this.colors = {
            open: '#4f9482',
            closed: '#944f4f'
        };
        this.state = localStorage.getItem('guillotineState') || 'off';
        this.initializeControls();
        this.initializeState();
    }

    initializeState() {
        const guillotineLeft = document.querySelector('.guillotine.guillotine-left');
        const guillotineRight = document.querySelector('.guillotine.guillotine-right');
        const verinLeftWall = document.querySelector('.verin-left-wall');
        const verinBackWall = document.querySelector('.verin-back-wall');
        const verinPaths = document.querySelectorAll('.verin path');
        const controlButtons = document.querySelectorAll('.caisson-controls .control-btn');

        if (this.state === 'on') {
            this.animateGuillotine(guillotineLeft, 0, this.colors.open);
            this.animateGuillotine(guillotineRight, 0, this.colors.open);
            if (verinLeftWall) verinLeftWall.style.background = this.colors.open;
            if (verinBackWall) verinBackWall.style.background = this.colors.open;
            controlButtons.forEach(btn => {
                if (btn.textContent.trim().toLowerCase() === 'on') {
                    btn.classList.add('active');
                }
            });
        } else {
            this.animateGuillotine(guillotineLeft, 5, this.colors.closed);
            this.animateGuillotine(guillotineRight, 5, this.colors.closed);
            if (verinLeftWall) verinLeftWall.style.background = this.colors.closed;
            if (verinBackWall) verinBackWall.style.background = this.colors.closed;
            controlButtons.forEach(btn => {
                if (btn.textContent.trim().toLowerCase() === 'off') {
                    btn.classList.add('active');
                }
            });
        }

        verinPaths.forEach(path => {
            if (path.getAttribute('fill') === '#4f9482' || path.getAttribute('fill') === '#944f4f') {
                path.setAttribute('fill', this.state === 'on' ? this.colors.open : this.colors.closed);
            }
        });
    }

    initializeControls() {
        const controlButtons = document.querySelectorAll('.caisson-controls .control-btn');
        const guillotineLeft = document.querySelector('.guillotine.guillotine-left');
        const guillotineRight = document.querySelector('.guillotine.guillotine-right');
        const verinLeftWall = document.querySelector('.verin-left-wall');
        const verinBackWall = document.querySelector('.verin-back-wall');
        const verinPaths = document.querySelectorAll('.verin path');

        controlButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.textContent.trim().toLowerCase();
                
                controlButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                this.state = action;
                localStorage.setItem('guillotineState', action);

                if (action === 'on') {
                    this.animateGuillotine(guillotineLeft, 0, this.colors.open);
                    this.animateGuillotine(guillotineRight, 0, this.colors.open);
                    if (verinLeftWall) verinLeftWall.style.background = this.colors.open;
                    if (verinBackWall) verinBackWall.style.background = this.colors.open;
                    verinPaths.forEach(path => {
                        if (path.getAttribute('fill') === '#944f4f' || path.getAttribute('fill') === '#4f9482') {
                            path.setAttribute('fill', this.colors.open);
                        }
                    });
                } else {
                    this.animateGuillotine(guillotineLeft, 5, this.colors.closed);
                    this.animateGuillotine(guillotineRight, 5, this.colors.closed);
                    if (verinLeftWall) verinLeftWall.style.background = this.colors.closed;
                    if (verinBackWall) verinBackWall.style.background = this.colors.closed;
                    verinPaths.forEach(path => {
                        if (path.getAttribute('fill') === '#4f9482' || path.getAttribute('fill') === '#944f4f') {
                            path.setAttribute('fill', this.colors.closed);
                        }
                    });
                }
            });
        });
    }

    animateGuillotine(element, targetPosition, color) {
        if (!element) return;
        element.style.transition = 'bottom 1s ease-in-out, background-color 1s ease-in-out';
        element.style.bottom = `${targetPosition}cm`;
        element.style.background = color;
    }
}

export const aspiratingControl = new AspiratingControl(); 