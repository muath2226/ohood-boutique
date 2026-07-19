/* بوتيك عهود — Boutique Ohood */

const state = {
  lang: localStorage.getItem("ohood-lang") || "ar",
  cart: JSON.parse(localStorage.getItem("ohood-cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("ohood-wish") || "[]"),
  filter: "all",
  sort: "new",
  selectedProduct: null,
  selectedSize: null,
  selectedColor: null,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function t() {
  return I18N[state.lang];
}

function save() {
  localStorage.setItem("ohood-lang", state.lang);
  localStorage.setItem("ohood-cart", JSON.stringify(state.cart));
  localStorage.setItem("ohood-wish", JSON.stringify(state.wishlist));
}

function formatPrice(n) {
  const s = t().sections.sar;
  return state.lang === "ar"
    ? `${n.toLocaleString("ar-SA")} ${s}`
    : `${s} ${n.toLocaleString("en-US")}`;
}

function productName(p) {
  return p.name[state.lang];
}

function productDesc(p) {
  return p.desc[state.lang];
}

function badgeLabel(badge) {
  if (!badge) return "";
  const map = {
    new: state.lang === "ar" ? "جديد" : "New",
    bestseller: state.lang === "ar" ? "الأكثر مبيعاً" : "Bestseller",
    limited: state.lang === "ar" ? "محدود" : "Limited",
  };
  return map[badge] || badge;
}

/* ---------- i18n ---------- */
const STATIC_EYEBROWS = {
  collection: { ar: "المجموعة", en: "Collection" },
  curated: { ar: "منتقاة", en: "Curated" },
  capital: { ar: "خدمة العاصمة", en: "Capital service" },
  boutique: { ar: "البوتيك", en: "Boutique" },
  maison: { ar: "الدار", en: "Maison" },
  community: { ar: "المجتمع", en: "Community" },
  circle: { ar: "عائلة عهود", en: "Ohood Circle" },
};

function applyI18n() {
  const i = t();
  document.documentElement.lang = state.lang;
  document.documentElement.dir = i.dir;
  document.body.classList.toggle("rtl", state.lang === "ar");
  document.title =
    state.lang === "ar"
      ? "بوتيك عهود | أناقة محتشمة · الرياض"
      : "Boutique Ohood | Modest Elegance · Riyadh";

  $$("[data-i18n]").forEach((el) => {
    const path = el.getAttribute("data-i18n").split(".");
    let val = i;
    for (const k of path) val = val?.[k];
    if (typeof val === "string") el.textContent = val;
  });

  $$("[data-i18n-placeholder]").forEach((el) => {
    const path = el.getAttribute("data-i18n-placeholder").split(".");
    let val = i;
    for (const k of path) val = val?.[k];
    if (typeof val === "string") el.placeholder = val;
  });

  // Brand logos
  $$(".logo").forEach((el) => {
    el.innerHTML =
      state.lang === "ar"
        ? `عهود<span>بوتيك · الرياض</span>`
        : `Ohood<span>Boutique · Riyadh</span>`;
    el.classList.toggle("logo-ar", state.lang === "ar");
  });

  const brandEyebrow = $("[data-brand-eyebrow]");
  if (brandEyebrow) brandEyebrow.textContent = i.brand;

  $$("[data-static-eyebrow]").forEach((el) => {
    const key = el.getAttribute("data-static-eyebrow");
    if (STATIC_EYEBROWS[key]) el.textContent = STATIC_EYEBROWS[key][state.lang];
  });

  // Hero extras
  const heroMeta = {
    express: { ar: "توصيل سريع بالرياض", en: "Express Riyadh" },
    returns: { ar: "يوماً إرجاع مجاني", en: "Day free returns" },
    pay: { ar: "عند الاستلام · تابي · تمارا", en: "COD · Tabby · Tamara" },
  };
  $$("[data-hero-meta]").forEach((el) => {
    const k = el.getAttribute("data-hero-meta");
    if (heroMeta[k]) el.textContent = heroMeta[k][state.lang];
  });

  const cardTitle = $("[data-hero-card-title]");
  const cardSub = $("[data-hero-card-sub]");
  const cardBtn = $("[data-hero-card-btn]");
  if (cardTitle)
    cardTitle.textContent =
      state.lang === "ar" ? "عباية عهود المسائية" : "Ohood Evening Abaya";
  if (cardSub)
    cardSub.textContent =
      state.lang === "ar" ? "محتشمة · موسم جديد" : "Modest · New season";
  if (cardBtn) cardBtn.textContent = state.lang === "ar" ? "تسوقي" : "Shop";

  const shopNow = $("[data-shop-now]");
  if (shopNow) shopNow.textContent = state.lang === "ar" ? "تسوقي الآن" : "Shop now";

  const storyFloat = $("[data-story-float]");
  if (storyFloat)
    storyFloat.textContent =
      state.lang === "ar"
        ? "حيّاً نوصل لها في نفس اليوم بالرياض"
        : "Neighborhoods served same-day in Riyadh";

  const footerLinks = {
    "[data-footer-new]": { ar: "وصل حديثاً", en: "New In" },
    "[data-footer-abayas]": { ar: "عبايات", en: "Abayas" },
    "[data-footer-dresses]": { ar: "فساتين", en: "Dresses" },
    "[data-footer-acc]": { ar: "إكسسوارات", en: "Accessories" },
  };
  Object.entries(footerLinks).forEach(([sel, labels]) => {
    const el = $(sel);
    if (el) el.textContent = labels[state.lang];
  });

  const langBtn = $("#langToggle");
  if (langBtn) langBtn.textContent = state.lang === "en" ? "العربية" : "EN";

  // Scene mode button (مضيء / قاتم) — labels live in lumen-three.js
  if (typeof window.ohoodLumenUpdateLabels === "function") {
    window.ohoodLumenUpdateLabels();
  }

  // stickers + marquee by language
  const stickers = {
    1: { ar: "new drop ✦", en: "new drop ✦" },
    2: { ar: "رياض ✨", en: "Riyadh ✨" },
    3: { ar: "محتشم وفاخر", en: "modest & luxe" },
  };
  $$("[data-sticker]").forEach((el) => {
    const k = el.getAttribute("data-sticker");
    if (stickers[k]) el.textContent = stickers[k][state.lang];
  });
  if (window.ohoodUpdateMarquee) window.ohoodUpdateMarquee(state.lang);

  const introMark = $("#pageIntro .intro-mark");
  if (introMark && !introMark.classList.contains("done")) {
    introMark.innerHTML =
      state.lang === "ar"
        ? `عهود<span>بوتيك · الرياض</span>`
        : `Ohood<span>Boutique · Riyadh</span>`;
  }

  renderCategories();
  renderFeatured();
  renderShop();
  renderReviews();
  renderRiyadhPoints();
  updateCounts();
  renderCart();
  renderWishlist();

  // re-split hero words after text update (force fresh animation)
  requestAnimationFrame(() => {
    const h1 = $(".hero h1");
    if (h1) {
      const text = h1.textContent.trim();
      if (text && !h1.querySelector(".word")) {
        const words = text.split(/\s+/);
        h1.innerHTML = words
          .map(
            (w, i) =>
              `<span class="word"><span style="animation-delay:${0.08 + i * 0.07}s">${w}</span></span>`
          )
          .join(" ");
      }
    }
    if (window.ohoodMotionRefresh) window.ohoodMotionRefresh();
  });
}

/* ---------- Products filtering ---------- */
function getFilteredProducts() {
  let list = [...PRODUCTS];
  if (state.filter === "new") {
    list = list.filter((p) => p.badge === "new" || p.tags?.includes("new-in"));
  } else if (state.filter !== "all") {
    list = list.filter((p) => p.category === state.filter);
  }

  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else list = list.reverse(); // newest-ish

  return list;
}

function productCardHTML(p) {
  const wished = state.wishlist.includes(p.id);
  const badge = p.badge
    ? `<span class="product-badge ${p.compareAt ? "sale" : ""}">${badgeLabel(p.badge)}</span>`
    : p.compareAt
      ? `<span class="product-badge sale">-${Math.round(((p.compareAt - p.price) / p.compareAt) * 100)}%</span>`
      : "";

  return `
    <article class="product-card reveal" data-id="${p.id}">
      <div class="product-media">
        ${badge}
        <img class="img-main" src="${p.image}" alt="${productName(p)}" loading="lazy" />
        <img class="img-hover" src="${p.hoverImage || p.image}" alt="" loading="lazy" />
        <div class="product-actions">
          <button class="btn btn-sm" data-action="quick" data-id="${p.id}">${t().sections.quickView}</button>
          <button class="wish-btn ${wished ? "active" : ""}" data-action="wish" data-id="${p.id}" aria-label="Wishlist">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3>${productName(p)}</h3>
        <div class="product-price">
          <span>${formatPrice(p.price)}</span>
          ${p.compareAt ? `<span class="compare">${formatPrice(p.compareAt)}</span>` : ""}
        </div>
        <div class="product-colors">
          ${p.colors.map((c) => `<span class="swatch" style="background:${c}"></span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderFeatured() {
  const el = $("#featuredGrid");
  if (!el) return;
  const featured = PRODUCTS.filter((p) => p.badge).slice(0, 4);
  const list = featured.length ? featured : PRODUCTS.slice(0, 4);
  el.innerHTML = list.map(productCardHTML).join("");
  observeReveals(el);
}

function renderShop() {
  const el = $("#shopGrid");
  if (!el) return;
  const list = getFilteredProducts();
  el.innerHTML = list.map(productCardHTML).join("");
  const count = $("#resultsCount");
  if (count) count.textContent = `${list.length} ${t().sections.results}`;
  observeReveals(el);

  // filter chips labels + active state
  const filters = $("#filters");
  if (filters) {
    filters.innerHTML = CATEGORIES.map(
      (c) =>
        `<button class="filter-chip ${state.filter === c.id ? "active" : ""}" data-filter="${c.id}">${c[state.lang]}</button>`
    ).join("");
  }

  const sort = $("#sortSelect");
  if (sort) {
    const val = state.sort;
    sort.innerHTML = `
      <option value="new">${t().sections.sortNew}</option>
      <option value="price-asc">${t().sections.sortPriceAsc}</option>
      <option value="price-desc">${t().sections.sortPriceDesc}</option>
    `;
    sort.value = val;
  }
}

function renderCategories() {
  const el = $("#catGrid");
  if (!el) return;
  const cats = [
    {
      id: "abayas",
      en: "Abayas",
      ar: "عبايات",
      sub: { en: "Modern modest", ar: "حشمة عصرية" },
      img: "https://images.pexels.com/photos/35324619/pexels-photo-35324619.jpeg?auto=compress&cs=tinysrgb&w=700",
    },
    {
      id: "dresses",
      en: "Dresses",
      ar: "فساتين",
      sub: { en: "Covered & elegant", ar: "مغطاة وأنيقة" },
      img: "https://images.pexels.com/photos/35263628/pexels-photo-35263628.jpeg?auto=compress&cs=tinysrgb&w=700",
    },
    {
      id: "jalabiyas",
      en: "Jalabiyas",
      ar: "جلابيات",
      sub: { en: "At-home elegance", ar: "أناقة المنزل" },
      img: "https://images.pexels.com/photos/35324621/pexels-photo-35324621.jpeg?auto=compress&cs=tinysrgb&w=700",
    },
    {
      id: "accessories",
      en: "Accessories",
      ar: "إكسسوارات",
      sub: { en: "Hijabs & finishing", ar: "حجابات ولمسات" },
      img: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=700&q=80",
    },
  ];

  el.innerHTML = cats
    .map(
      (c) => `
    <a class="cat-card reveal" href="#shop" data-filter-link="${c.id}">
      <img src="${c.img}" alt="${c[state.lang]}" loading="lazy" />
      <div class="cat-card-label">
        <h3>${c[state.lang]}</h3>
        <span>${c.sub[state.lang]}</span>
      </div>
    </a>
  `
    )
    .join("");
  observeReveals(el);
}

function renderReviews() {
  const el = $("#reviewGrid");
  if (!el) return;
  el.innerHTML = REVIEWS.map(
    (r) => `
    <article class="review-card reveal">
      <div class="stars">${"★".repeat(r.stars)}</div>
      <p>“${r.text[state.lang]}”</p>
      <div class="review-author">
        <strong>${r.name[state.lang]}</strong>
        <span>${r.city[state.lang]}</span>
      </div>
    </article>
  `
  ).join("");
  observeReveals(el);
}

function renderRiyadhPoints() {
  const el = $("#riyadhPoints");
  if (!el) return;
  const points = t().sections.riyadhPoints;
  el.innerHTML = points
    .map(
      (p, i) => `
    <li>
      <span class="point-num">0${i + 1}</span>
      <div>
        <strong>${p.t}</strong>
        <p>${p.d}</p>
      </div>
    </li>
  `
    )
    .join("");
}

/* ---------- Cart & Wishlist ---------- */
function updateCounts() {
  const cartCount = state.cart.reduce((n, i) => n + i.qty, 0);
  $$("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount;
    el.hidden = cartCount === 0;
  });
  $$("[data-wish-count]").forEach((el) => {
    el.textContent = state.wishlist.length;
    el.hidden = state.wishlist.length === 0;
  });
}

function addToCart(id, size, color) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  const key = `${id}|${size}|${color}`;
  const existing = state.cart.find((i) => i.key === key);
  if (existing) existing.qty += 1;
  else
    state.cart.push({
      key,
      id,
      size,
      color,
      qty: 1,
      price: p.price,
      name: p.name,
      image: p.image,
    });
  save();
  updateCounts();
  renderCart();
  toast(state.lang === "ar" ? "أُضيفت إلى حقيبة عهود" : "Added to Ohood bag");
  if (window.ohoodBump) window.ohoodBump("#cartBtn");
}

function toggleWish(id, event) {
  const i = state.wishlist.indexOf(id);
  if (i >= 0) state.wishlist.splice(i, 1);
  else state.wishlist.push(id);
  save();
  updateCounts();
  renderFeatured();
  renderShop();
  renderWishlist();
  toast(
    i >= 0
      ? state.lang === "ar"
        ? "أُزيلت من المفضلة"
        : "Removed from wishlist"
      : state.lang === "ar"
        ? "أُضيفت لمفضلة عهود"
        : "Saved to Ohood wishlist"
  );
  if (i < 0 && window.ohoodBurst) {
    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? window.innerHeight / 2;
    window.ohoodBurst(x, y, "heart");
  }
  if (window.ohoodBump) window.ohoodBump("#wishBtn");
}

function renderCart() {
  const body = $("#cartBody");
  const foot = $("#cartFoot");
  if (!body) return;

  if (!state.cart.length) {
    body.innerHTML = `<div class="empty-state"><p>${t().sections.emptyBag}</p><button class="btn btn-outline btn-sm" data-close-drawer>${t().sections.continue}</button></div>`;
    if (foot) foot.hidden = true;
    return;
  }

  if (foot) foot.hidden = false;
  body.innerHTML = state.cart
    .map((item) => {
      const name = item.name[state.lang];
      return `
      <div class="cart-item" data-key="${item.key}">
        <img src="${item.image}" alt="${name}" />
        <div>
          <h4>${name}</h4>
          <div class="meta">${t().sections.size}: ${item.size} · ${item.color || "—"}</div>
          <div class="qty-row">
            <button data-qty="-1" data-key="${item.key}">−</button>
            <span>${item.qty}</span>
            <button data-qty="1" data-key="${item.key}">+</button>
          </div>
          <button class="remove-item" data-remove="${item.key}">${state.lang === "ar" ? "إزالة" : "Remove"}</button>
        </div>
        <div class="price">${formatPrice(item.price * item.qty)}</div>
      </div>
    `;
    })
    .join("");

  const total = state.cart.reduce((n, i) => n + i.price * i.qty, 0);
  const totalEl = $("#cartTotal");
  if (totalEl) totalEl.textContent = formatPrice(total);
  const note = $("#freeShipNote");
  if (note) {
    const left = 400 - total;
    note.textContent =
      left > 0
        ? state.lang === "ar"
          ? `أضيفي ${formatPrice(left)} للحصول على توصيل مجاني`
          : `Add ${formatPrice(left)} for free delivery`
        : state.lang === "ar"
          ? "✓ توصيل مجاني على طلبك"
          : "✓ Free delivery on your order";
  }
}

function renderWishlist() {
  const body = $("#wishBody");
  if (!body) return;
  if (!state.wishlist.length) {
    body.innerHTML = `<div class="empty-state"><p>${t().sections.emptyWish}</p></div>`;
    return;
  }
  const items = PRODUCTS.filter((p) => state.wishlist.includes(p.id));
  body.innerHTML = items
    .map(
      (p) => `
    <div class="cart-item">
      <img src="${p.image}" alt="${productName(p)}" />
      <div>
        <h4>${productName(p)}</h4>
        <div class="meta">${formatPrice(p.price)}</div>
        <button class="btn btn-sm btn-primary" style="margin-top:.5rem" data-action="quick" data-id="${p.id}">${t().sections.quickView}</button>
      </div>
      <button class="remove-item" data-unwish="${p.id}">×</button>
    </div>
  `
    )
    .join("");
}

/* ---------- Quick view ---------- */
function openQuickView(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  state.selectedProduct = p;
  state.selectedSize = p.sizes[0];
  state.selectedColor = p.colors[0];

  const modal = $("#quickModal");
  $("#qvImage").src = p.image;
  $("#qvImage").alt = productName(p);
  $("#qvName").textContent = productName(p);
  $("#qvPrice").innerHTML = `${formatPrice(p.price)}${
    p.compareAt ? ` <span class="compare">${formatPrice(p.compareAt)}</span>` : ""
  }`;
  $("#qvDesc").textContent = productDesc(p);

  $("#qvSizes").innerHTML = p.sizes
    .map(
      (s, i) =>
        `<button type="button" class="${i === 0 ? "active" : ""}" data-size="${s}">${s}</button>`
    )
    .join("");
  $("#qvColors").innerHTML = p.colors
    .map(
      (c, i) =>
        `<button type="button" class="${i === 0 ? "active" : ""}" data-color="${c}" style="background:${c}" aria-label="color"></button>`
    )
    .join("");

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeQuickView() {
  $("#quickModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- Drawers ---------- */
function openDrawer(id) {
  $("#overlay")?.classList.add("open");
  $(id)?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeDrawers() {
  $("#overlay")?.classList.remove("open");
  $$(".drawer").forEach((d) => d.classList.remove("open"));
  $("#mobileNav")?.classList.remove("open");
  document.body.style.overflow = "";
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------- Reveal on scroll ---------- */
let observer;
function observeReveals(root = document) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
  }
  $$(".reveal", root).forEach((el) => observer.observe(el));
}

/* ---------- Events ---------- */
function bindEvents() {
  // language
  $("#langToggle")?.addEventListener("click", () => {
    state.lang = state.lang === "en" ? "ar" : "en";
    save();
    applyI18n();
  });

  // mobile menu
  $("#menuToggle")?.addEventListener("click", () => {
    $("#mobileNav")?.classList.add("open");
    document.body.style.overflow = "hidden";
  });
  $("#mobileClose")?.addEventListener("click", closeDrawers);

  // cart / wish
  $("#cartBtn")?.addEventListener("click", () => {
    renderCart();
    openDrawer("#cartDrawer");
  });
  $("#wishBtn")?.addEventListener("click", () => {
    renderWishlist();
    openDrawer("#wishDrawer");
  });
  $("#overlay")?.addEventListener("click", closeDrawers);
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-drawer]")) closeDrawers();
  });

  // shop filters
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (chip) {
      state.filter = chip.dataset.filter;
      renderShop();
    }

    const filterLink = e.target.closest("[data-filter-link]");
    if (filterLink) {
      state.filter = filterLink.dataset.filterLink;
      renderShop();
      // scroll handled by hash
    }

    const action = e.target.closest("[data-action]");
    if (action) {
      const id = action.dataset.id;
      if (action.dataset.action === "quick") {
        closeDrawers();
        openQuickView(id);
      }
      if (action.dataset.action === "wish") {
        e.preventDefault();
        e.stopPropagation();
        toggleWish(id, e);
      }
      return;
    }

    // Click product card / media to quick view
    const card = e.target.closest(".product-card");
    if (card && !e.target.closest("button")) {
      openQuickView(card.dataset.id);
    }

    const sizeBtn = e.target.closest("[data-size]");
    if (sizeBtn && sizeBtn.closest("#qvSizes")) {
      $$("#qvSizes button").forEach((b) => b.classList.remove("active"));
      sizeBtn.classList.add("active");
      state.selectedSize = sizeBtn.dataset.size;
    }

    const colorBtn = e.target.closest("[data-color]");
    if (colorBtn && colorBtn.closest("#qvColors")) {
      $$("#qvColors button").forEach((b) => b.classList.remove("active"));
      colorBtn.classList.add("active");
      state.selectedColor = colorBtn.dataset.color;
    }

    if (e.target.closest("[data-qty]")) {
      const btn = e.target.closest("[data-qty]");
      const item = state.cart.find((i) => i.key === btn.dataset.key);
      if (item) {
        item.qty += Number(btn.dataset.qty);
        if (item.qty <= 0) state.cart = state.cart.filter((i) => i.key !== item.key);
        save();
        updateCounts();
        renderCart();
      }
    }

    if (e.target.closest("[data-remove]")) {
      const key = e.target.closest("[data-remove]").dataset.remove;
      state.cart = state.cart.filter((i) => i.key !== key);
      save();
      updateCounts();
      renderCart();
    }

    if (e.target.closest("[data-unwish]")) {
      toggleWish(e.target.closest("[data-unwish]").dataset.unwish, e);
    }
  });

  $("#sortSelect")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderShop();
  });

  $("#qvAdd")?.addEventListener("click", () => {
    if (!state.selectedProduct) return;
    addToCart(state.selectedProduct.id, state.selectedSize, state.selectedColor);
    closeQuickView();
    openDrawer("#cartDrawer");
  });

  $("#qvClose")?.addEventListener("click", closeQuickView);
  $(".modal-backdrop")?.addEventListener("click", closeQuickView);

  $("#checkoutBtn")?.addEventListener("click", () => {
    toast(
      state.lang === "ar"
        ? "شكراً لكِ — نسخة تجريبية من بوتيك عهود"
        : "Thank you — Boutique Ohood demo checkout"
    );
  });

  $("#newsForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    toast(
      state.lang === "ar"
        ? "مرحباً بكِ في عائلة عهود ✨"
        : "Welcome to the Ohood circle ✨"
    );
    e.target.reset();
  });

  // header shadow
  window.addEventListener("scroll", () => {
    $(".header")?.classList.toggle("scrolled", window.scrollY > 20);
  });

  // deep link shop filter from hash
  if (location.hash === "#abayas") {
    state.filter = "abayas";
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  applyI18n();
  observeReveals();
});
