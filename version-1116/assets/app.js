(function () {
    const qs = (selector, root = document) => root.querySelector(selector);
    const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function setupMobileMenu() {
        const button = qs('[data-mobile-toggle]');
        const menu = qs('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupSearchForms() {
        qsa('form[role="search"], .header-search, .big-search').forEach(function (form) {
            form.addEventListener('submit', function (event) {
                const input = qs('input[name="q"], input[type="search"]', form);
                if (!input) {
                    return;
                }
                const q = input.value.trim();
                if (!q) {
                    return;
                }
                event.preventDefault();
                window.location.href = 'search.html?q=' + encodeURIComponent(q);
            });
        });
    }

    function setupHero() {
        const hero = qs('[data-hero]');
        if (!hero) {
            return;
        }
        const slides = qsa('[data-hero-slide]', hero);
        const dots = qsa('[data-hero-dot]', hero);
        const prev = qs('[data-hero-prev]', hero);
        const next = qs('[data-hero-next]', hero);
        if (!slides.length) {
            return;
        }
        let index = 0;
        let timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () {
                show(i);
                start();
            });
        });
        if (prev) {
            prev.addEventListener('click', function () {
                show(index - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(index + 1);
                start();
            });
        }
        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function setupRows() {
        qsa('[data-scroll-left]').forEach(function (button) {
            button.addEventListener('click', function () {
                const row = document.getElementById(button.getAttribute('data-scroll-left'));
                if (row) {
                    row.scrollBy({ left: -420, behavior: 'smooth' });
                }
            });
        });
        qsa('[data-scroll-right]').forEach(function (button) {
            button.addEventListener('click', function () {
                const row = document.getElementById(button.getAttribute('data-scroll-right'));
                if (row) {
                    row.scrollBy({ left: 420, behavior: 'smooth' });
                }
            });
        });
    }

    function setupFilters() {
        const panel = qs('[data-filter-panel]');
        const list = qs('.filterable-list');
        if (!panel || !list) {
            return;
        }
        const input = qs('[data-filter-input]', panel);
        const typeSelect = qs('[data-filter-type]', panel);
        const yearSelect = qs('[data-filter-year]', panel);
        const cards = qsa('.movie-card', list);
        const params = new URLSearchParams(window.location.search);
        const initial = params.get('q') || '';
        if (input && initial) {
            input.value = initial;
        }

        function inYearRange(value, selected) {
            if (!selected) {
                return true;
            }
            const year = parseInt(value || '', 10);
            if (!Number.isFinite(year)) {
                return false;
            }
            if (selected === '2020s') {
                return year >= 2020 && year <= 2029;
            }
            if (selected === '2010s') {
                return year >= 2010 && year <= 2019;
            }
            if (selected === 'older') {
                return year < 2010;
            }
            return String(year) === selected;
        }

        function apply() {
            const query = input ? input.value.trim().toLowerCase() : '';
            const type = typeSelect ? typeSelect.value : '';
            const year = yearSelect ? yearSelect.value : '';
            cards.forEach(function (card) {
                const haystack = [
                    card.dataset.title,
                    card.dataset.year,
                    card.dataset.type,
                    card.dataset.region,
                    card.dataset.genre,
                    card.dataset.category,
                    card.textContent
                ].join(' ').toLowerCase();
                const matchesQuery = !query || haystack.includes(query);
                const matchesType = !type || haystack.includes(type.toLowerCase());
                const matchesYear = inYearRange(card.dataset.year, year);
                card.classList.toggle('is-hidden', !(matchesQuery && matchesType && matchesYear));
            });
        }

        [input, typeSelect, yearSelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', apply);
                control.addEventListener('change', apply);
            }
        });
        apply();
    }

    function setupPlayer() {
        const video = qs('#movie-player');
        const overlay = qs('#play-overlay');
        if (!video) {
            return;
        }
        const sourceNode = qs('source', video);
        const src = sourceNode ? sourceNode.getAttribute('src') : video.currentSrc || video.src;
        let ready = false;

        function load() {
            if (ready) {
                return Promise.resolve();
            }
            ready = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = src;
                return Promise.resolve();
            }
            if (window.Hls && window.Hls.isSupported()) {
                const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(src);
                hls.attachMedia(video);
                return Promise.resolve();
            }
            video.src = src;
            return Promise.resolve();
        }

        function play() {
            load().then(function () {
                const attempt = video.play();
                if (attempt && typeof attempt.catch === 'function') {
                    attempt.catch(function () {});
                }
            });
        }

        if (overlay) {
            overlay.addEventListener('click', function () {
                overlay.classList.add('is-hidden');
                play();
            });
        }
        video.addEventListener('play', function () {
            if (overlay) {
                overlay.classList.add('is-hidden');
            }
        });
        video.addEventListener('click', function () {
            if (video.paused) {
                play();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMobileMenu();
        setupSearchForms();
        setupHero();
        setupRows();
        setupFilters();
        setupPlayer();
    });
})();
