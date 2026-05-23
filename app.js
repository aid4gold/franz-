const PASSWORD = "2024";
  const LIGHTBOX_ID = "lightbox";
  const ACTIVE_SECTION_SELECTOR = ".section-block.active";

  function tryLogin() {
    if (document.getElementById("pw-input").value === PASSWORD) {
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("app").style.display = "block";
    } else {
      document.getElementById("login-error").style.display = "block";
    }
  }

  function logout() {
    document.getElementById("app").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("pw-input").value = "";
    document.getElementById("login-error").style.display = "none";
  }
  function showSection(id, btn) {
    document.querySelectorAll(".section-block").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("sec-" + id).classList.add("active");
    btn.classList.add("active");
    btn.scrollIntoView({ block:"nearest", inline:"center", behavior:"smooth" });
    window.scrollTo({ top:0, behavior:"smooth" });
    document.querySelectorAll(".room-drawer-item[data-section]").forEach(b => {
      b.classList.toggle("active", b.dataset.section === id);
    });
  }
 
  // LIGHTBOX
  let lbItems = [];
  let lbIndex = 0;
  const ROTATION_KEY = "franz_lb_rot";
  let lbRotation = (() => { try { return JSON.parse(localStorage.getItem(ROTATION_KEY) || "{}"); } catch(e) { return {}; } })();
  let lbSuppressHistoryPush = false;

  function isLightboxOpen() {
    return document.getElementById(LIGHTBOX_ID).classList.contains("open");
  }

  function pushLightboxState() {
    if (lbSuppressHistoryPush) return;
    if (!isLightboxOpen()) return;
    const item = lbItems[lbIndex];
    const mediaType = item?.type || "photo";
    history.pushState({ lb: true, i: lbIndex, t: mediaType }, "");
  }

  function buildLightboxItems(type) {
    const activeSection = document.querySelector(ACTIVE_SECTION_SELECTOR);
    if (!activeSection) return [];
    if (type === "photo") {
      return Array.from(activeSection.querySelectorAll(".media-card img")).map(el => ({ type: "photo", el }));
    }
    return Array.from(activeSection.querySelectorAll(".video-preview")).map(el => ({
      type: "video",
      id: el.dataset.videoid,
      name: el.closest(".media-card").querySelector(".media-card-name").textContent
    }));
  }

  function lbOpen(type, targetEl) {
    const activeSection = document.querySelector(ACTIVE_SECTION_SELECTOR);
    if (!activeSection) return;
    lbItems = buildLightboxItems(type);
    const targetItems = type === "photo"
      ? Array.from(activeSection.querySelectorAll(".media-card img"))
      : Array.from(activeSection.querySelectorAll(".video-preview"));
    lbIndex = targetItems.indexOf(targetEl);
    if (lbItems.length === 0) return;
    if (lbIndex === -1) lbIndex = 0;
    lbShow();
    const lbEl = document.getElementById(LIGHTBOX_ID);
    lbEl.classList.add("open");
    lbEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    pushLightboxState();
  }

  function openCardMedia(card) {
    const thumb = card.querySelector(".video-preview");
    if (thumb) {
      lbOpen("video", thumb);
      return;
    }
    const img = card.querySelector("img");
    if (img) lbOpen("photo", img);
  }

  function lbPrefetch() {
    const n = lbItems.length;
    [1, -1].forEach(d => {
      const adj = lbItems[(lbIndex + d + n) % n];
      if (adj?.type === "photo") new Image().src = adj.el.src;
    });
  }

  function lbShow() {
    const item = lbItems[lbIndex];
    const lbImg = document.getElementById("lb-img");
    const lbImgWrap = document.getElementById("lb-img-wrap");
    const lbVideoWrap = document.getElementById("lb-video-wrap");
    const lbIframe = document.getElementById("lb-iframe");
    const lbRotBtn = document.getElementById("lb-rotate");
    if (item.type === "photo") {
      lbIframe.src = "";
      lbVideoWrap.style.display = "none";
      lbImg.style.display = "";
      lbRotBtn.style.display = "";
      lbImg.alt = item.el.alt;
      const baseRot = parseInt(item.el.dataset.lbRotate || "0", 10) || 0;
      const userRot = lbRotation[item.el.src] || 0;
      const rot = ((baseRot + userRot) % 360 + 360) % 360;
      const mob = window.innerWidth <= 600;
      lbImg.style.transform = "rotate(" + rot + "deg)";
      if (rot === 90 || rot === 270) { lbImg.style.maxWidth = mob ? "62vh" : "80vh"; lbImg.style.maxHeight = mob ? "96vw" : "92vw"; }
      else { lbImg.style.maxWidth = mob ? "100vw" : "92vw"; lbImg.style.maxHeight = mob ? "62vh" : "80vh"; }
      lbImgWrap.classList.add("loading");
      lbImg.onload = lbImg.onerror = () => lbImgWrap.classList.remove("loading");
      lbImg.src = item.el.src;
      if (lbImg.complete) lbImgWrap.classList.remove("loading");
      document.getElementById("lb-caption").textContent = item.el.alt;
      lbPrefetch();
    } else {
      lbImg.style.display = "none";
      lbRotBtn.style.display = "none";
      lbVideoWrap.style.display = "block";
      lbIframe.src = "https://www.youtube.com/embed/" + item.id + "?rel=0";
      document.getElementById("lb-caption").textContent = item.name;
    }
    document.getElementById("lb-counter").textContent = (lbIndex + 1) + " / " + lbItems.length;
  }

  function lbNav(dir) {
    if (lbItems[lbIndex].type === "video") document.getElementById("lb-iframe").src = "";
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    lbShow();
    pushLightboxState();
  }

  function lbRotate() {
    const item = lbItems[lbIndex];
    if (item.type !== "photo") return;
    const src = item.el.src;
    lbRotation[src] = ((lbRotation[src] || 0) + 90) % 360;
    try { localStorage.setItem(ROTATION_KEY, JSON.stringify(lbRotation)); } catch(e) {}
    lbShow();
  }

  function lbClose() {
    const lbEl = document.getElementById(LIGHTBOX_ID);
    lbEl.classList.remove("open");
    lbEl.setAttribute("aria-hidden", "true");
    document.getElementById("lb-iframe").src = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (isLightboxOpen()) lbClose();
      else if (document.getElementById("room-drawer")?.classList.contains("open")) drawerClose();
      return;
    }
    if (!isLightboxOpen()) return;
    if (e.key === "ArrowRight") lbNav(1);
    else if (e.key === "ArrowLeft") lbNav(-1);
    else if (e.key === "r" || e.key === "R") lbRotate();
  });

  window.addEventListener("popstate", e => {
    if (!isLightboxOpen()) return;
    const state = e.state;
    if (state && state.lb) {
      lbSuppressHistoryPush = true;
      if (typeof state.i === "number" && state.i >= 0 && state.i < lbItems.length) {
        lbIndex = state.i;
      }
      lbShow();
      lbSuppressHistoryPush = false;
      return;
    }
    if (lbItems.length > 1 && lbIndex > 0) {
      lbSuppressHistoryPush = true;
      lbNav(-1);
      lbSuppressHistoryPush = false;
      pushLightboxState();
      return;
    }
    lbClose();
  });

  function drawerOpen() {
    document.getElementById("room-overlay").classList.add("open");
    document.getElementById("room-drawer").classList.add("open");
    document.getElementById("room-drawer").setAttribute("aria-hidden", "false");
    document.getElementById("menu-toggle").classList.add("open");
    document.getElementById("menu-toggle").setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function drawerClose() {
    document.getElementById("room-overlay").classList.remove("open");
    document.getElementById("room-drawer").classList.remove("open");
    document.getElementById("room-drawer").setAttribute("aria-hidden", "true");
    document.getElementById("menu-toggle").classList.remove("open");
    document.getElementById("menu-toggle").setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function initUiBindings() {
    // Enable :active pseudo-class on iOS Safari for non-anchor elements
    document.body.addEventListener("touchstart", () => {}, {passive:true});

    // Swipe gesture for lightbox
    let lbTouchX = 0, lbTouchY = 0;
    const lbRoot = document.getElementById(LIGHTBOX_ID);
    if (lbRoot) {
      lbRoot.addEventListener("touchstart", e => {
        lbTouchX = e.touches[0].clientX;
        lbTouchY = e.touches[0].clientY;
      }, { passive:true });
      lbRoot.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - lbTouchX;
        const dy = e.changedTouches[0].clientY - lbTouchY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) lbNav(dx < 0 ? 1 : -1);
      }, { passive:true });
    }

    // Event delegation - works even on hidden sections
    document.addEventListener("click", e => {
      const lb = document.getElementById(LIGHTBOX_ID);
      if (lb && lb.classList.contains("open") && e.target === lb) { lbClose(); return; }
      if (e.target.closest("#lightbox")) return;
      const card = e.target.closest(".media-card");
      if (!card) return;
      openCardMedia(card);
    });

    // Shared UI bindings (no inline handlers)
    document.getElementById("login-btn")?.addEventListener("click", tryLogin);
    document.getElementById("logout-btn")?.addEventListener("click", logout);
    document.getElementById("pw-input")?.addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
    document.getElementById("lb-close")?.addEventListener("click", lbClose);
    document.getElementById("lb-rotate")?.addEventListener("click", lbRotate);
    document.getElementById("lb-prev")?.addEventListener("click", () => lbNav(-1));
    document.getElementById("lb-next")?.addEventListener("click", () => lbNav(1));
    document.querySelectorAll(".nav-btn[data-section]").forEach(btn => {
      btn.addEventListener("click", () => showSection(btn.dataset.section, btn));
    });

    // Accessibility for media cards
    document.querySelectorAll(".media-card").forEach((card, idx) => {
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      const label = card.querySelector(".media-card-name")?.textContent?.trim() || `Média ${idx + 1}`;
      card.setAttribute("aria-label", `Otevřít: ${label}`);
    });
    document.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".media-card");
      if (!card) return;
      e.preventDefault();
      openCardMedia(card);
    });

    // Set alt text on video thumbnails dynamically from card name
    document.querySelectorAll(".video-preview .media-img").forEach(img => {
      if (!img.alt) {
        const name = img.closest(".media-card")?.querySelector(".media-card-name")?.textContent?.trim();
        if (name) img.alt = name;
      }
    });

    // Hamburger menu / bottom drawer
    document.getElementById("menu-toggle")?.addEventListener("click", () => {
      document.getElementById("room-drawer").classList.contains("open") ? drawerClose() : drawerOpen();
    });
    document.getElementById("room-overlay")?.addEventListener("click", drawerClose);
    document.querySelectorAll(".room-drawer-item[data-section]").forEach(btn => {
      btn.addEventListener("click", () => {
        const navBtn = document.querySelector(`.nav-btn[data-section="${btn.dataset.section}"]`);
        if (navBtn) showSection(btn.dataset.section, navBtn);
        drawerClose();
      });
    });
    // Swipe down to close drawer
    const drawerEl = document.getElementById("room-drawer");
    if (drawerEl) {
      let drawerTouchStartY = 0;
      drawerEl.addEventListener("touchstart", e => { drawerTouchStartY = e.touches[0].clientY; }, {passive:true});
      drawerEl.addEventListener("touchend", e => {
        if (e.changedTouches[0].clientY - drawerTouchStartY > 72) drawerClose();
      }, {passive:true});
    }

    // Centralized image error fallback for all cards
    document.addEventListener("error", e => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      const thumb = img.closest(".media-thumb");
      if (!thumb) return;
      img.style.display = "none";
      const fallback = thumb.querySelector(".media-thumb-inner");
      if (fallback) fallback.style.display = "flex";
    }, true);

    // Add a contextual shortcut to the daily care manual in all room sections
    document.querySelectorAll(".section-block").forEach(section => {
      if (section.id === "sec-manual") return;
      const title = section.querySelector(".section-title");
      if (!title || section.querySelector(".manual-shortcut")) return;
      const box = document.createElement("div");
      box.className = "info-box manual-shortcut";
      box.innerHTML = '<strong>Denní režim:</strong> Podrobný časový plán péče najdete v sekci <a href="#" class="manual-shortcut-link">📘 Manuál péče</a>.';
      title.insertAdjacentElement("afterend", box);
    });

    document.addEventListener("click", e => {
      const link = e.target.closest(".manual-shortcut-link");
      if (!link) return;
      e.preventDefault();
      const navBtn = document.querySelector('.nav-btn[data-section="manual"]');
      if (navBtn) showSection("manual", navBtn);
      setTimeout(() => document.getElementById("denni-rezim")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUiBindings);
  } else {
    initUiBindings();
  }

  // Hero photo: visible on load, disappears on first tap/click (mobile only)
  (function () {
    var photo = document.querySelector('.hero-photo');
    if (!photo) return;
    function dismiss() {
      if (window.innerWidth >= 640) return;
      photo.classList.add('hero-photo--hidden');
      photo.addEventListener('transitionend', function () { photo.style.display = 'none'; }, { once: true });
      document.removeEventListener('click', dismiss, true);
      document.removeEventListener('touchstart', dismiss, true);
    }
    setTimeout(function () {
      document.addEventListener('click', dismiss, true);
      document.addEventListener('touchstart', dismiss, { capture: true, passive: true });
    }, 800);
  }());

