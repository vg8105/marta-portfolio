/* =============================================================================
   MARTA'S PORTFOLIO — SCROLL ENGINE & ANIMATIONS
   Home page only (index.html). art-projects.html and web-projects.html only
   load this for the shared nav behavior they need (none currently — they're
   static pages with no scroll-driven animation, see their own <script> tags).
============================================================================= */

gsap.registerPlugin(ScrollTrigger);

function updateActiveNav(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.section === section);
    });
}

/* =============================================================================
   MOBILE MENU TOGGLE
   Collapses behind a hamburger below 640px (see CSS) — plain DOM APIs, no
   framework JS. Three ways to close: choose a link, click the scrim, or
   press Escape — matching how every other overlay on the web behaves.
============================================================================= */
(function setupNavToggle() {
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

    // Close after choosing a destination, so the next page (or the next
    // scroll position on this page) isn't hidden behind an open panel.
    navList.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => closeMenu());
    });
})();

/* =============================================================================
   SCROLL CUE — the "SCROLL" hint is a real <button> (see HTML/CSS); clicking
   or pressing it scrolls down to the cosmos section, matching what people
   expect when something is shaped like a button.
============================================================================= */
(function setupScrollCue() {
    const cue = document.getElementById('scrollCue');
    const cosmos = document.getElementById('cosmos');
    if (!cue || !cosmos) return;

    cue.addEventListener('click', () => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        cosmos.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
})();

/* =============================================================================
   STARFIELD — decorative, generated once on load
============================================================================= */
(function createStars() {
    const layer = document.getElementById('starsLayer');
    if (!layer) return;

    const STAR_COUNT = 120;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < STAR_COUNT; i++) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        const size = (Math.random() * 2 + 1) + 'px';
        star.style.width = size;
        star.style.height = size;
        star.style.setProperty('--duration', (Math.random() * 4 + 2) + 's');
        star.style.setProperty('--delay', (Math.random() * 4) + 's');
        star.style.setProperty('--max-opacity', (Math.random() * 0.6 + 0.3).toString());
        fragment.appendChild(star);
    }
    layer.appendChild(fragment);
})();


/* =============================================================================
   SCROLL GEOMETRY — single source of truth for the peel-away hero animation
   ---------------------------------------------------------------------------
   See css/style.css, the "SCROLL ENGINE" comment block, for the full
   explanation of the bug this fixes. Short version: the scrollable distance
   (.scroll-driver's height) and the distance the hero panel travels MUST be
   the exact same number, or the animation desyncs from the scrollbar. This
   function is the only place that number is decided, and everything else
   (CSS fallback height, the GSAP tween, the ScrollTrigger range) reads from it.
============================================================================= */

const heroOverlay  = document.getElementById('heroOverlay');
const scrollDriver  = document.getElementById('scrollDriver');
const header        = document.querySelector('header');

let overlayTravel = 0;

function calcScrollGeometry() {
    if (!heroOverlay || !scrollDriver) return;

    // Measure the hero overlay at its natural (untransformed) height.
    // offsetHeight ignores the GSAP `y` transform, so this is safe to call
    // even mid-animation/mid-scroll without feedback-looping the measurement.
    const overlayHeight = heroOverlay.offsetHeight;

    // The panel can never need to travel further than its own height (fully
    // off-screen) — but on short/wide viewports the overlay can be shorter
    // than the viewport itself, so floor it at one viewport height too.
    overlayTravel = Math.max(overlayHeight, window.innerHeight);

    // This is the fix: drive .scroll-driver's height FROM the same
    // measurement the tween uses, instead of letting CSS guess at a number
    // that has to coincidentally match. Now there is no way for these two
    // to drift apart.
    scrollDriver.style.height = overlayTravel + 'px';
}

function setNavOffset() {
    const nav = document.querySelector('.site-header');
    if (!nav) return;
    document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
}

calcScrollGeometry();
setNavOffset();

// Re-measure on resize. ScrollTrigger.refresh() picks up the new
// .scroll-driver height (and re-runs the `y: () => -overlayTravel`
// function below) because invalidateOnRefresh is set on the timeline.
let resizeRAF = null;
window.addEventListener('resize', () => {
    // rAF-throttle so a drag-resize doesn't trigger dozens of synchronous
    // layout reflows per second.
    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(() => {
        calcScrollGeometry();
        setNavOffset();
        ScrollTrigger.refresh();
    });
});

// Re-measure once webfonts have actually finished loading: until then, text
// can render in a fallback font with different metrics, which can shift
// .hero-overlay's height (and therefore the travel distance) out from under
// the geometry calculated above.
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        calcScrollGeometry();
        setNavOffset();
        ScrollTrigger.refresh();
    });
}


/* =============================================================================
   HERO PEEL-AWAY TIMELINE
============================================================================= */
const heroTimeline = gsap.timeline({
    scrollTrigger: {
        trigger: '#scrollDriver',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
        invalidateOnRefresh: true, // re-run the y:() function below after any ScrollTrigger.refresh()
    }
});

// Slide the entire hero overlay (solid bg + drip SVG) upward by exactly the
// distance calculated in calcScrollGeometry() — the same distance
// .scroll-driver was just sized to, so the panel finishes its travel at
// precisely the moment the scrollable space runs out.
heroTimeline.to(heroOverlay, {
    y: () => -overlayTravel,
    ease: 'none',
}, 0);

heroTimeline.to('.hero-content, .scroll-indicator', {
    yPercent: -20,
    opacity: 0,
    ease: 'none',
}, 0);

// Nav color swap: a discrete state change, not something that should be
// scrubbed frame-by-frame. A dedicated ScrollTrigger with onEnter/onLeaveBack
// fires this exactly once per direction instead of toggling a class on every
// scrub tick. `start` is a function so it's re-evaluated on every
// ScrollTrigger.refresh() instead of baking in a stale pixel value from the
// very first measurement.
ScrollTrigger.create({
    trigger: '#scrollDriver',
    start: () => 'top+=' + (scrollDriver.offsetHeight * 0.70) + ' top',
    end: 'bottom top',
    onEnter: () => {
        if (header) header.classList.add('dark');
        updateActiveNav('projects');
    },
    onLeaveBack: () => {
        if (header) header.classList.remove('dark');
        updateActiveNav('home');
    },
});


/* =============================================================================
   COSMOS REVEAL
============================================================================= */
gsap.from('.cosmos-title', {
    opacity: 0,
    scale: 0.85,
    ease: 'power2.out',
    scrollTrigger: {
        trigger: '#cosmos',
        start: 'top 50%',
        end: 'top top',
        scrub: 1,
    }
});

// Planet cards: a plain stagger (no scrub) on a trigger that fires once
// when the row enters the viewport. Mixing a time-based stagger with a
// scrubbed ScrollTrigger was the second animation bug in this file — at
// different scroll speeds, GSAP has to compress/stretch the staggered
// offsets to fit the scrubbed scroll range, which reads as cards randomly
// jumping into place instead of animating in smoothly. A toggleActions
// trigger plays the stagger once, at its own natural speed, regardless of
// how fast the user scrolls past this point.
gsap.from('.planet-card', {
    scale: 0,
    opacity: 0,
    ease: 'power2.out',
    duration: 0.6,
    stagger: 0.15,
    scrollTrigger: {
        trigger: '.planets-row',
        start: 'top 85%',
        toggleActions: 'play none none reverse',
    },
});
