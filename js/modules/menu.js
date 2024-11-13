export const menuManager = {
    init() {
        this.initializeMenu();
        this.setupEventListeners();
    },

    initializeMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const menuContainer = document.querySelector('.menu-container');
        const mainContent = document.querySelector('.alarm-dashboard') || 
                           document.querySelector('.home-dashboard') || 
                           document.querySelector('main');

        if (menuToggle && menuContainer) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                menuContainer.classList.toggle('active');
                if (mainContent) {
                    mainContent.classList.toggle('menu-active');
                }
            });
        }
    },

    setupEventListeners() {
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    },

    handleOutsideClick(e) {
        const menuContainer = document.querySelector('.menu-container');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (menuContainer && menuToggle && 
            !menuContainer.contains(e.target) && 
            !menuToggle.contains(e.target) && 
            menuContainer.classList.contains('active')) {
            menuContainer.classList.remove('active');
            const mainContent = document.querySelector('.alarm-dashboard, .home-dashboard, main');
            if (mainContent) {
                mainContent.classList.remove('menu-active');
            }
        }
    },

    handleKeyPress(e) {
        if (e.key === 'Escape') {
            const menuContainer = document.querySelector('.menu-container');
            if (menuContainer?.classList.contains('active')) {
                menuContainer.classList.remove('active');
                const mainContent = document.querySelector('.alarm-dashboard, .home-dashboard, main');
                if (mainContent) {
                    mainContent.classList.remove('menu-active');
                }
            }
        }
    }
};
