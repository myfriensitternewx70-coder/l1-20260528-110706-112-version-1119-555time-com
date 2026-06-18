(function() {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function() {
    var menuToggle = document.querySelector('.menu-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    if (menuToggle && mobileNav) {
      menuToggle.addEventListener('click', function() {
        mobileNav.classList.toggle('is-open');
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var current = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function(slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        var target = parseInt(dot.getAttribute('data-target'), 10) || 0;
        showSlide(target);
      });
    });

    if (slides.length > 1) {
      setInterval(function() {
        showSlide(current + 1);
      }, 5200);
    }

    var searchInputs = Array.prototype.slice.call(document.querySelectorAll('.movie-search'));
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var activeFilter = '';

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function applyFilter() {
      var query = normalize(searchInputs.map(function(input) {
        return input.value;
      }).join(' '));
      var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
      cards.forEach(function(card) {
        var haystack = normalize([
          card.getAttribute('data-title'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.textContent
        ].join(' '));
        var matchedQuery = !query || haystack.indexOf(query) !== -1;
        var matchedFilter = !activeFilter || haystack.indexOf(normalize(activeFilter)) !== -1;
        card.style.display = matchedQuery && matchedFilter ? '' : 'none';
      });
    }

    searchInputs.forEach(function(input) {
      input.addEventListener('input', applyFilter);
    });

    filterButtons.forEach(function(button) {
      button.addEventListener('click', function() {
        activeFilter = button.getAttribute('data-filter') || '';
        filterButtons.forEach(function(item) {
          item.classList.toggle('is-active', item === button);
        });
        applyFilter();
      });
    });
  });
})();

function initDetailPlayer(source) {
  var shell = document.querySelector('.movie-player');
  if (!shell) {
    return;
  }
  var video = shell.querySelector('video');
  var button = shell.querySelector('.play-cover');
  var started = false;
  var hlsInstance = null;

  function playVideo() {
    var promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function() {});
    }
  }

  function start() {
    if (!started) {
      started = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, playVideo);
      } else {
        video.src = source;
        video.addEventListener('loadedmetadata', playVideo, { once: true });
      }
    } else {
      playVideo();
    }
    shell.classList.add('is-playing');
  }

  if (button) {
    button.addEventListener('click', start);
  }

  video.addEventListener('click', function() {
    if (video.paused) {
      start();
    }
  });

  window.addEventListener('pagehide', function() {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  });
}
