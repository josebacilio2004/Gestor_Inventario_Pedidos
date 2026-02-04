// Modern mobile drawer menu functionality

function openMobileMenu() {
    const drawer = document.querySelector('.mobile-menu-drawer');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const toggle = document.querySelector('.navbar-toggle');

    if (drawer && overlay) {
        drawer.classList.add('active');
        overlay.classList.add('active');
        toggle.classList.add('active');
        document.body.classList.add('drawer-open');
    }
}

function closeMobileMenu() {
    const drawer = document.querySelector('.mobile-menu-drawer');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const toggle = document.querySelector('.navbar-toggle');

    if (drawer && overlay) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
        toggle.classList.remove('active');
        document.body.classList.remove('drawer-open');
    }
}

function toggleMobileMenu() {
    const drawer = document.querySelector('.mobile-menu-drawer');

    if (drawer && drawer.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});

// Cerrar al hacer click en links
document.addEventListener('DOMContentLoaded', () => {
    const drawerLinks = document.querySelectorAll('.drawer-nav a');
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                setTimeout(closeMobileMenu, 300);
            }
        });
    });
});
