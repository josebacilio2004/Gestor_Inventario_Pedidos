// Responsive navbar functionality - Updated for Industrial Forge Design
function toggleMobileNav() {
    const overlay = document.getElementById('mobileNavOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden');
        document.body.classList.toggle('overflow-hidden');
    }
}

// Navbar Scrolled State detection for transparent to solid transition
window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav') || document.querySelector('header');
    if (nav) {
        const isScrolled = window.scrollY > 20;
        nav.classList.toggle('scrolled-nav', isScrolled);
        // If it's the index landing, we might want more specific classes
        if (document.getElementById('inicio')) {
            nav.classList.toggle('bg-slate-50/95', isScrolled);
            nav.classList.toggle('dark:bg-slate-900/95', isScrolled);
        }
    }
});

// Close mobile menu when clicking a link
document.addEventListener('DOMContentLoaded', () => {
    const mobileLinks = document.querySelectorAll('#mobileNavOverlay a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            const overlay = document.getElementById('mobileNavOverlay');
            if (overlay && !overlay.classList.contains('hidden')) {
                toggleMobileNav();
            }
        });
    });
});
