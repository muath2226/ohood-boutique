/* بوتيك عهود — motion helpers (cursor, tilt, bursts).
   Lamp + light: js/lumen-three.js (Three.js + HTML-in-canvas)
*/

(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Page intro ---------- */
  function runIntro() {
    const intro = document.getElementById("pageIntro");
    if (!intro) return;
    const done = () => intro.classList.add("done");
    if (reduced) {
      done();
      return;
    }
    setTimeout(done, 1400);
  }

  /* ---------- Scroll progress ---------- */
  function bindScrollProgress() {
    const bar = document.getElementById("scrollProgress");
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = `${p}%`;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------- Custom cursor ---------- */
  function bindCursor() {
    if (reduced || !finePointer) return;

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.append(dot, ring);
    document.body.classList.add("has-cursor");

    let x = 0,
      y = 0,
      rx = 0,
      ry = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        x = e.clientX;
        y = e.clientY;
        dot.style.left = x + "px";
        dot.style.top = y + "px";
      },
      { passive: true }
    );

    function loop() {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    }
    loop();

    const hoverSel =
      "a, button, .product-card, .cat-card, .filter-chip, .icon-btn, .mood-chip, input, select";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(hoverSel)) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(hoverSel)) document.body.classList.remove("cursor-hover");
    });
    document.addEventListener("mousedown", () => document.body.classList.add("cursor-click"));
    document.addEventListener("mouseup", () => document.body.classList.remove("cursor-click"));
  }

  /* ---------- Hero word split ---------- */
  function animateHeroTitle() {
    const h1 = document.querySelector(".hero h1");
    if (!h1 || reduced) return;

    const apply = () => {
      const text = h1.textContent.trim();
      const words = text.split(/\s+/);
      h1.innerHTML = words
        .map(
          (w, i) =>
            `<span class="word"><span style="animation-delay:${0.08 + i * 0.07}s">${w}</span></span>`
        )
        .join(" ");
    };

    apply();
    const obs = new MutationObserver(() => {
      if (!h1.querySelector(".word")) apply();
    });
    obs.observe(h1, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- Sparkles in hero ---------- */
  function spawnSparkles() {
    const field = document.querySelector(".sparkle-field");
    if (!field || reduced) return;
    field.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.animationDelay = Math.random() * 3.5 + "s";
      s.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
      field.appendChild(s);
    }
  }

  /* ---------- 3D tilt on product cards ---------- */
  function bindTilt(root = document) {
    if (reduced || !finePointer) return;

    root.querySelectorAll(".product-card, .cat-card").forEach((card) => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = "1";
      const media = card.querySelector(".product-media") || card;

      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -10;
        const ry = (px - 0.5) * 12;
        media.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
      });

      card.addEventListener("mouseleave", () => {
        media.style.transform = "";
      });
    });
  }

  /* ---------- Heart / spark burst ---------- */
  window.ohoodBurst = function (x, y, kind = "heart") {
    if (reduced) return;
    const chars =
      kind === "heart"
        ? ["♥", "✦", "✧", "♡", "✨"]
        : ["✦", "✧", "⋆", "·", "✦"];
    for (let i = 0; i < 10; i++) {
      const el = document.createElement("span");
      el.className = "fx-burst";
      el.textContent = chars[i % chars.length];
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.color = i % 2 ? "#d4b483" : "#c4a09a";
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 40 + Math.random() * 50;
      el.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      el.style.setProperty("--dy", Math.sin(angle) * dist - 20 + "px");
      el.style.setProperty("--rot", Math.random() * 80 - 40 + "deg");
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 950);
    }
  };

  window.ohoodBump = function (sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  };

  function observeSections() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in-view");
        });
      },
      { threshold: 0.35 }
    );
    document.querySelectorAll(".section-head, .editorial").forEach((el) => io.observe(el));
  }

  function bindMagnetic() {
    if (reduced || !finePointer) return;
    document.querySelectorAll(".btn-primary, .btn-outline").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  window.ohoodMotionRefresh = function () {
    bindTilt(document);
  };

  window.ohoodUpdateMarquee = function (lang) {
    const track = document.getElementById("marqueeTrack");
    const mood = document.getElementById("moodRail");
    if (!track || !mood) return;

    const items =
      lang === "ar"
        ? [
            "عبايات تفي بوعودها",
            "توصيل نفس اليوم · الرياض",
            "كود OHOOD15",
            "أناقة محتشمة",
            "تابي · تمارا",
            "✦ new drop",
            "من المجلس للمساء",
            "بوتيك عهود",
          ]
        : [
            "Abayas that keep promises",
            "Same-day Riyadh delivery",
            "Code OHOOD15",
            "Modest elegance",
            "Tabby · Tamara",
            "✦ new drop",
            "Majlis to midnight",
            "Boutique Ohood",
          ];

    const moods =
      lang === "ar"
        ? [
            ["☕", "مزاج قهوة التحلية"],
            ["🌙", "سهرة محتشمة"],
            ["✨", "لمعان ذهبي"],
            ["🖤", "عباية كلاسيك"],
            ["🕊", "هدوء الدرعية"],
            ["💎", "ضيفات العيد"],
            ["🌸", "ورد الصحراء"],
            ["📦", "نفس اليوم"],
          ]
        : [
            ["☕", "Tahlia café mood"],
            ["🌙", "Modest night out"],
            ["✨", "Gold shimmer"],
            ["🖤", "Classic abaya"],
            ["🕊", "Diriyah calm"],
            ["💎", "Eid guests"],
            ["🌸", "Desert rose"],
            ["📦", "Same-day drop"],
          ];

    const row = items
      .map((t) => `<span><i class="dot"></i> ${t} <i class="spark">✦</i></span>`)
      .join("");
    track.innerHTML = row + row;

    const chips = moods
      .map(([e, t]) => `<span class="mood-chip"><em>${e}</em> ${t}</span>`)
      .join("");
    mood.innerHTML = chips + chips;
  };

  document.addEventListener("DOMContentLoaded", () => {
    runIntro();
    bindScrollProgress();
    bindCursor();
    spawnSparkles();
    bindMagnetic();
    observeSections();

    setTimeout(() => {
      animateHeroTitle();
      bindTilt();
      const lang = localStorage.getItem("ohood-lang") || "ar";
      window.ohoodUpdateMarquee(lang);
    }, 50);

    const shop = document.getElementById("shopGrid");
    const featured = document.getElementById("featuredGrid");
    const cat = document.getElementById("catGrid");
    const mo = new MutationObserver(() => bindTilt());
    [shop, featured, cat].forEach((el) => {
      if (el) mo.observe(el, { childList: true });
    });
  });
})();
