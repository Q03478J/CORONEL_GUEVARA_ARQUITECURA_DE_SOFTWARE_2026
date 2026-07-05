/* =====================================================
   LANDING.JS — CORONEL_GUEVARA_2026
   Lenis + GSAP/ScrollTrigger/SplitText, cursor, nav,
   acordeón FAQ, contadores y scroll storytelling.
   Todo lo decorativo se degrada con seguridad si:
   - el usuario prefiere movimiento reducido
   - un CDN falla en cargar
   ===================================================== */
(function () {
    'use strict';

    var REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lenis = null;

    /* =====================================================
       THEME MANAGER (persistencia de tema claro/oscuro)
       ===================================================== */
    function ThemeManager() {
        this.theme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);
        var btn = document.getElementById('themeToggle');
        var self = this;
        if (btn) {
            btn.addEventListener('click', function () {
                self.theme = self.theme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', self.theme);
                localStorage.setItem('theme', self.theme);
            });
        }
    }

    /* =====================================================
       MOBILE NAV
       ===================================================== */
    function MobileNav() {
        var toggle = document.getElementById('mobileToggle');
        var menu = document.getElementById('navMenu');
        if (!toggle || !menu) return;
        toggle.addEventListener('click', function () {
            menu.classList.toggle('active');
            toggle.classList.toggle('active');
        });
        menu.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                menu.classList.remove('active');
                toggle.classList.remove('active');
            });
        });
    }

    /* =====================================================
       FAQ ACCORDION
       ===================================================== */
    function initFaq() {
        var items = document.querySelectorAll('.faq-item');
        items.forEach(function (item) {
            var btn = item.querySelector('.faq-question');
            if (!btn) return;
            btn.addEventListener('click', function () {
                var willOpen = !item.classList.contains('is-open');
                items.forEach(function (i) {
                    i.classList.remove('is-open');
                    var b = i.querySelector('.faq-question');
                    if (b) b.setAttribute('aria-expanded', 'false');
                });
                if (willOpen) {
                    item.classList.add('is-open');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    /* =====================================================
       CONTADORES — siempre corrige el valor final, con o sin GSAP
       ===================================================== */
    function initCounters() {
        var counters = document.querySelectorAll('[data-counter]');
        counters.forEach(function (el) {
            var target = parseFloat(el.getAttribute('data-counter'));
            var suffix = el.getAttribute('data-suffix') || '';
            if (REDUCE_MOTION || !window.gsap) {
                el.textContent = target + suffix;
                return;
            }
            var obj = { val: 0 };
            var tweenVars = {
                val: target,
                duration: 1.7,
                ease: 'power2.out',
                onUpdate: function () { el.textContent = Math.round(obj.val) + suffix; }
            };
            if (window.ScrollTrigger) {
                tweenVars.scrollTrigger = { trigger: el, start: 'top 92%', once: true };
            }
            gsap.to(obj, tweenVars);
        });
    }

    /* =====================================================
       PRELOADER — independiente de GSAP, siempre termina
       ===================================================== */
    function runPreloader(done) {
        var preloader = document.querySelector('.preloader');
        if (!preloader) { done(); return; }

        if (REDUCE_MOTION) {
            preloader.classList.add('is-hidden');
            document.body.classList.remove('preload-lock');
            done();
            return;
        }

        var countEl = preloader.querySelector('.preloader-count-value');
        var barEl = preloader.querySelector('.preloader-bar i');
        var start = null;
        var MIN_MS = 1000;

        function tick(now) {
            if (start === null) start = now;
            var progress = Math.min(1, (now - start) / MIN_MS);
            var n = Math.round(progress * 100);
            if (countEl) countEl.textContent = n;
            if (barEl) barEl.style.width = n + '%';
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                setTimeout(function () {
                    preloader.classList.add('is-hidden');
                    document.body.classList.remove('preload-lock');
                    done();
                }, 200);
            }
        }
        requestAnimationFrame(tick);
    }

    /* =====================================================
       CURSOR PERSONALIZADO
       ===================================================== */
    function initCursor() {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        var dot = document.createElement('div');
        dot.className = 'cursor-dot';
        var ring = document.createElement('div');
        ring.className = 'cursor-ring';
        document.body.appendChild(dot);
        document.body.appendChild(ring);

        gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

        var dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
        var dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
        var ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
        var ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });

        window.addEventListener('mousemove', function (e) {
            dotX(e.clientX); dotY(e.clientY);
            ringX(e.clientX); ringY(e.clientY);
        });

        document.querySelectorAll('a, button, .magnetic').forEach(function (el) {
            el.addEventListener('mouseenter', function () { ring.classList.add('is-active'); });
            el.addEventListener('mouseleave', function () { ring.classList.remove('is-active'); });
        });
    }

    /* =====================================================
       BOTONES MAGNÉTICOS
       ===================================================== */
    function initMagnetic() {
        document.querySelectorAll('.magnetic').forEach(function (el) {
            var strength = 0.4;
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect();
                var relX = e.clientX - (r.left + r.width / 2);
                var relY = e.clientY - (r.top + r.height / 2);
                gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.4, ease: 'power3.out' });
            });
            el.addEventListener('mouseleave', function () {
                gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
            });
        });
    }

    /* =====================================================
       NAVBAR — encoge al hacer scroll
       ===================================================== */
    function initNavbarScroll() {
        var navbar = document.getElementById('navbar');
        if (!navbar) return;
        function onScroll() {
            navbar.classList.toggle('is-scrolled', window.scrollY > 60);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* =====================================================
       SCROLL SUAVE EN ENLACES INTERNOS (vía Lenis)
       ===================================================== */
    function initAnchorScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            var href = a.getAttribute('href');
            if (!href || href.length < 2) return;
            var target = document.querySelector(href);
            if (!target) return;
            a.addEventListener('click', function (e) {
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(target, { offset: -80 });
                } else {
                    target.scrollIntoView({ behavior: REDUCE_MOTION ? 'auto' : 'smooth', block: 'start' });
                }
            });
        });
    }

    /* =====================================================
       MARQUEE
       ===================================================== */
    function initMarquee() {
        document.querySelectorAll('.marquee-track').forEach(function (track) {
            var half = track.scrollWidth / 2;
            if (!half) return;
            gsap.to(track, { x: -half, duration: half / 55, ease: 'none', repeat: -1 });
        });
    }

    /* =====================================================
       INTRO DEL HERO (SplitText + timeline)
       ===================================================== */
    function initHeroIntro() {
        var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from('.hero-eyebrow', { y: 18, opacity: 0, duration: 0.6 });

        var lines = document.querySelectorAll('.hero-display [data-split]');
        lines.forEach(function (el, i) {
            if (window.SplitText) {
                var split = new SplitText(el, { type: 'chars' });
                tl.from(split.chars, {
                    yPercent: 110, opacity: 0, duration: 0.85, stagger: 0.016, ease: 'power4.out'
                }, i === 0 ? '-=0.25' : '-=0.6');
            } else {
                tl.from(el, { y: 40, opacity: 0, duration: 0.7 }, '-=0.3');
            }
        });

        tl.from('.hero-lede', { y: 22, opacity: 0, duration: 0.7 }, '-=0.35')
          .from('.hero-actions .btn', { y: 18, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.4')
          .from('.hero-meta-chip', { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.35')
          .from('.hero-scroll-cue', { opacity: 0, duration: 0.5 }, '-=0.2');
    }

    /* =====================================================
       REVEALS GENÉRICOS AL HACER SCROLL
       ===================================================== */
    function initReveals() {
        var groups = {};
        document.querySelectorAll('[data-reveal]').forEach(function (el) {
            var key = el.getAttribute('data-reveal-group');
            if (key) {
                (groups[key] = groups[key] || []).push(el);
            } else {
                gsap.from(el, {
                    y: 34, opacity: 0, duration: 0.9, ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 88%' }
                });
            }
        });
        Object.keys(groups).forEach(function (key) {
            gsap.from(groups[key], {
                y: 34, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.12,
                scrollTrigger: { trigger: groups[key][0], start: 'top 88%' }
            });
        });
    }

    /* =====================================================
       INICIALIZACIÓN
       ===================================================== */
    function initMotion() {
        if (!window.gsap) return; // el contenido ya es visible por defecto (CSS)

        gsap.registerPlugin(window.ScrollTrigger, window.SplitText);

        if (!REDUCE_MOTION && window.Lenis) {
            lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
            gsap.ticker.lagSmoothing(0);
        }

        if (!REDUCE_MOTION) {
            initCursor();
            initMagnetic();
            initMarquee();
            initHeroIntro();
        }

        initNavbarScroll();
        initAnchorScroll();
        initReveals();

        ScrollTrigger.refresh();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
        }
        window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.body.classList.add('preload-lock');
        new ThemeManager();
        new MobileNav();
        initFaq();
        initCounters();
        runPreloader(initMotion);
    });
})();
