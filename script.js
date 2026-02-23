// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close nav when clicking a link (mobile)
  siteNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Publications: filter + search
const pubSearch = document.querySelector("#pubSearch");
const pubList = document.querySelector("#pubList");
const pubCount = document.querySelector("#pubCount");
const chips = document.querySelectorAll(".chip");

let activeFilter = "all";

function updatePubCount(visible) {
  if (!pubCount) return;
  pubCount.textContent = `${visible} publication${visible === 1 ? "" : "s"} shown`;
}

function applyPubFilters() {
  if (!pubList) return;

  const query = (pubSearch?.value || "").trim().toLowerCase();
  let visible = 0;

  pubList.querySelectorAll(".pub").forEach((item) => {
    const type = item.getAttribute("data-type");
    const text = item.textContent.toLowerCase();

    const matchType = activeFilter === "all" || type === activeFilter;
    const matchQuery = !query || text.includes(query);

    const show = matchType && matchQuery;
    item.style.display = show ? "" : "none";
    if (show) visible += 1;
  });

  updatePubCount(visible);
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    activeFilter = chip.dataset.filter || "all";
    applyPubFilters();
  });
});

pubSearch?.addEventListener("input", applyPubFilters);

// Contact form (UI-only demo)
const contactForm = document.querySelector("#contactForm");
const formNote = document.querySelector("#formNote");

contactForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (formNote) {
    formNote.textContent =
      "Demo only: wire this to Formspree / Netlify Forms / your backend to actually send messages.";
  }
  contactForm.reset();
});

// Footer year
const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

// Init
applyPubFilters();


// === Side background panels (scroll-driven) ===
(function initSideScrollBackgrounds(){
  // On mobile we hide the side panels via CSS; skip all JS work as well so
  // the background images aren't loaded and no scroll listeners are attached.
  // Keep this breakpoint aligned with the CSS rule that collapses `.cards.two`
  // to a single column (max-width: 860px).
  if (window.matchMedia && window.matchMedia("(max-width: 860px)").matches) return;

  const leftA = document.querySelector(".side--left .bg-a");
  const leftB = document.querySelector(".side--left .bg-b");
  const rightA = document.querySelector(".side--right .bg-a");
  const rightB = document.querySelector(".side--right .bg-b");
  if (!leftA || !leftB || !rightA || !rightB) return;

  // Two scenes = your "two on the left / two on the right" setup.
  // Add more entries to add more scenes.
  const scenes = [
    { left: "assets/background.jpg", right: "assets/background1.jpg" },
    { left: "assets/background2.jpg", right: "assets/background3.jpg" },
  ];

  // Elements that define where transitions happen.
  // Tip: place/move data-scene triggers lower to delay the change.
  const triggers = Array.from(document.querySelectorAll("[data-scene]"))
    .sort((a, b) => Number(a.dataset.scene) - Number(b.dataset.scene));

  if (triggers.length === 0) return;

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const wrapScene = (n) => ((n % scenes.length) + scenes.length) % scenes.length;

  const supportsMask =
    (window.CSS && CSS.supports && (CSS.supports("mask-image", "linear-gradient(#000, transparent)") ||
                                   CSS.supports("-webkit-mask-image", "linear-gradient(#000, transparent)")));

  function setScene(layerLeft, layerRight, sceneIndex){
    const s = scenes[wrapScene(sceneIndex)];
    layerLeft.style.backgroundImage = `url("${s.left}")`;
    layerRight.style.backgroundImage = `url("${s.right}")`;
  }

  // Initialize with first trigger's scene (or 0)
  const firstScene = wrapScene(Number(triggers[0].dataset.scene || 0));
  setScene(leftA, rightA, firstScene);
  setScene(leftB, rightB, firstScene);

  // Layer ordering: bg-a is base, bg-b is revealed on top.
  leftA.style.opacity = "1";
  rightA.style.opacity = "1";
  leftB.style.opacity = "1";
  rightB.style.opacity = "1";
  leftB.style.setProperty("--wipe", "0%");
  rightB.style.setProperty("--wipe", "0%");

  let currentA = null;
  let currentB = null;

  function update(){
    const y = window.scrollY || window.pageYOffset;

    // Find current interval between triggers[i] and triggers[i+1]
    let i = 0;
    for (; i < triggers.length - 1; i++){
      if (y < triggers[i + 1].offsetTop) break;
    }

    const elA = triggers[i];
    const elB = triggers[Math.min(i + 1, triggers.length - 1)];

    const sceneA = wrapScene(Number(elA.dataset.scene || 0));
    const sceneB = wrapScene(Number(elB.dataset.scene || sceneA));

    // Progress within this interval (0..1)
    const start = elA.offsetTop;
    const end = (i < triggers.length - 1) ? elB.offsetTop : (start + window.innerHeight);
    const t = end === start ? 1 : clamp01((y - start) / (end - start));

    // Only update images when the pair changes (prevents flicker)
    if (sceneA !== currentA || sceneB !== currentB){
      setScene(leftA, rightA, sceneA);
      setScene(leftB, rightB, sceneB);
      currentA = sceneA;
      currentB = sceneB;
    }

    if (supportsMask){
      // Wipe reveal from top -> bottom
      const wipe = `${t * 100}%`;
      leftB.style.setProperty("--wipe", wipe);
      rightB.style.setProperty("--wipe", wipe);
    } else {
      // Fallback: normal opacity crossfade if masking isn't supported
      leftA.style.opacity = String(1 - t);
      rightA.style.opacity = String(1 - t);
      leftB.style.opacity = String(t);
      rightB.style.opacity = String(t);
    }

    // Optional subtle parallax
    const offset = y * 0.06;
    document.querySelectorAll(".side .bg-layer").forEach(layer => {
      layer.style.transform = `translateY(${offset}px) scale(1.05)`;
    });
  }

  let ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// Fade out side panels near the bottom to prevent them peeking through during overscroll bounce
