(function () {
    var navToggle = document.querySelector('[data-nav-toggle]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-search-scope]').forEach(function (scope) {
        var inputs = scope.querySelectorAll('[data-search-input]');
        var grid = scope.querySelector('[data-card-grid]') || scope;
        var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
        var sortSelect = scope.querySelector('[data-sort-select]');

        function applySearch() {
            var query = Array.prototype.map.call(inputs, function (input) {
                return input.value.trim().toLowerCase();
            }).join(' ').trim();

            cards.forEach(function (card) {
                var text = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
                var match = !query || text.indexOf(query) !== -1;
                card.classList.toggle('is-hidden', !match);
            });
        }

        function applySort() {
            if (!sortSelect || !grid) {
                return;
            }
            var value = sortSelect.value;
            var sorted = cards.slice().sort(function (a, b) {
                if (value === 'title') {
                    return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '', 'zh-Hans-CN');
                }
                if (value === 'year') {
                    return Number(b.getAttribute('data-year') || 0) - Number(a.getAttribute('data-year') || 0);
                }
                return Number(b.getAttribute('data-hot') || 0) - Number(a.getAttribute('data-hot') || 0);
            });
            sorted.forEach(function (card) {
                grid.appendChild(card);
            });
        }

        inputs.forEach(function (input) {
            input.addEventListener('input', applySearch);
        });

        if (sortSelect) {
            sortSelect.addEventListener('change', applySort);
            applySort();
        }
    });

    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
        return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dots] button'));
    var index = 0;

    function show(next) {
        if (!slides.length) {
            return;
        }
        index = (next + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
            slide.classList.toggle('is-active', i === index);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle('is-active', i === index);
        });
    }

    dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
            show(i);
        });
    });

    if (slides.length > 1) {
        window.setInterval(function () {
            show(index + 1);
        }, 5200);
    }
})();
