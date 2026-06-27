/* =============================================================================
   SHARED NAV BEHAVIOR — static pages (art-projects.html, web-projects.html)
   These pages have no scroll-driven hero, so they don't load script.js's
   full scroll engine — but they share the exact same nav markup and need
   the same behaviors: (1) measure --nav-h for .art-section's padding, and
   (2) the mobile hamburger/panel/scrim/Escape behavior below 640px.
   Keep this in sync with the equivalent block in script.js.
============================================================================= */
(function () {
    function setNavOffset() {
        const nav = document.querySelector('.site-header');
        if (!nav) return;
        document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
    }

    setNavOffset();
    window.addEventListener('resize', setNavOffset);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(setNavOffset);
    }

    const toggle = document.getElementById('navToggle');
    const navList = document.getElementById('navList');
    const scrim = document.getElementById('navScrim');
    if (!toggle || !navList) return;

    function openMenu() {
        document.body.classList.add('nav-open');
        toggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu({ returnFocus = false } = {}) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => {
        const isOpen = document.body.classList.contains('nav-open');
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (scrim) {
        scrim.addEventListener('click', () => closeMenu());
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
            closeMenu({ returnFocus: true });
        }
    });

    navList.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => closeMenu());
    });
})();
