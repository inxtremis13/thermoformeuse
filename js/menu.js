
function initializeMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menuContainer = document.querySelector('.menu-container');
    const mainContent = document.querySelector('.alarm-dashboard') || 
                       document.querySelector('.home-dashboard') || 
                       document.querySelector('main');

    if (menuToggle && menuContainer) {
        // Gestionnaire pour le bouton du menu
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menuContainer.classList.toggle('active');
            if (mainContent) {
                mainContent.classList.toggle('menu-active');
            }
        });

        // Fermer le menu en cliquant en dehors
        document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target) && 
                !menuToggle.contains(e.target) && 
                menuContainer.classList.contains('active')) {
                menuContainer.classList.remove('active');
                if (mainContent) {
                    mainContent.classList.remove('menu-active');
                }
            }
        });

        // Empêcher la fermeture lors du clic dans le menu
        menuContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', initializeMenu);
