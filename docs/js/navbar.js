// Responsive navbar functionality
function toggleMobileMenu() {
    const nav = document.querySelector('.navbar-nav');
    const toggle = document.querySelector('.navbar-toggle');

    nav.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const nav = document.querySelector('.navbar-nav');
    const toggle = document.querySelector('.navbar-toggle');
    const navbar = document.querySelector('.navbar');

    if (nav && toggle && navbar) {
        if (!navbar.contains(e.target) && nav.classList.contains('active')) {
            nav.classList.remove('active');
            toggle.classList.remove('active');
        }
    }
});

// Close mobile menu when clicking a link
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.querySelector('.navbar-nav');
            const toggle = document.querySelector('.navbar-toggle');
            if (nav && toggle && window.innerWidth <= 768) {
                nav.classList.remove('active');
                toggle.classList.remove('active');
            }
        });
    });
});
