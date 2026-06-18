(function () {
  function pick(selector, root) {
    return (root || document).querySelector(selector);
  }

  function pickAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function bindMobileMenu() {
    var button = pick("[data-mobile-toggle]");
    var menu = pick("[data-mobile-menu]");
    if (!button || !menu) return;
    button.addEventListener("click", function () {
      menu.classList.toggle("open");
      button.setAttribute("aria-expanded", menu.classList.contains("open") ? "true" : "false");
    });
  }

  function bindHero() {
    var hero = pick("[data-hero]");
    if (!hero) return;
    var panels = pickAll("[data-hero-panel]", hero);
    var bgs = pickAll("[data-hero-bg]", hero);
    var dots = pickAll("[data-hero-dot]", hero);
    var cards = pickAll("[data-hero-jump]", hero);
    var current = 0;
    var timer = null;

    function setSlide(index) {
      if (!panels.length) return;
      current = (index + panels.length) % panels.length;
      panels.forEach(function (item, i) {
        item.classList.toggle("active", i === current);
      });
      bgs.forEach(function (item, i) {
        item.classList.toggle("active", i === current);
      });
      dots.forEach(function (item, i) {
        item.classList.toggle("active", i === current);
        item.setAttribute("aria-current", i === current ? "true" : "false");
      });
      cards.forEach(function (item, i) {
        item.classList.toggle("active", i === current);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        setSlide(current + 1);
      }, 5200);
    }

    var prev = pick("[data-hero-prev]", hero);
    var next = pick("[data-hero-next]", hero);
    if (prev) {
      prev.addEventListener("click", function () {
        setSlide(current - 1);
        play();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        setSlide(current + 1);
        play();
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        setSlide(index);
        play();
      });
    });
    cards.forEach(function (card, index) {
      card.addEventListener("click", function () {
        setSlide(index);
        play();
      });
    });
    setSlide(0);
    play();
  }

  function bindScrollers() {
    pickAll("[data-scroll-wrap]").forEach(function (wrap) {
      var list = pick("[data-scroll-list]", wrap);
      if (!list) return;
      var prev = pick("[data-scroll-prev]", wrap);
      var next = pick("[data-scroll-next]", wrap);
      function move(dir) {
        list.scrollBy({ left: dir * Math.min(480, list.clientWidth * 0.86), behavior: "smooth" });
      }
      if (prev) prev.addEventListener("click", function () { move(-1); });
      if (next) next.addEventListener("click", function () { move(1); });
    });
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function bindFilters() {
    var list = pick("[data-filter-list]");
    if (!list) return;
    var textInput = pick("[data-filter-text]");
    var regionSelect = pick("[data-filter-region]");
    var typeSelect = pick("[data-filter-type]");
    var yearSelect = pick("[data-filter-year]");
    var cards = pickAll("[data-card]", list);
    var empty = pick("[data-empty-note]");
    var params = new URLSearchParams(window.location.search);
    var q = params.get("q");
    if (textInput && q) textInput.value = q;

    function currentValue(el) {
      return el ? normalize(el.value) : "";
    }

    function apply() {
      var text = currentValue(textInput);
      var region = currentValue(regionSelect);
      var type = currentValue(typeSelect);
      var year = currentValue(yearSelect);
      var shown = 0;
      cards.forEach(function (card) {
        var haystack = normalize(card.textContent + " " + (card.getAttribute("data-tags") || ""));
        var okText = !text || haystack.indexOf(text) !== -1;
        var okRegion = !region || normalize(card.getAttribute("data-region")) === region;
        var okType = !type || normalize(card.getAttribute("data-type")) === type;
        var okYear = !year || normalize(card.getAttribute("data-year")) === year;
        var ok = okText && okRegion && okType && okYear;
        card.classList.toggle("hidden-card", !ok);
        if (ok) shown += 1;
      });
      if (empty) empty.style.display = shown ? "none" : "block";
    }

    [textInput, regionSelect, typeSelect, yearSelect].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });
    apply();
  }

  function bindSearchForms() {
    pickAll("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = pick("input[name='q']", form);
        if (!input || !input.value.trim()) {
          event.preventDefault();
          if (input) input.focus();
        }
      });
    });
  }

  function startPlayer(videoId, layerId, streamUrl) {
    var video = document.getElementById(videoId);
    var layer = document.getElementById(layerId);
    if (!video || !layer || !streamUrl) return;
    var ready = false;
    var hls = null;

    function start() {
      if (!ready) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
          ready = true;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
          ready = true;
        } else {
          video.src = streamUrl;
          ready = true;
        }
      }
      layer.classList.add("hidden");
      video.controls = true;
      video.play().catch(function () {
        layer.classList.remove("hidden");
      });
    }

    layer.addEventListener("click", start);
    video.addEventListener("click", function () {
      if (!ready) start();
    });
    video.addEventListener("play", function () {
      layer.classList.add("hidden");
    });
    video.addEventListener("error", function () {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindMobileMenu();
    bindHero();
    bindScrollers();
    bindFilters();
    bindSearchForms();
  });

  window.startPlayer = startPlayer;
})();
