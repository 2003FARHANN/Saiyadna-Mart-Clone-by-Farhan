import {
  stats,
  series,
  wallet,
  capital,
  earnings,
  inPeriod,
  quote,
  commissionState,
  dateKey,
} from "./domain.js";
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const money = (n) =>
  `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format((n || 0) / 100)}`;
export const compact = (n) =>
  `${n < 0 ? "-" : ""}৳${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(Math.abs(n || 0) / 100)}`;
export const num = (n) => new Intl.NumberFormat("en-BD").format(n || 0);
export const when = (v) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date(v));
export const initials = (n) =>
  (n || "S M")
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
const paths = {
  bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  leaf: '<path d="M20 3C10 1 3 7 5 15c8 4 15-2 15-12Z"/><path d="M3 21 15 9"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 3 5-7"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  box: '<path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5M12 13v9M7 5.8l9 5"/>',
  wallet:
    '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8V5l14-3v3m-1 6h5v5h-5z"/>',
  bank: '<path d="m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18"/>',
  people:
    '<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 1 1 0 6m3 4a5 5 0 0 1 3 5v2"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  bell: '<path d="M5 17V9a7 7 0 0 1 14 0v8l2 2H3l2-2Zm4 4h6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  refresh:
    '<path d="M20 7V2m0 5h-5M4 17v5m0-5h5M5 7a8 8 0 0 1 14-2M19 17a8 8 0 0 1-14 2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  shield:
    '<path d="m12 2 8 4v7c0 5-8 9-8 9s-8-4-8-9V6l8-4Z"/><path d="m8 12 3 3 5-6"/>',
  truck:
    '<path d="M3 5h11v12H3V5Zm11 5h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  edit: '<path d="m15 4 5 5M4 20l1-6L16 3a2 2 0 0 1 3 0l2 2a2 2 0 0 1 0 3L10 19l-6 1Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  logout: '<path d="M10 4H4v16h6m0-8h11m-4-4 4 4-4 4"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7" cy="7" r="1"/>',
  message: '<path d="M21 4H3v14h5l4 4 4-4h5V4ZM7 9h10M7 13h6"/>',
  gift: '<path d="M3 9h18v4H3V9Zm2 4v8h14v-8M12 9v12"/><path d="M12 9C2 9 6-1 12 9c6-10 10 0 0 0Z"/>',
  activity: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
};
export const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.box}</svg>`;
export const btn = (label, action, extra = "", cls = "btn") =>
  `<button class="${cls}" type="button" data-action="${action}" ${extra}>${label}</button>`;
export const badge = (text) =>
  `<span class="badge ${["Approved", "Delivered", "Paid", "Active"].includes(text) ? "positive" : ["Rejected", "Cancelled", "Refunded", "Recovery due", "Inactive"].includes(text) ? "negative" : ["Pending", "On hold", "Awaiting delivery", "Processing"].includes(text) ? "warning" : ""}">${esc(text)}</span>`;
export const empty = (title, body, action = "") =>
  `<div class="empty-state">${icon("box")}<h3>${esc(title)}</h3><p>${esc(body)}</p>${action}</div>`;
export const field = (label, name, value = "", type = "text", extra = "") =>
  `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
export const select = (label, name, options, value = "", extra = "") =>
  `<label class="field"><span>${label}</span><select name="${name}" ${extra}>${options
    .map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`;
    })
    .join("")}</select></label>`;
const demoStrip = () =>
  `<div class="demo-strip"><span><i></i> INTERACTIVE PROTOTYPE</span><span>Sample data · No real payments</span><a href="#/login/investor">Explore the portals ${icon("arrow")}</a></div>`;
const shopHeader = (s, user, ui, cart) =>
  `${demoStrip()}<div class="delivery-strip">${esc(s.settings.tagline)} <span>Free delivery on orders ${money(s.settings.freeDelivery)}+</span></div><header class="shop-header"><div class="container shop-nav"><a class="brand" href="#/shop" aria-label="Saiyadna Mart home"><img src="assets/logo.webp" alt="Saiyadna Mart" class="brand-logo"></a><nav class="shop-links" aria-label="Shop navigation"><a class="${ui.category === "All" ? "active" : ""}" href="#/shop">Shop all</a><a href="#/combos">Combo offers <span class="nav-dot"></span></a><a href="#/orders">My orders</a></nav><form class="searchbox" data-form="search">${icon("search")}<input name="search" aria-label="Search products" placeholder="Find your everyday goodness…" value="${esc(ui.search)}"><button type="submit" aria-label="Search">${icon("arrow")}</button></form><div class="nav-actions"><a class="icon-btn" href="#/account" aria-label="${user?.role === "customer" ? "My account" : "Customer sign in"}">${icon("user")}</a><a class="cart-link" href="#/cart" aria-label="Basket with ${cart.reduce((a, x) => a + x.quantity, 0)} items">${icon("bag")}<span class="cart-count">${cart.reduce((a, x) => a + x.quantity, 0)}</span></a></div></div><nav class="mobile-shop-links" aria-label="Mobile shop navigation"><a href="#/shop">Shop</a><a href="#/combos">Combos</a><a href="#/orders">My orders</a><a href="#/login/investor">Investor</a></nav></header>`;
const footer = (s) =>
  `<footer class="shop-footer"><div class="container footer-grid"><div><img src="assets/logo.webp" alt="Saiyadna Mart" class="brand-logo"><p>Good food for your family.<br>Good growth for our community.</p></div><div><h4>Shop with us</h4><a href="#/shop">All products</a><a href="#/combos">Combo offers</a><a href="#/account">My account & address</a></div><div><h4>Our community</h4><a href="#/login/investor">Investor portal</a><a href="#/login/admin">Master portal</a><button data-action="about-demo" class="text-link">About this prototype</button></div><div class="footer-note"><span class="eyebrow">MADE FOR EVERYDAY GOODNESS</span><p>A connected shopping and investment experience, inspired by Saiyadna Mart.</p><span class="badge">Presentation prototype</span></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${esc(s.settings.storeName)} · Prototype concept</span><span>Designed with care in Bangladesh</span></div></footer>`;
function rating(s, pid) {
  const rs = s.reviews.filter(
    (r) => r.productId === pid && r.status === "Approved",
  );
  return {
    count: rs.length,
    value: rs.length
      ? (rs.reduce((a, r) => a + r.rating, 0) / rs.length).toFixed(1)
      : null,
  };
}
export function productCard(s, p, ui) {
  const v = p.variants.find((v) => v.id === ui.variants[p.id]) || p.variants[0],
    r = rating(s, p.id);
  return `<article class="product-card"><a class="product-image" href="#/product/${p.id}"><span class="product-badge">${esc(p.badge || p.category)}</span><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></a><div class="product-body"><div class="product-meta"><span>${esc(p.category)}</span><span class="rating">${icon("star")}${r.value || "New"}${r.count ? ` <small>(${r.count})</small>` : ""}</span></div><a class="product-name" href="#/product/${p.id}">${esc(p.name)}</a><p class="bn-name">${esc(p.bn)}</p><div class="product-buy-row"><div><strong>${money(v.price)}</strong>${v.compareAt > v.price ? `<del>${money(v.compareAt)}</del>` : ""}</div><select aria-label="Pack size for ${esc(p.name)}" data-variant="${p.id}">${p.variants.map((x) => `<option value="${x.id}" ${x.id === v.id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select></div><div class="product-buttons">${btn(`${icon("plus")} Add to basket`, "add-cart", `data-id="${p.id}" data-variant-id="${v.id}" ${v.stock === 0 ? "disabled" : ""}`, "btn btn-outline btn-sm")}${btn(icon("arrow"), "buy-now", `data-id="${p.id}" data-variant-id="${v.id}" aria-label="Buy ${esc(p.name)} now" title="Buy now" ${v.stock === 0 ? "disabled" : ""}`, "btn btn-icon")}</div></div></article>`;
}
export function storefront(s, user, ui, cart, combos = false) {
  let products = s.products.filter(
    (p) =>
      p.active &&
      (!combos || p.category === "Combos") &&
      (ui.category === "All" || p.category === ui.category),
  );
  if (ui.search)
    products = products.filter((p) =>
      `${p.name} ${p.bn} ${p.category}`
        .toLowerCase()
        .includes(ui.search.toLowerCase()),
    );
  if (ui.sort === "low")
    products.sort((a, b) => a.variants[0].price - b.variants[0].price);
  if (ui.sort === "high")
    products.sort((a, b) => b.variants[0].price - a.variants[0].price);
  const categories = [
    ["All", "grid"],
    ["Honey", "leaf"],
    ["Oils", "coin"],
    ["Dairy", "box"],
    ["Spices", "tag"],
    ["Combos", "gift"],
  ];
  const featured = s.products.find(
      (p) =>
        p.id === (s.settings.featuredCombo ?? "essentials") &&
        p.active &&
        p.category === "Combos",
    ),
    offer = featured?.variants[0];
  const hero = combos
    ? `<section class="combo-hero container"><div><span class="eyebrow">BETTER TOGETHER</span><h1>Your favourites.<br>A little more value.</h1><p>Thoughtful bundles for the pantry, the family, and the everyday.</p></div>${icon("gift", "combo-hero-icon")}</section>`
    : `<section class="hero container"><div class="hero-copy"><span class="eyebrow"><span class="tiny-line"></span> FROM OUR PANTRY TO YOURS</span><h1>${esc(s.settings.heroTitle).replace(/\n/g, "<br>")}</h1><p>${esc(s.settings.heroSubtitle)}</p><div class="hero-actions"><a class="btn btn-lg" href="#catalog">Shop the collection ${icon("arrow")}</a><a class="hero-secondary" href="#/combos">Explore combos ${icon("gift")}</a></div><div class="hero-trust"><span>${icon("leaf")} Thoughtfully chosen</span><span>${icon("truck")} Delivered with care</span></div></div><div class="hero-art"><div class="hero-circle"></div><span class="hero-arc">PURE FLAVOUR · EVERYDAY GOODNESS</span><img class="hero-honey" src="assets/honey-black-cumin.jpg" alt="Saiyadna Mart black cumin honey"><img class="hero-ghee" src="assets/gawa-ghee.png" alt="Traditional gawa ghee"><div class="hero-stamp">A pantry<br>full of <em>good.</em>${icon("leaf")}</div><div class="hero-note">${icon("gift")}<div><strong>Little joys, bundled.</strong><span>Discover our curated combo boxes</span></div><a href="#/combos" aria-label="Explore combo boxes">${icon("arrow")}</a></div></div></section>`;
  return `${shopHeader(s, user, ui, cart)}<main id="main">${hero}${!combos && featured && offer ? `<div class="container offer-banner"><div class="offer-icon">${icon("gift")}</div><div><span class="eyebrow">${esc(featured.name)}</span><strong>Little joys, bundled. ${esc(featured.badge || "Explore our combo offer")}.</strong></div><div class="offer-price">${offer.compareAt > offer.price ? `<del>${money(offer.compareAt)}</del>` : ""}<b>${money(offer.price)}</b></div>${btn(`Buy this combo ${icon("arrow")}`, "buy-now", `data-id="${featured.id}" data-variant-id="${offer.id}" ${offer.stock === 0 ? "disabled" : ""}`, "btn btn-cream")}</div>` : ""}<section class="container catalog" id="catalog"><div class="section-heading"><div><span class="eyebrow">THE GOOD STUFF</span><h2>${combos ? "Bundles made for you" : "Stock up on the things you love."}</h2></div><span class="muted">${products.length} thoughtfully chosen products</span></div><div class="catalog-toolbar"><div class="category-pills">${categories.map(([c, i]) => btn(`${icon(i)}${c}`, "category", `data-category="${c}"`, `${ui.category === c ? "category-pill selected" : "category-pill"}`)).join("")}</div><select aria-label="Sort products" data-sort><option value="featured" ${ui.sort === "featured" ? "selected" : ""}>Featured first</option><option value="low" ${ui.sort === "low" ? "selected" : ""}>Price: low to high</option><option value="high" ${ui.sort === "high" ? "selected" : ""}>Price: high to low</option></select></div>${ui.search ? `<div class="search-summary">Results for “${esc(ui.search)}” ${btn("Clear search", "clear-search", "", "text-link")}</div>` : ""}<div class="product-grid">${products.length ? products.map((p) => productCard(s, p, ui)).join("") : empty("No products found", "Try a different keyword or category.", btn("Show all products", "clear-search", "", "btn btn-outline"))}</div></section><section class="container community-banner"><div><span class="eyebrow">GROW WITH OUR COMMUNITY</span><h2>More than a marketplace.<br>A shared journey.</h2><p>Follow the business, explore your investment and see the bigger picture.</p><a href="#/login/investor" class="btn btn-outline">Explore investor portal ${icon("arrow")}</a></div><div class="community-stats"><div>${icon("chart")}<strong>Clear insights</strong><span>Sales & profit at a glance</span></div><div>${icon("wallet")}<strong>Your investment</strong><span>One connected dashboard</span></div><div>${icon("shield")}<strong>Your control</strong><span>Request. Review. Track.</span></div></div></section></main>${footer(s)}`;
}
export function productPage(s, user, ui, cart, id) {
  const p = s.products.find((x) => x.id === id && x.active);
  if (!p)
    return `${shopHeader(s, user, ui, cart)}<main id="main" class="container">${empty("This product is unavailable", "Explore the rest of our collection.", '<a class="btn" href="#/shop">Continue shopping</a>')}</main>${footer(s)}`;
  const v = p.variants.find((x) => x.id === ui.variants[p.id]) || p.variants[0],
    r = rating(s, id),
    reviews = s.reviews.filter(
      (x) =>
        x.productId === id &&
        (x.status === "Approved" || x.userId === user?.id),
    );
  return `${shopHeader(s, user, ui, cart)}<main class="container product-page" id="main"><div class="breadcrumb"><a href="#/shop">Shop</a><span>/</span>${esc(p.category)}<span>/</span>${esc(p.name)}</div><div class="product-detail"><div class="detail-image"><span class="product-badge">${esc(p.badge)}</span><img src="${esc(p.image)}" alt="${esc(p.name)}"></div><div class="detail-copy"><span class="eyebrow">${esc(p.category)} · EVERYDAY GOODNESS</span><h1>${esc(p.name)}</h1><p class="bn-detail">${esc(p.bn)}</p><div class="rating">${icon("star")} ${r.value || "No ratings yet"} <span class="muted">${r.count ? `/ 5 · ${r.count} reviews` : ""}</span></div><p class="detail-description">${esc(p.description)}</p><div class="detail-price"><strong>${money(v.price)}</strong><del>${money(v.compareAt)}</del>${v.compareAt > v.price ? badge(`Save ${money(v.compareAt - v.price)}`) : ""}</div><label class="field"><span>Choose your pack</span><select data-variant="${id}">${p.variants.map((x) => `<option value="${x.id}" ${x.id === v.id ? "selected" : ""}>${esc(x.label)} · ${money(x.price)}</option>`).join("")}</select></label><p class="stock-note">${icon("check")} ${v.stock > 0 ? `${v.stock} in stock · Ready for your pantry` : "Currently out of stock"}</p><div class="detail-buttons">${btn(`${icon("bag")} Add to basket`, "add-cart", `data-id="${id}" data-variant-id="${v.id}" ${v.stock === 0 ? "disabled" : ""}`, "btn btn-lg")}${btn(`Buy now ${icon("arrow")}`, "buy-now", `data-id="${id}" data-variant-id="${v.id}" ${v.stock === 0 ? "disabled" : ""}`, "btn btn-outline btn-lg")}</div><div class="detail-benefits"><span>${icon("truck")} Free delivery from ${money(s.settings.freeDelivery)}</span><span>${icon("shield")} Cash on delivery available</span></div></div></div><section class="reviews-section"><div class="section-heading"><div><span class="eyebrow">FROM OUR COMMUNITY</span><h2>Little notes. Honest opinions.</h2></div>${btn(`${icon("edit")} Write a review`, "review", `data-id="${id}"`, "btn btn-outline")}</div><div class="review-grid">${reviews.map((x) => `<article class="review-card"><div class="review-top"><span class="avatar small">${esc(initials(x.name))}</span><div><b>${esc(x.name)}</b><small>${when(x.date)}${x.sample ? " · Sample review" : ""}</small></div><span class="rating">${icon("star")} ${x.rating}</span></div><p>${esc(x.text)}</p>${x.status !== "Approved" ? badge("Pending") : x.verified ? '<span class="verified">Verified demo purchase</span>' : ""}</article>`).join("") || empty("Be the first to review", "Share your thoughts about this product.")}</div></section></main>${footer(s)}`;
}
export function cartPage(s, user, ui, cart) {
  let q = null,
    error = "";
  try {
    q = quote(s, cart, user?.address, ui.coupon);
  } catch (e) {
    error = e.message;
    try {
      q = quote(s, cart, user?.address, "");
    } catch {}
  }
  const rows = cart
    .map((x, i) => {
      const p = s.products.find((p) => p.id === x.productId),
        v = p?.variants.find((v) => v.id === x.variantId);
      return p && v
        ? `<div class="cart-item"><img src="${esc(p.image)}" alt="${esc(p.name)}"><div class="cart-item-info"><a href="#/product/${p.id}">${esc(p.name)}</a><span>${esc(v.label)} · ${money(v.price)}</span></div><div class="quantity">${btn(icon("minus"), "cart-minus", `data-index="${i}" aria-label="Reduce ${esc(p.name)} quantity"`, "icon-btn")}<span>${x.quantity}</span>${btn(icon("plus"), "cart-plus", `data-index="${i}" aria-label="Increase ${esc(p.name)} quantity"`, "icon-btn")}</div><strong>${money(v.price * x.quantity)}</strong>${btn(icon("trash"), "cart-remove", `data-index="${i}" aria-label="Remove ${esc(p.name)}"`, "icon-btn muted")}</div>`
        : "";
    })
    .join("");
  return `${shopHeader(s, user, ui, cart)}<main id="main" class="container page-space"><div class="section-heading"><div><span class="eyebrow">A LITTLE GOODNESS, READY TO GO</span><h1>Your basket</h1></div><a href="#/shop" class="text-link">Keep shopping ${icon("arrow")}</a></div>${cart.length ? `<div class="checkout-grid"><div><div class="panel cart-items">${rows}</div><div class="info-note">${icon("truck")} Free delivery applies to the product total after discounts, from ${money(s.settings.freeDelivery)}.</div></div><aside class="panel order-summary"><h3>Order summary</h3><div class="summary-line"><span>Subtotal</span><strong>${money(q?.subtotal)}</strong></div><div class="summary-line"><span>Discount</span><strong>−${money(q?.discount)}</strong></div><div class="summary-line"><span>Delivery estimate</span><strong>${q?.shipping ? money(q.shipping) : "Free"}</strong></div><form data-form="coupon" class="coupon-form"><input name="coupon" aria-label="Coupon code" placeholder="Coupon code" value="${esc(ui.coupon)}"><button class="btn btn-outline" type="submit">Apply</button></form><p class="form-hint">Try ${esc(s.settings.couponCode)} for ${s.settings.couponPct}% off, up to ${money(s.settings.couponCap)}.</p>${error ? `<p class="form-error">${esc(error)}</p>` : ""}<div class="summary-total"><span>Total</span><strong>${money(q?.total)}</strong></div>${btn(`Continue to checkout ${icon("arrow")}`, "checkout", "", "btn full-width")}<p class="tiny muted">Demo checkout · No money will be charged.</p></aside></div>` : empty("Your basket is waiting", "Let’s fill it with something good.", '<a class="btn" href="#/shop">Explore the collection ' + icon("arrow") + "</a>")}</main>${footer(s)}`;
}
export function addressForm(user) {
  const a = user.address || {};
  return `<form data-form="address" class="form-grid">${field("Full name", "name", a.name || user.name, "text", 'required autocomplete="name"')}${field("Phone number", "phone", a.phone || "", "tel", 'required pattern="01[0-9]{9}" maxlength="11" placeholder="01XXXXXXXXX"')}${select("City / district", "city", ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh", "Gazipur", "Narayanganj", "Cumilla", "Other"], a.city || "Dhaka")}<label class="field"><span>Full delivery address</span><input name="street" value="${esc(a.street || "")}" required minlength="8" placeholder="House, road, area"></label><div class="span-2"><button class="btn" type="submit">${icon("check")} Save address</button></div></form>`;
}
export function customerPage(s, user, ui, cart, tab) {
  const orders = s.orders.filter((x) => x.userId === user.id).slice(0, 20);
  return `${shopHeader(s, user, ui, cart)}<main class="container page-space" id="main"><div class="section-heading"><div><span class="eyebrow">YOUR LITTLE CORNER</span><h1>${tab === "orders" ? "Your orders" : `Hello, ${esc(user.name.split(" ")[0])}.`}</h1><p class="muted">${tab === "orders" ? "Follow every delivery, from our pantry to your door." : "Your details, saved for a smoother checkout."}</p></div>${btn(`${icon("logout")} Sign out`, "logout", "", "btn btn-outline")}</div><div class="account-tabs"><a href="#/account" class="${tab === "account" ? "active" : ""}">${icon("pin")} Profile & address</a><a href="#/orders" class="${tab === "orders" ? "active" : ""}">${icon("bag")} My orders</a></div>${tab === "account" ? `<div class="account-layout"><div class="panel"><div class="panel-heading"><h3>Delivery details</h3>${badge(user.address ? "Address saved" : "Address needed")}</div><p class="muted">An address is required before placing your order. Use sample details in this prototype.</p>${addressForm(user)}</div><aside class="account-card"><span class="avatar large">${esc(initials(user.name))}</span><h3>${esc(user.name)}</h3><p>${esc(user.login)}</p><span class="badge">Customer account</span><div class="info-note">${icon("shield")} Your address is visible in the customer and master portals. Investor reports show aggregate business data.</div></aside></div>` : `<div class="panel"><div class="panel-heading"><h3>Recent orders</h3><span class="muted">Your latest 20 orders</span></div>${orders.length ? `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Items</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${orders.map((o) => `<tr><td><strong>${o.number}</strong></td><td>${esc(o.items[0]?.name)}${o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</td><td>${when(o.date)}</td><td>${money(o.total)}</td><td>${badge(o.status)}</td><td>${btn("View order", "view-order", `data-id="${o.id}"`, "text-link")}</td></tr>`).join("")}</tbody></table></div>` : empty("Your first order is a click away", "Explore our collection to get started.", '<a class="btn" href="#/shop">Shop now</a>')}</div>`}</main>${footer(s)}`;
}
export function loginPage(role = "customer", ui = {}) {
  const investor = role === "investor",
    admin = role === "admin";
  ui = { ...ui, register: ui.register && role === "customer" };
  const title = admin
    ? "A clear view.\nComplete control."
    : investor
      ? "Your investment.\nA shared tomorrow."
      : "Goodness is\nbetter together.";
  const login = admin
      ? "SM-MASTER"
      : investor
        ? "SM-INV-1001"
        : "customer@saiyadna.demo",
    password = admin
      ? "Master123!"
      : investor
        ? "Investor123!"
        : "Customer123!";
  return `${demoStrip()}<main id="main" class="login-page"><section class="login-story"><a href="#/shop"><img src="assets/logo.webp" alt="Saiyadna Mart" class="brand-logo"></a><div><span class="eyebrow">${admin ? "MASTER WORKSPACE" : investor ? "SAIYADNA INVESTOR COMMUNITY" : "WELCOME TO SAIYADNA MART"}</span><h1>${title.replace(/\n/g, "<br>")}</h1><p>${admin ? "Bring your products, orders, investors and payouts together in one thoughtfully organised workspace." : investor ? "See how the business is growing, follow your returns, and manage your investment with clarity." : "A pantry full of favourites. A community with something good to share."}</p><div class="login-feature">${icon(admin ? "grid" : investor ? "chart" : "leaf")}<span>${admin ? "Every detail. One connected workspace." : investor ? "Business insights. Personal returns. Clear records." : "Thoughtful products. Simple shopping. Happy homes."}</span></div></div><span class="login-bottom">Good food. Shared growth.</span><div class="login-orbit"></div></section><section class="login-form-side"><a class="back-link" href="#/shop">${icon("left")} Back to the shop</a><div class="login-box"><div class="portal-tabs"><a href="#/login/customer" class="${role === "customer" ? "active" : ""}">Customer</a><a href="#/login/investor" class="${investor ? "active" : ""}">Investor</a><a href="#/login/admin" class="${admin ? "active" : ""}">Master</a></div><span class="login-icon">${icon(admin ? "shield" : investor ? "bank" : "user")}</span><h2>${ui.register && role === "customer" ? "Make yourself at home." : "Welcome back."}</h2><p class="muted">${ui.register && role === "customer" ? "Create a customer demo account." : `Sign in to your ${admin ? "master" : role} portal.`}</p><form data-form="${ui.register && role === "customer" ? "register" : "login"}" data-role="${role}">${ui.register && role === "customer" ? field("Your name", "name", "", "text", "required") : ""}${field(investor || admin ? "Unique account ID" : "Email address", "login", ui.register ? "" : login, role === "customer" ? "email" : "text", 'required autocomplete="username"')}${field("Password", "password", ui.register ? "" : password, "password", 'required minlength="8" autocomplete="current-password"')}<div class="form-feedback" role="alert"></div><button type="submit" class="btn full-width btn-lg">${ui.register ? "Create demo account" : "Sign in"} ${icon("arrow")}</button></form>${role === "customer" ? `<p class="login-switch">${ui.register ? "Already have an account?" : "New to Saiyadna Mart?"} ${btn(ui.register ? "Sign in" : "Create account", "toggle-register", "", "text-link")}</p>` : ""}<div class="demo-credentials"><span class="eyebrow">READY TO EXPLORE</span><p>Demo credentials are filled in for you.</p><code>${login}</code><span>Password: <code>${password}</code></span><small>Public demo access. Use sample information only.</small></div></div><span class="login-privacy">${icon("info")} This prototype saves changes in this browser.</span></section></main>`;
}

export const periodOptions = [
  ["today", "Today"],
  ["7d", "Last 7 days"],
  ["1", "This month"],
  ["2", "2 months"],
  ["3", "3 months"],
  ["4", "4 months"],
  ["5", "5 months"],
];
export function periodControl(period) {
  return `<div class="period-control">${icon("clock")}<select aria-label="Reporting period" data-period>${periodOptions.map(([v, l]) => `<option value="${v}" ${v === period ? "selected" : ""}>${l}</option>`).join("")}</select></div>`;
}
export function metric(label, value, detail, i = "chart", cls = "") {
  return `<article class="metric ${cls}"><div class="metric-label"><span>${label}</span>${icon(i)}</div><strong>${value}</strong><span class="metric-detail">${detail}</span></article>`;
}
export function chart(s, period, type = "sales") {
  const rows = series(s, period),
    w = 720,
    h = 220,
    pad = 24,
    vals = rows.flatMap((r) =>
      type === "traffic" ? [r.visitors] : [r.sales / 100, r.profit / 100],
    );
  const min = Math.min(0, ...vals),
    max = Math.max(1, ...vals),
    range = max - min;
  const y = (v) => h - pad - ((v - min) / range) * (h - pad * 2),
    x = (i) =>
      pad +
      (rows.length === 1
        ? (w - pad * 2) / 2
        : (i / (rows.length - 1)) * (w - pad * 2));
  const path = (key) =>
    rows
      .map(
        (r, i) =>
          `${i ? "L" : "M"}${x(i).toFixed(1)},${y(type === "traffic" ? r.visitors : r[key] / 100).toFixed(1)}`,
      )
      .join(" ");
  const area = (key) =>
    rows.length
      ? `${path(key)} L${x(rows.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
      : "";
  const grid = Array.from({ length: 4 }, (_, i) => {
    const v = min + (range * i) / 3;
    return `<line x1="${pad}" y1="${y(v)}" x2="${w - pad}" y2="${y(v)}" stroke="#e7ece9" stroke-dasharray="4 6"/>`;
  }).join("");
  const labels = rows.filter(
    (_, i) =>
      i === 0 ||
      i === rows.length - 1 ||
      i % Math.max(1, Math.ceil(rows.length / 5)) === 0,
  );
  return `<div class="chart-wrap"><div class="chart-axis"><span>${type === "traffic" ? num(Math.round(max)) : compact(max * 100)}</span><span>${type === "traffic" ? num(Math.round((max + min) / 2)) : compact((max + min) * 50)}</span><span>${type === "traffic" ? num(Math.round(min)) : compact(min * 100)}</span></div><div class="chart-main"><svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${type === "traffic" ? "Demo visitor activity" : "Net sales and net profit"} for selected period"><defs><linearGradient id="${type}-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7dac8d" stop-opacity=".25"/><stop offset="100%" stop-color="#7dac8d" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area("sales")}" fill="url(#${type}-fill)"/><path d="${path("sales")}" fill="none" stroke="#2c7154" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>${type === "sales" ? `<path d="${path("profit")}" fill="none" stroke="#d7aa60" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` : ""}${rows.length === 1 ? `<circle cx="${x(0)}" cy="${y(type === "traffic" ? rows[0].visitors : rows[0].sales / 100)}" r="5" fill="#2c7154"/>` : ""}</svg><div class="chart-labels">${labels.map((r) => `<span>${r.key.length === 7 ? new Date(r.key + "-01T12:00:00").toLocaleDateString("en", { month: "short" }) : new Date(r.key + "T12:00:00").toLocaleDateString("en", { day: "numeric", month: "short" })}</span>`).join("")}</div></div></div>`;
}
function portalShell(s, user, ui, route, content) {
  const admin = user.role === "admin",
    base = admin ? "admin" : "investor",
    section = route.split("/")[1] || "overview";
  const nav = admin
    ? [
        ["overview", "grid", "Overview"],
        ["orders", "bag", "Orders"],
        ["products", "box", "Products"],
        ["investors", "people", "Investors"],
        ["requests", "wallet", "Funds & payouts"],
        ["commissions", "tag", "Agent commissions"],
        ["reviews", "message", "Product reviews"],
        ["settings", "settings", "Store settings"],
        ["activity", "activity", "Activity log"],
      ]
    : [
        ["overview", "grid", "Overview"],
        ["portfolio", "bank", "My investment"],
        ["analytics", "chart", "Business insights"],
        ["withdrawals", "wallet", "Withdrawals"],
      ];
  const pending =
    s.investments.filter((x) => x.status === "Pending").length +
    s.withdrawals.filter((x) => x.status === "Pending").length;
  return `<div class="workspace ${ui.sidebar ? "sidebar-open" : ""}"><aside class="sidebar"><a class="sidebar-brand" href="#/shop"><img src="assets/logo.webp" alt="Saiyadna Mart"></a><div class="workspace-label"><span>${admin ? "MASTER WORKSPACE" : "INVESTOR PORTAL"}</span><b>${admin ? "ADMIN" : "PARTNER"}</b></div><nav aria-label="Portal navigation">${nav.map(([r, i, l]) => `<a href="#/${base}/${r}" class="side-link ${section === r ? "active" : ""}">${icon(i)}<span>${l}</span>${admin && r === "requests" && pending ? `<b class="nav-count">${pending}</b>` : ""}</a>`).join("")}</nav><div class="sidebar-bottom"><div class="workspace-help">${icon("leaf")}<strong>Good food.<br>Shared growth.</strong><span>A little better, together.</span><a href="#/shop">Visit the storefront ${icon("arrow")}</a></div><button class="side-link signout" data-action="logout">${icon("logout")}<span>Sign out</span></button><div class="sidebar-user"><span class="avatar">${esc(initials(user.name))}</span><div><b>${esc(user.name)}</b><span>${esc(user.login)}</span></div></div></div></aside>${ui.sidebar ? '<button class="sidebar-scrim" data-action="sidebar" aria-label="Close navigation"></button>' : ""}<div class="workspace-main"><header class="workspace-header"><div class="workspace-breadcrumb">${btn(icon("menu"), "sidebar", 'aria-label="Toggle navigation"', "icon-btn mobile-only")}<span>${admin ? "Master workspace" : "Investor portal"}</span>${icon("down")}<strong>${nav.find((x) => x[0] === section)?.[2] || "Overview"}</strong></div><div class="workspace-header-actions"><span class="live-pill"><i></i> Demo workspace</span>${btn(icon("bell"), "notifications", 'aria-label="View recent activity"', "icon-btn notification-btn")}<span class="avatar small">${esc(initials(user.name))}</span></div></header><div class="workspace-demo-note">${icon("info")} Sample business data. Changes sync between tabs in this browser. <button data-action="about-demo" class="text-link">How this demo works</button></div><main id="main" class="workspace-content">${content}</main><footer class="workspace-footer"><span>© ${new Date().getFullYear()} Saiyadna Mart · Interactive prototype</span><span>${icon("clock")} Times shown in Asia/Dhaka</span></footer></div></div>`;
}
const pageHeading = (eyebrow, title, subtitle, actions = "") =>
  `<div class="workspace-page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
function salesPanel(s, ui) {
  return `<section class="panel chart-panel"><div class="panel-heading"><div><h3>Business performance</h3><p class="muted">A clearer picture of how the business is growing</p></div><div class="chart-legend"><span><i class="green"></i> Net sales</span><span><i class="gold"></i> Net profit</span></div></div>${chart(s, ui.period)}<div class="chart-footnote">Sales are recognised on delivery. Net profit deducts product costs, agent commissions and operating expenses.</div></section>`;
}
function trafficPanel(s, ui) {
  const m = stats(s, ui.period),
    rows = series(s, ui.period).slice(-16),
    peak = Math.max(1, ...rows.map((x) => x.visitors));
  return `<section class="panel traffic-panel"><div class="panel-heading"><h3>Storefront traffic</h3><span class="badge">Sample + local visits</span></div><div class="traffic-big">${num(m.visitors)}<span>visitors in this period</span></div><div class="traffic-stat"><span>Page views</span><strong>${num(m.pageviews)}</strong></div><div class="traffic-stat"><span>Delivered orders / visitors</span><strong>${m.conversion.toFixed(1)}%</strong></div><div class="traffic-bars">${rows.map((x) => `<span style="height:${Math.max(6, Math.min(100, (x.visitors / peak) * 100))}%" title="${x.key}: ${x.visitors} visitors"></span>`).join("")}</div><p class="tiny muted">Seeded traffic is illustrative. New storefront page views are recorded locally.</p></section>`;
}
function ledgerTable(s, user, period, limit = 12) {
  const entries = s.profitEntries
    .filter(
      (x) =>
        inPeriod(x.date, period) &&
        x.allocations.some((a) => a.userId === user.id),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  return entries.length
    ? `<div class="table-wrap"><table><thead><tr><th>Reference</th><th>Date</th><th>Type</th><th>Your allocation</th></tr></thead><tbody>${entries.map((x) => `<tr><td><strong>${esc(x.label)}</strong></td><td>${when(x.date)}</td><td>${badge(x.netProfit < 0 ? "Adjustment" : "Profit credit")}</td><td class="${x.netProfit >= 0 ? "text-green" : "text-red"}"><strong>${x.netProfit >= 0 ? "+" : ""}${money(x.allocations.find((a) => a.userId === user.id).amount)}</strong></td></tr>`).join("")}</tbody></table></div>`
    : empty(
        "No returns in this period",
        "Select another period to explore your investment history.",
      );
}
function investorOverview(s, user, ui) {
  const m = stats(s, ui.period),
    w = wallet(s, user.id),
    ownReturn = s.profitEntries
      .filter((x) => inPeriod(x.date, ui.period))
      .reduce(
        (a, x) =>
          a + (x.allocations.find((v) => v.userId === user.id)?.amount || 0),
        0,
      );
  const totalCapital = s.users
      .filter((x) => x.role === "investor" && x.active)
      .reduce((a, x) => a + capital(s, x.id), 0),
    share = totalCapital ? (w.invested / totalCapital) * 100 : 0;
  return `${pageHeading("YOUR GROWTH, AT A GLANCE", `Good to see you, ${esc(user.name.split(" ")[0])}.`, "Here’s how your investment and the business are doing.", `${periodControl(ui.period)}${btn(`${icon("download")} Export report`, "export-report", "", "btn btn-outline")}`)}<div class="metrics-grid">${metric("Net sales", money(m.netSales), "Delivered sales, after discounts", "bag")}${metric("Net profit", money(m.netProfit), "After costs, commissions & expenses", "chart")}${metric("My returns", money(ownReturn), "Your allocations in this period", "coin")}${metric("Store visitors", num(m.visitors), "Sample data + visits in this browser", "globe")}</div><div class="dashboard-two-col">${salesPanel(s, ui)}<aside class="investment-card"><div class="investment-card-top"><span>YOUR INVESTMENT</span>${icon("bank")}</div><strong>${money(w.invested)}</strong><p>Active capital in the business</p><div class="investment-card-divider"></div><div class="investment-card-row"><span>Your share of capital</span><b>${share.toFixed(1)}%</b></div><div class="investment-card-row"><span>Available returns</span><b>${money(w.profitAvailable)}</b></div><div class="investment-card-row"><span>Pending withdrawal</span><b>${money(w.reserved)}</b></div>${btn(`Add investment ${icon("plus")}`, "invest", "", "btn btn-cream full-width")}${btn("Request a withdrawal", "withdraw", "", "investment-text-button")}<small>Demo allocation: ${s.settings.investorPoolPct}% of net profit is shared by active capital. Returns are variable.</small></aside></div><div class="dashboard-two-col"><section class="panel"><div class="panel-heading"><div><h3>Your return activity</h3><p class="muted">Latest allocations in the selected period</p></div><a href="#/investor/portfolio" class="text-link">View all ${icon("arrow")}</a></div>${ledgerTable(s, user, ui.period, 5)}</section>${trafficPanel(s, ui)}</div>`;
}
function investorPortfolio(s, user, ui) {
  const w = wallet(s, user.id),
    deposits = s.investments.filter((x) => x.userId === user.id);
  return `${pageHeading("YOUR CAPITAL, YOUR CLARITY", "My investment", "Follow your contributions and the returns they generate.", `${periodControl(ui.period)}${btn(`${icon("plus")} Add investment`, "invest")}`)}<div class="metrics-grid three">${metric("Active capital", money(w.invested), "Approved contributions less capital paid out", "bank")}${metric("Lifetime returns", money(w.earned), "Net of expense and refund adjustments", "chart")}${metric("Available profit", money(w.profitAvailable), "After paid and pending withdrawals", "wallet")}</div><section class="panel"><div class="panel-heading"><h3>Investment history</h3><span class="badge">${deposits.length} contributions</span></div><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>${deposits.map((x) => `<tr><td><strong>${esc(x.reference)}</strong></td><td>${when(x.date)}</td><td>${esc(x.method)}</td><td>${money(x.amount)}</td><td>${badge(x.status)}</td></tr>`).join("")}</tbody></table></div></section><section class="panel section-gap"><div class="panel-heading"><div><h3>Return ledger</h3><p class="muted">The latest 30 entries in the selected period</p></div>${btn(`${icon("download")} Export`, "export-ledger", "", "btn btn-outline btn-sm")}</div>${ledgerTable(s, user, ui.period, 30)}</section><div class="info-note">${icon("info")} New contributions and allocation-rate changes affect future events only. Existing allocations keep their original values.</div>`;
}
function investorWithdrawals(s, user, ui) {
  const w = wallet(s, user.id),
    rows = s.withdrawals.filter((x) => x.userId === user.id);
  return `${pageHeading("YOUR MONEY, CLEARLY TRACKED", "Withdrawals", "Request a payout and follow its review status.", btn(`${icon("plus")} Request withdrawal`, "withdraw"))}<div class="metrics-grid three">${metric("Available profit", money(w.profitAvailable), "Ready to request", "wallet")}${metric("Pending profit payouts", money(w.reserved), "Reserved while the master reviews", "clock")}${metric("Total paid out", money(w.paid), "Demo profit & capital transfers", "check")}</div><section class="panel"><div class="panel-heading"><h3>Payout history</h3><span class="badge">Manual approval</span></div>${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Payout method</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${when(x.date)}</td><td>${esc(x.kind === "profit" ? "Profit return" : "Capital withdrawal")}</td><td>${esc(x.method)}<small class="table-sub">${esc(x.account)}</small></td><td><strong>${money(x.amount)}</strong></td><td>${badge(x.status)}</td><td>${esc(x.reference || "Awaiting review")}</td></tr>`).join("")}</tbody></table></div>` : empty("No withdrawal requests yet", "Your requests and their status will appear here.")}</section><div class="process-strip"><div><span>01</span><b>Request a payout</b><p>Choose profit or available capital.</p></div><div><span>02</span><b>Master reviews</b><p>Your requested amount is reserved.</p></div><div><span>03</span><b>Track the outcome</b><p>A transfer reference appears when marked paid.</p></div></div><div class="info-note">${icon("info")} Prototype transfers are simulated. A capital withdrawal reduces your participation in future profit allocations.</div>`;
}
function analytics(s, user, ui) {
  const m = stats(s, ui.period),
    rows = series(s, ui.period),
    profit = user.role === "investor" ? wallet(s, user.id).earned : null;
  return `${pageHeading("UNDERSTAND THE BIGGER PICTURE", "Business insights", "Sales, profit and storefront activity in one clear view.", `${periodControl(ui.period)}${btn(`${icon("download")} Export report`, "export-report", "", "btn btn-outline")}`)}<div class="metrics-grid">${metric("Net sales", money(m.netSales), "Delivered revenue minus refunds", "bag")}${metric("Gross profit", money(m.grossProfit), "Net sales less product costs", "chart")}${metric("Net profit", money(m.netProfit), "Gross profit less commissions & expenses", "coin")}${metric("Delivered orders", num(m.orders), "Net of refunds in this period", "box")}</div>${salesPanel(s, ui)}<div class="dashboard-two-col section-gap"><section class="panel"><div class="panel-heading"><h3>Profit breakdown</h3><span class="badge">${periodOptions.find((x) => x[0] === ui.period)?.[1]}</span></div><div class="breakdown"><div><span>Net sales</span><strong>${money(m.netSales)}</strong></div><div><span>Product costs</span><strong>−${money(m.cogs)}</strong></div><div><span>Agent commissions</span><strong>−${money(m.commissions)}</strong></div><div><span>Operating expenses</span><strong>−${money(m.expenses)}</strong></div><div class="breakdown-total"><span>Net profit</span><strong>${money(m.netProfit)}</strong></div></div></section><section class="panel"><div class="panel-heading"><h3>Visitor trend</h3><span class="badge">Sample + local</span></div>${chart(s, ui.period, "traffic")}</section></div><section class="panel section-gap"><div class="panel-heading"><h3>Period details</h3><span class="muted">${rows.length} reporting intervals</span></div><div class="table-wrap"><table><thead><tr><th>Period</th><th>Net sales</th><th>Net profit</th><th>Visitors</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.key}</td><td>${money(r.sales)}</td><td>${money(r.profit)}</td><td>${num(r.visitors)}</td></tr>`).join("")}</tbody></table></div></section>`;
}
export function investorPage(s, user, ui, route) {
  const section = route.split("/")[1] || "overview",
    content =
      section === "portfolio"
        ? investorPortfolio(s, user, ui)
        : section === "withdrawals"
          ? investorWithdrawals(s, user, ui)
          : section === "analytics"
            ? analytics(s, user, ui)
            : investorOverview(s, user, ui);
  return portalShell(s, user, ui, route, content);
}

const orderTable = (orders, admin = false) =>
  `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer / items</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>${orders.map((o) => `<tr><td><strong>${o.number}</strong><small class="table-sub">${esc(o.payment)}</small></td><td><strong>${esc(o.address?.name || "Sample customer")}</strong><small class="table-sub">${esc(o.items[0]?.name)}${o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</small></td><td>${when(o.date)}</td><td><strong>${money(o.total)}</strong></td><td>${badge(o.status)}</td><td>${btn("Manage", "view-order", `data-id="${o.id}"`, "text-link")}</td></tr>`).join("")}</tbody></table></div>`;
function adminOverview(s, user, ui) {
  const m = stats(s, ui.period),
    pendingInv = s.investments.filter((x) => x.status === "Pending"),
    pendingWd = s.withdrawals.filter((x) => x.status === "Pending"),
    stock = s.products
      .filter((x) => x.active)
      .flatMap((p) =>
        p.variants.filter((v) => v.stock < 10).map((v) => ({ p, v })),
      );
  return `${pageHeading("YOUR BUSINESS, CONNECTED", "Everything in view.", "A calm place to keep the whole business moving.", `${periodControl(ui.period)}${btn(`${icon("plus")} Add product`, "product-editor")}`)}<div class="metrics-grid">${metric("Net sales", money(m.netSales), `${m.orders} delivered orders in this period`, "bag")}${metric("Net profit", money(m.netProfit), "After product costs & operating expenses", "chart")}${metric("Open orders", num(m.pending), "Pending, processing or on the way", "box")}${metric("Visitors", num(m.visitors), "Sample data + local storefront visitors", "globe")}</div><div class="dashboard-two-col">${salesPanel(s, ui)}<section class="panel action-panel"><div class="panel-heading"><h3>Needs your attention</h3><span class="notification-dot"></span></div><a href="#/admin/requests" class="attention-item"><span class="attention-icon gold">${icon("wallet")}</span><div><strong>${pendingWd.length} payout request${pendingWd.length === 1 ? "" : "s"}</strong><span>${money(pendingWd.reduce((a, x) => a + x.amount, 0))} awaiting review</span></div>${icon("arrow")}</a><a href="#/admin/requests" class="attention-item"><span class="attention-icon green">${icon("bank")}</span><div><strong>${pendingInv.length} investment request${pendingInv.length === 1 ? "" : "s"}</strong><span>Confirm received demo contributions</span></div>${icon("arrow")}</a><a href="#/admin/orders" class="attention-item"><span class="attention-icon cream">${icon("bag")}</span><div><strong>${m.pending} open orders</strong><span>Help the next delivery on its way</span></div>${icon("arrow")}</a><div class="attention-footer">${icon("shield")} Every approval is recorded in the activity log.</div></section></div><section class="panel section-gap"><div class="panel-heading"><div><h3>Latest orders</h3><p class="muted">The latest activity from your storefront</p></div><a class="text-link" href="#/admin/orders">All orders ${icon("arrow")}</a></div>${orderTable(s.orders.slice(0, 6), true)}</section><div class="dashboard-two-col section-gap">${trafficPanel(s, ui)}<section class="panel"><div class="panel-heading"><h3>Operations</h3>${btn(`${icon("plus")} Record expense`, "expense", "", "btn btn-outline btn-sm")}</div><div class="breakdown"><div><span>Operating expenses · selected period</span><strong>${money(m.expenses)}</strong></div><div><span>Active products</span><strong>${s.products.filter((x) => x.active).length}</strong></div><div><span>Low-stock variants</span><strong>${stock.length}</strong></div><div><span>Investor profit pool</span><strong>${s.settings.investorPoolPct}%</strong></div></div><div class="panel-note">Investor allocations use the capital and rate at the time each profit or expense event is recorded.</div></section></div>`;
}
function adminOrders(s, user, ui) {
  const filtered = s.orders.filter(
      (o) =>
        (ui.orderFilter === "All" || o.status === ui.orderFilter) &&
        (!ui.tableSearch ||
          `${o.number} ${o.address?.name}`
            .toLowerCase()
            .includes(ui.tableSearch.toLowerCase())),
    ),
    pages = Math.max(1, Math.ceil(filtered.length / 15)),
    page = Math.min(ui.page, pages),
    rows = filtered.slice((page - 1) * 15, page * 15);
  return `${pageHeading("FROM CHECKOUT TO DOORSTEP", "Orders", "Track, fulfil and manage every customer order.", btn(`${icon("download")} Export orders`, "export-orders", "", "btn btn-outline"))}<section class="panel"><div class="table-toolbar"><div class="filter-tabs">${["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"].map((x) => btn(x, "order-filter", `data-filter="${x}"`, ui.orderFilter === x ? "filter-tab active" : "filter-tab")).join("")}</div><form data-form="table-search" class="table-search">${icon("search")}<input name="search" value="${esc(ui.tableSearch)}" placeholder="Order or customer" aria-label="Search orders"><button aria-label="Search" class="icon-btn">${icon("arrow")}</button></form></div>${rows.length ? orderTable(rows, true) : empty("No orders to show", "Try another status or search term.")}<div class="pagination"><span>${filtered.length} orders · Page ${page} of ${pages}</span><div>${btn(icon("left"), "page", `data-page="${Math.max(1, page - 1)}" ${page === 1 ? "disabled" : ""} aria-label="Previous page"`, "icon-btn")}${btn(icon("arrow"), "page", `data-page="${Math.min(pages, page + 1)}" ${page === pages ? "disabled" : ""} aria-label="Next page"`, "icon-btn")}</div></div></section>`;
}
function adminProducts(s, user, ui) {
  const rows = s.products.filter(
    (p) =>
      !ui.tableSearch ||
      `${p.name} ${p.category}`
        .toLowerCase()
        .includes(ui.tableSearch.toLowerCase()),
  );
  return `${pageHeading("THOUGHTFULLY CURATED", "Products", "Keep your catalogue, prices and inventory in good shape.", btn(`${icon("plus")} Add product`, "product-editor"))}<section class="panel"><div class="table-toolbar"><div><strong>${s.products.filter((x) => x.active).length} active products</strong><span class="muted"> · ${s.products.length} total</span></div><form data-form="table-search" class="table-search">${icon("search")}<input name="search" placeholder="Search the catalogue" aria-label="Search catalogue" value="${esc(ui.tableSearch)}"><button aria-label="Search" class="icon-btn">${icon("arrow")}</button></form></div><div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Pack / price</th><th>Total stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map((p) => `<tr><td><div class="table-product"><img src="${esc(p.image)}" alt=""><div><strong>${esc(p.name)}</strong><small>${p.variants.length} pack option${p.variants.length === 1 ? "" : "s"}</small></div></div></td><td>${esc(p.category)}</td><td>${esc(p.variants[0].label)}<small class="table-sub">${money(p.variants[0].price)}</small></td><td>${p.variants.reduce((a, v) => a + v.stock, 0)} units</td><td>${badge(p.active ? "Active" : "Archived")}</td><td><div class="table-actions">${btn(icon("edit"), "product-editor", `data-id="${p.id}" aria-label="Edit ${esc(p.name)}"`, "icon-btn")}${btn(icon(p.active ? "trash" : "refresh"), "toggle-product", `data-id="${p.id}" aria-label="${p.active ? "Archive" : "Restore"} ${esc(p.name)}"`, "icon-btn")}</div></td></tr>`).join("")}</tbody></table></div>${rows.length ? "" : empty("No matching products", "Try another name or category.")}</section>`;
}
function adminInvestors(s, user, ui) {
  const people = s.users.filter((x) => x.role === "investor"),
    total = people.reduce((a, x) => a + capital(s, x.id), 0);
  return `${pageHeading("A COMMUNITY THAT GROWS TOGETHER", "Investors", "Manage accounts, contributions and investment participation.", btn(`${icon("plus")} Add investor`, "investor-editor"))}<div class="metrics-grid three">${metric("Active investor capital", money(people.filter((x) => x.active).reduce((a, x) => a + capital(s, x.id), 0)), "Approved capital in participating accounts", "bank")}${metric("Investor accounts", num(people.length), `${people.filter((x) => x.active).length} active accounts`, "people")}${metric("Profit allocation pool", `${s.settings.investorPoolPct}%`, "Demo share of net profit, split by capital", "chart")}</div><section class="panel"><div class="panel-heading"><h3>Investor directory</h3><span class="muted">Unique IDs for every account</span></div><div class="table-wrap"><table><thead><tr><th>Investor</th><th>Account ID</th><th>Capital</th><th>Lifetime returns</th><th>Status</th><th></th></tr></thead><tbody>${people.map((p) => `<tr><td><div class="person-cell"><span class="avatar small">${esc(initials(p.name))}</span><strong>${esc(p.name)}</strong></div></td><td><code>${esc(p.login)}</code></td><td>${money(capital(s, p.id))}</td><td>${money(earnings(s, p.id))}</td><td>${badge(p.active ? "Active" : "Inactive")}</td><td>${btn("Manage account", "investor-editor", `data-id="${p.id}"`, "text-link")}</td></tr>`).join("")}</tbody></table></div></section><div class="info-note">${icon("info")} Inactive accounts cannot sign in and are excluded from future profit allocations. Existing capital and history remain recorded.</div>`;
}
function adminRequests(s, user, ui) {
  const investments = s.investments,
    withdrawals = s.withdrawals;
  return `${pageHeading("EVERY MOVEMENT, ACCOUNTED FOR", "Funds & payouts", "Review investment contributions and withdrawal requests.")}<div class="metrics-grid three">${metric("Pending investments", money(investments.filter((x) => x.status === "Pending").reduce((a, x) => a + x.amount, 0)), "Waiting for master confirmation", "bank")}${metric("Pending withdrawals", money(withdrawals.filter((x) => x.status === "Pending").reduce((a, x) => a + x.amount, 0)), "Reserved in investor accounts", "wallet")}${metric("Paid withdrawals", money(withdrawals.filter((x) => x.status === "Paid").reduce((a, x) => a + x.amount, 0)), "Demo transfers recorded", "check")}</div><section class="panel"><div class="panel-heading"><h3>Withdrawal requests</h3><span class="badge">Manual payout</span></div><div class="table-wrap"><table><thead><tr><th>Investor</th><th>Type / date</th><th>Payout details</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead><tbody>${withdrawals.map((x) => `<tr><td><strong>${esc(s.users.find((u) => u.id === x.userId)?.name)}</strong></td><td>${esc(x.kind)}<small class="table-sub">${when(x.date)}</small></td><td>${esc(x.method)}<small class="table-sub">${esc(x.account)}</small></td><td><strong>${money(x.amount)}</strong></td><td>${badge(x.status)}</td><td>${x.status === "Pending" ? `<div class="table-actions">${btn("Mark paid", "payout", `data-id="${x.id}"`, "btn btn-sm")}${btn("Reject", "reject-withdrawal", `data-id="${x.id}"`, "btn btn-ghost btn-sm")}</div>` : esc(x.reference || "Reviewed")}</td></tr>`).join("")}</tbody></table></div></section><section class="panel section-gap"><div class="panel-heading"><h3>Investment contributions</h3><span class="badge">Confirm receipt</span></div><div class="table-wrap"><table><thead><tr><th>Investor</th><th>Date</th><th>Method / reference</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead><tbody>${investments.map((x) => `<tr><td><strong>${esc(s.users.find((u) => u.id === x.userId)?.name)}</strong></td><td>${when(x.date)}</td><td>${esc(x.method)}<small class="table-sub">${esc(x.reference)}</small></td><td><strong>${money(x.amount)}</strong></td><td>${badge(x.status)}</td><td>${x.status === "Pending" ? `<div class="table-actions">${btn("Approve", "approve-investment", `data-id="${x.id}"`, "btn btn-sm")}${btn("Reject", "reject-investment", `data-id="${x.id}"`, "btn btn-ghost btn-sm")}</div>` : "Recorded"}</td></tr>`).join("")}</tbody></table></div></section>`;
}
function adminCommissions(s, user, ui) {
  const orders = s.orders
      .filter((o) => o.partnerId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    ready = orders.filter((o) => commissionState(s, o) === "Ready"),
    paid = s.commissionPayouts.filter((x) => x.status === "Paid"),
    partner = s.partners[0];
  return `${pageHeading("PARTNERSHIP, WITH CLARITY", "Agent commissions", "Coupon-attributed commissions, kept separate from investor returns.")}<div class="metrics-grid three">${metric("Partner commission rate", `${partner.rate}%`, "Guide reference: 29% · configurable", "tag")}${metric("Ready for payout", money(ready.reduce((a, o) => a + o.commission, 0)), `${ready.length} delivered orders past the hold`, "wallet")}${metric("Holding period", `${s.settings.commissionHoldDays} days`, "After payment; delivery is also required", "clock")}</div><section class="panel"><div class="panel-heading"><div><h3>Partner programme</h3><p class="muted">Commission applies only when this coupon is used.</p></div><span class="badge">Manual weekly payout workflow</span></div><form data-form="partner" class="form-grid panel-form">${field("Partner name", "name", partner.name, "text", "required")}${field("Referral coupon", "code", partner.code, "text", "required")}${field("Commission % of net product sales", "rate", partner.rate, "number", 'required min="0" max="100" step="0.1"')}${field("Customer coupon discount %", "discountPct", partner.discountPct, "number", 'required min="0" max="90" step="0.1"')}<div class="span-2"><label class="checkbox"><input type="checkbox" name="active" ${partner.active ? "checked" : ""}> Partner coupon is active</label><button class="btn" type="submit">Save partner settings</button></div></form></section><section class="panel section-gap"><div class="panel-heading"><h3>Attributed orders</h3><span class="muted">Latest 25 of ${orders.length}</span></div><div class="table-wrap"><table><thead><tr><th>Order</th><th>Order status</th><th>Payment date</th><th>Commission</th><th>Payout status</th><th></th></tr></thead><tbody>${orders
    .slice(0, 25)
    .map((o) => {
      const status = commissionState(s, o);
      return `<tr><td><strong>${o.number}</strong><small class="table-sub">${esc(o.coupon)}</small></td><td>${badge(o.status)}</td><td>${o.paidAt ? when(o.paidAt) : "Awaiting payment"}</td><td>${money(o.commission)}<small class="table-sub">${o.commissionRate}% at purchase</small></td><td>${badge(status)}</td><td>${status === "Ready" ? btn("Mark paid", "commission-payout", `data-id="${o.id}"`, "btn btn-outline btn-sm") : "—"}</td></tr>`;
    })
    .join(
      "",
    )}</tbody></table></div></section><div class="info-note">${icon("info")} Guide mapping: coupon + payment + delivered order + ${s.settings.commissionHoldDays}-day hold + master review. Cancelled/refunded orders lose eligibility; previously paid commissions are flagged for recovery.</div>`;
}
function adminReviews(s, user, ui) {
  return `${pageHeading("LISTEN TO YOUR COMMUNITY", "Product reviews", "Approve thoughtful feedback and manage public product ratings.")}<section class="panel"><div class="panel-heading"><h3>Review moderation</h3><span class="badge">${s.reviews.filter((r) => r.status === "Pending").length} awaiting review</span></div><div class="review-moderation">${[
    ...s.reviews,
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (r) =>
        `<article><div class="review-top"><span class="avatar small">${esc(initials(r.name))}</span><div><b>${esc(r.name)}</b><small>${esc(s.products.find((p) => p.id === r.productId)?.name)} · ${when(r.date)}${r.sample ? " · Sample" : ""}</small></div><span class="rating">${icon("star")} ${r.rating}</span>${badge(r.status)}</div><p>${esc(r.text)}</p><div class="table-actions">${r.status !== "Approved" ? btn("Approve", "moderate-review", `data-id="${r.id}" data-status="Approved"`, "btn btn-sm") : ""}${r.status !== "Hidden" ? btn("Hide", "moderate-review", `data-id="${r.id}" data-status="Hidden"`, "btn btn-outline btn-sm") : ""}${btn("Delete", "delete-review", `data-id="${r.id}"`, "text-link text-red")}</div></article>`,
    )
    .join("")}</div></section>`;
}
function adminSettings(s, user, ui) {
  const x = s.settings;
  return `${pageHeading("THE DETAILS THAT MAKE IT YOURS", "Store settings", "Control the storefront, delivery rules and future profit allocation.")}<form data-form="settings"><section class="panel"><div class="panel-heading"><h3>Brand & storefront</h3>${badge(x.storeOpen ? "Store open" : "Orders paused")}</div><div class="form-grid panel-form">${field("Store name", "storeName", x.storeName, "text", 'required maxlength="60"')}${field("Tagline", "tagline", x.tagline, "text", 'required maxlength="100"')}${select("Homepage combo offer", "featuredCombo", [["", "Hide combo banner"], ...s.products.filter((p) => p.active && p.category === "Combos").map((p) => [p.id, p.name])], x.featuredCombo ?? "essentials")}<label class="field"><span>Homepage headline</span><textarea name="heroTitle" required maxlength="140">${esc(x.heroTitle)}</textarea></label><label class="field"><span>Homepage description</span><textarea name="heroSubtitle" required maxlength="300">${esc(x.heroSubtitle)}</textarea></label><label class="checkbox span-2"><input type="checkbox" name="storeOpen" ${x.storeOpen ? "checked" : ""}> Accept new demo orders</label></div></section><section class="panel section-gap"><div class="panel-heading"><h3>Delivery & promotions</h3></div><div class="form-grid panel-form">${field("Free delivery from (৳, after discount)", "freeDelivery", x.freeDelivery / 100, "number", 'min="0" required step="0.01"')}${field("Dhaka delivery (৳)", "deliveryDhaka", x.deliveryDhaka / 100, "number", 'min="0" required step="0.01"')}${field("Other areas delivery (৳)", "deliveryOutside", x.deliveryOutside / 100, "number", 'min="0" required step="0.01"')}${field("Store coupon code", "couponCode", x.couponCode, "text", 'required pattern="[A-Za-z0-9_-]+"')}${field("Coupon discount %", "couponPct", x.couponPct, "number", 'min="0" max="90" required step="0.1"')}${field("Maximum coupon discount (৳)", "couponCap", x.couponCap / 100, "number", 'min="0" required step="0.01"')}</div></section><section class="panel section-gap"><div class="panel-heading"><h3>Profit & commission rules</h3><span class="badge">Prospective changes</span></div><div class="form-grid panel-form">${field("Investor pool % of net profit", "investorPoolPct", x.investorPoolPct, "number", 'min="0" max="100" required step="0.1"')}${field("Agent commission hold (days)", "commissionHoldDays", x.commissionHoldDays, "number", 'min="0" max="365" required step="1"')}<p class="form-hint span-2">Investor profit-sharing is an illustrative model, not a promised return. The pool is allocated by active capital when a profit/expense event occurs. Existing allocations and order commission rates are preserved. Investor payouts require master review; the agent hold applies only to agent commissions.</p></div></section><div class="settings-actions"><button type="submit" class="btn btn-lg">${icon("check")} Save all settings</button><span class="muted">Changes appear across the demo portals.</span></div></form><section class="panel section-gap"><div class="panel-heading"><div><h3>Demo workspace</h3><p class="muted">Start the presentation again with fresh sample data.</p></div>${btn(`${icon("refresh")} Reset demo data`, "reset-demo", "", "btn btn-outline")}</div></section>`;
}
function adminActivity(s, user, ui) {
  return `${pageHeading("A CLEAR RECORD OF EVERY CHANGE", "Activity log", "Follow orders, approvals and changes across the workspace.")}<section class="panel activity-panel">${s.activity.map((x) => `<div class="activity-entry"><span class="activity-icon">${icon("activity")}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p><small>${esc(x.actor)} · ${when(x.at)} · ${new Date(x.at).toLocaleTimeString("en", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" })}</small></div></div>`).join("")}</section>`;
}
export function adminPage(s, user, ui, route) {
  const section = route.split("/")[1] || "overview";
  const views = {
    overview: adminOverview,
    orders: adminOrders,
    products: adminProducts,
    investors: adminInvestors,
    requests: adminRequests,
    commissions: adminCommissions,
    reviews: adminReviews,
    settings: adminSettings,
    activity: adminActivity,
  };
  return portalShell(
    s,
    user,
    ui,
    route,
    (views[section] || adminOverview)(s, user, ui),
  );
}
