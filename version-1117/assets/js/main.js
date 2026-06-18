(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  function setupMobileMenu() {
    const button = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-mobile-menu]");

    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function setupHeroCarousel() {
    const carousel = document.querySelector("[data-hero-carousel]");

    if (!carousel) {
      return;
    }

    const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
    const dots = Array.from(carousel.querySelectorAll(".hero-dot"));
    const previous = carousel.querySelector("[data-hero-prev]");
    const next = carousel.querySelector("[data-hero-next]");
    let current = 0;
    let timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (previous) {
      previous.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);

    show(0);
    start();
  }

  function setupRails() {
    document.querySelectorAll("[data-rail]").forEach(function (wrap) {
      const rail = wrap.querySelector(".movie-rail");

      if (!rail) {
        return;
      }

      wrap.querySelectorAll("[data-direction]").forEach(function (button) {
        button.addEventListener("click", function () {
          const direction = button.getAttribute("data-direction");
          const amount = direction === "prev" ? -420 : 420;

          rail.scrollBy({
            left: amount,
            behavior: "smooth"
          });
        });
      });
    });
  }

  function fillFilterOptions(panel, cards) {
    const yearSelect = panel.querySelector("[data-filter-year]");
    const regionSelect = panel.querySelector("[data-filter-region]");
    const genreSelect = panel.querySelector("[data-filter-genre]");

    const years = new Set();
    const regions = new Set();
    const genres = new Set();

    cards.forEach(function (card) {
      if (card.dataset.year) {
        years.add(card.dataset.year);
      }

      if (card.dataset.region) {
        regions.add(card.dataset.region);
      }

      if (card.dataset.genre) {
        card.dataset.genre.split(/\s+/).forEach(function (genre) {
          if (genre) {
            genres.add(genre);
          }
        });
      }
    });

    function addOptions(select, values, sortDescending) {
      if (!select) {
        return;
      }

      const sorted = Array.from(values).sort(function (a, b) {
        if (sortDescending) {
          return String(b).localeCompare(String(a), "zh-Hans-CN", { numeric: true });
        }

        return String(a).localeCompare(String(b), "zh-Hans-CN", { numeric: true });
      });

      sorted.forEach(function (value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    addOptions(yearSelect, years, true);
    addOptions(regionSelect, regions, false);
    addOptions(genreSelect, genres, false);
  }

  function setupInlineFilters() {
    const panel = document.querySelector(".filter-panel");
    const grid = document.querySelector(".js-filter-grid");

    if (!panel || !grid) {
      return;
    }

    const cards = Array.from(grid.querySelectorAll(".movie-card"));
    const textInput = panel.querySelector("[data-filter-text]");
    const yearSelect = panel.querySelector("[data-filter-year]");
    const regionSelect = panel.querySelector("[data-filter-region]");
    const genreSelect = panel.querySelector("[data-filter-genre]");
    const count = panel.querySelector("[data-filter-count]");

    fillFilterOptions(panel, cards);

    function apply() {
      const keyword = (textInput && textInput.value || "").trim().toLowerCase();
      const year = yearSelect && yearSelect.value;
      const region = regionSelect && regionSelect.value;
      const genre = genreSelect && genreSelect.value;
      let visible = 0;

      cards.forEach(function (card) {
        const haystack = [
          card.dataset.title,
          card.dataset.region,
          card.dataset.type,
          card.dataset.genre,
          card.dataset.tags,
          card.textContent
        ].join(" ").toLowerCase();

        const matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        const matchedYear = !year || card.dataset.year === year;
        const matchedRegion = !region || card.dataset.region === region;
        const matchedGenre = !genre || (card.dataset.genre || "").split(/\s+/).indexOf(genre) !== -1;
        const matched = matchedKeyword && matchedYear && matchedRegion && matchedGenre;

        card.classList.toggle("hidden-by-filter", !matched);

        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = "显示 " + visible + " 部";
      }
    }

    [textInput, yearSelect, regionSelect, genreSelect].forEach(function (element) {
      if (element) {
        element.addEventListener("input", apply);
        element.addEventListener("change", apply);
      }
    });

    apply();
  }

  function setupPlayer() {
    document.querySelectorAll(".js-player").forEach(function (player) {
      const video = player.querySelector("video");
      const button = player.querySelector(".player-overlay");
      const status = player.querySelector(".player-status");
      const source = player.getAttribute("data-src");

      if (!video || !button || !source) {
        return;
      }

      let hlsInstance = null;
      let started = false;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function startPlayback() {
        if (started) {
          video.play();
          return;
        }

        started = true;
        setStatus("正在加载播放源...");

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });

          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);

          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {
              setStatus("请再次点击视频开始播放");
            });
          });

          hlsInstance.on(window.Hls.Events.ERROR, function (_event, data) {
            if (data && data.fatal) {
              setStatus("播放源加载失败，请刷新后重试");
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.addEventListener("loadedmetadata", function () {
            video.play().catch(function () {
              setStatus("请再次点击视频开始播放");
            });
          }, { once: true });
        } else {
          video.src = source;
          video.play().catch(function () {
            setStatus("当前浏览器需要支持 HLS 才能播放该视频");
          });
        }

        button.classList.add("is-hidden");
      }

      button.addEventListener("click", startPlayback);
      video.addEventListener("play", function () {
        button.classList.add("is-hidden");
        setStatus("");
      });

      video.addEventListener("pause", function () {
        if (!video.ended) {
          setStatus("已暂停，可点击视频继续播放");
        }
      });

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function setupSearchPage() {
    const app = document.querySelector("[data-search-app]");

    if (!app || !window.MOVIES_INDEX) {
      return;
    }

    const prefix = app.getAttribute("data-prefix") || "";
    const input = app.querySelector("[data-search-input]");
    const region = app.querySelector("[data-search-region]");
    const genre = app.querySelector("[data-search-genre]");
    const year = app.querySelector("[data-search-year]");
    const count = app.querySelector("[data-search-count]");
    const results = app.querySelector("[data-search-results]");
    const empty = app.querySelector("[data-search-empty]");
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";

    if (input) {
      input.value = query;
    }

    function imagePath(movie) {
      const root = prefix || "./";
      return root + movie.imageNo + ".jpg";
    }

    function detailPath(movie) {
      return prefix + "videos/" + movie.id + ".html";
    }

    function makeCard(movie) {
      const genres = (movie.genres || []).slice(0, 3).join(" / ");

      return [
        '<article class="movie-card">',
        '  <a class="poster-link" href="' + detailPath(movie) + '">',
        '    <img src="' + imagePath(movie) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '    <span class="poster-gradient"></span>',
        '    <span class="rating-pill">★ ' + movie.rating + '</span>',
        '    <span class="duration-pill">' + escapeHtml(movie.duration) + '</span>',
        '  </a>',
        '  <div class="movie-card-body">',
        '    <div class="meta-line">',
        '      <span>' + escapeHtml(movie.region) + '</span>',
        '      <span>' + escapeHtml(movie.year) + '</span>',
        '      <span>' + escapeHtml(movie.type) + '</span>',
        '    </div>',
        '    <h3><a href="' + detailPath(movie) + '">' + escapeHtml(movie.title) + '</a></h3>',
        '    <p class="card-desc">' + escapeHtml(movie.oneLine || "") + '</p>',
        '    <div class="tag-row"><span>' + escapeHtml(genres) + '</span></div>',
        '  </div>',
        '</article>'
      ].join("");
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function addOptions(select, values, sortDescending) {
      if (!select) {
        return;
      }

      Array.from(values).sort(function (a, b) {
        if (sortDescending) {
          return String(b).localeCompare(String(a), "zh-Hans-CN", { numeric: true });
        }

        return String(a).localeCompare(String(b), "zh-Hans-CN", { numeric: true });
      }).forEach(function (value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    const regions = new Set();
    const genres = new Set();
    const years = new Set();

    window.MOVIES_INDEX.forEach(function (movie) {
      if (movie.region) {
        regions.add(movie.region);
      }

      if (movie.year) {
        years.add(movie.year);
      }

      (movie.genres || []).forEach(function (item) {
        if (item) {
          genres.add(item);
        }
      });
    });

    addOptions(region, regions, false);
    addOptions(genre, genres, false);
    addOptions(year, years, true);

    function render() {
      const keyword = (input && input.value || "").trim().toLowerCase();
      const regionValue = region && region.value;
      const genreValue = genre && genre.value;
      const yearValue = year && year.value;

      const filtered = window.MOVIES_INDEX.filter(function (movie) {
        const haystack = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          (movie.genres || []).join(" "),
          (movie.tags || []).join(" "),
          movie.oneLine
        ].join(" ").toLowerCase();

        const matchedKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        const matchedRegion = !regionValue || movie.region === regionValue;
        const matchedGenre = !genreValue || (movie.genres || []).indexOf(genreValue) !== -1;
        const matchedYear = !yearValue || movie.year === yearValue;

        return matchedKeyword && matchedRegion && matchedGenre && matchedYear;
      });

      if (count) {
        count.textContent = "找到 " + filtered.length + " 部影片";
      }

      if (results) {
        results.innerHTML = filtered.map(makeCard).join("");
      }

      if (empty) {
        empty.style.display = filtered.length ? "none" : "grid";
      }
    }

    [input, region, genre, year].forEach(function (element) {
      if (element) {
        element.addEventListener("input", render);
        element.addEventListener("change", render);
      }
    });

    render();
  }

  ready(function () {
    setupMobileMenu();
    setupHeroCarousel();
    setupRails();
    setupInlineFilters();
    setupPlayer();
    setupSearchPage();
  });
})();
