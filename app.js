const PASSWORD = "asistent2024";
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
  }
 
  // LIGHTBOX
  let lbItems = [];
  let lbIndex = 0;
  let lbRotation = {};
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
    document.getElementById(LIGHTBOX_ID).classList.add("open");
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

  function lbShow() {
    const item = lbItems[lbIndex];
    const lbImg = document.getElementById("lb-img");
    const lbVideoWrap = document.getElementById("lb-video-wrap");
    const lbIframe = document.getElementById("lb-iframe");
    const lbRotBtn = document.getElementById("lb-rotate");
    if (item.type === "photo") {
      lbIframe.src = "";
      lbVideoWrap.style.display = "none";
      lbImg.style.display = "";
      lbRotBtn.style.display = "";
      lbImg.src = item.el.src;
      lbImg.alt = item.el.alt;
      const rot = lbRotation[item.el.src] || 0;
      const mob = window.innerWidth <= 600;
      lbImg.style.transform = "rotate(" + rot + "deg)";
      if (rot === 90 || rot === 270) { lbImg.style.maxWidth = mob ? "62vh" : "80vh"; lbImg.style.maxHeight = mob ? "96vw" : "92vw"; }
      else { lbImg.style.maxWidth = mob ? "100vw" : "92vw"; lbImg.style.maxHeight = mob ? "62vh" : "80vh"; }
      document.getElementById("lb-caption").textContent = item.el.alt;
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
    lbShow();
  }

  function lbClose() {
    document.getElementById(LIGHTBOX_ID).classList.remove("open");
    document.getElementById("lb-iframe").src = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", e => {
    if (!document.getElementById(LIGHTBOX_ID).classList.contains("open")) return;
    if (e.key === "ArrowRight") lbNav(1);
    else if (e.key === "ArrowLeft") lbNav(-1);
    else if (e.key === "Escape") lbClose();
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

  function initUiBindings() {
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUiBindings);
  } else {
    initUiBindings();
  }
