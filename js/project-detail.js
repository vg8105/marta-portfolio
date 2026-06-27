/* =============================================================================
   PROJECT DETAIL PAGES — scroll reveal + carousel
   Shared by all 6 case-study pages.
============================================================================= */

/* ---------------------------------------------------------------------------
   SCROLL REVEAL
   Every element with .reveal fades/lifts into place once it's actually in
   view, instead of all at once on load — this is the "smoother, more
   harmonious" transition pass: sections arrive one at a time as the person
   scrolls, rather than the page just being static.
   IntersectionObserver (not scroll listeners) so this costs nothing on
   long pages and never fights the browser's own scroll handling — the kind
   of thing that caused the earlier scroll-animation bugs on the home page.
--------------------------------------------------------------------------- */
(function setupScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
        targets.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
    });

    targets.forEach(el => observer.observe(el));
})();


/* ---------------------------------------------------------------------------
   IMAGE CAROUSEL
   Used for "process" slideshows (Prisma's debate states, Bougainvilleas'
   five render stages, 5 Styles' five variants). Dot navigation only —
   these are short, deliberate sequences the person clicks through, not
   continuous auto-playing sliders.
--------------------------------------------------------------------------- */
(function setupCarousels() {
    document.querySelectorAll('[data-carousel]').forEach(carousel => {
        const slides = Array.from(carousel.querySelectorAll('.project-carousel-slide'));
        const dots = Array.from(carousel.querySelectorAll('.project-carousel-dot'));
        if (!slides.length || !dots.length) return;

        function goTo(index) {
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
                dot.setAttribute('aria-current', i === index ? 'true' : 'false');
            });
        }

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => goTo(i));
        });

        goTo(0);
    });
})();
