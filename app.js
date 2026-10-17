import * as D from "./domain.js";
import * as Store from "./store.js";
import * as V from "./views.js";
const app = document.getElementById("app"),
  modalRoot = document.getElementById("modal-root"),
  toastRoot = document.getElementById("toast-root");
export const ui = {
  category: "All",
  search: "",
  sort: "featured",
  variants: {},
  coupon: "",
  period: "1",
  sidebar: false,
  orderFilter: "All",
  tableSearch: "",
  page: 1,
  register: false,
};
let returnRoute = null,
  autoCheckout = false,
  pendingConfirm = null,
  restoreFocus = null,
  toastTimer = null,
  rendering = false;
const { esc, money, icon, field, select, btn, badge, when } = V;
const cities = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Khulna",
  "Rajshahi",
  "Barishal",
  "Rangpur",
  "Mymensingh",
  "Gazipur",
  "Narayanganj",
  "Cumilla",
  "Other",
];
const payoutMethods = ["bKash", "Nagad", "Rocket", "Bank transfer"];
const route = () =>
  location.hash.startsWith("#/") ? location.hash.slice(2) : "shop";
const navigate = (r) => {
  if (route() === r) render();
  else location.hash = `/${r}`;
};
export function toast(message, error = false) {
  clearTimeout(toastTimer);
  toastRoot.innerHTML = `<div class="toast ${error ? "error" : ""}" role="status">${icon(error ? "info" : "check")}<span>${esc(message)}</span></div>`;
  toastTimer = setTimeout(() => {
    toastRoot.innerHTML = "";
  }, 4200);
}
export function render() {
  if (rendering) return;
  rendering = true;
  try {
    const s = Store.load(),
      user = Store.currentUser(s),
      r = route(),
      cart = Store.getCart();
    let html = "";
    if (r.startsWith("login/")) {
      const role = r.split("/")[1];
      html = V.loginPage(
        ["customer", "investor", "admin"].includes(role) ? role : "customer",
        ui,
      );
    } else if (r.startsWith("admin"))
      html =
        user?.role === "admin"
          ? V.adminPage(s, user, ui, r)
          : V.loginPage("admin", ui);
    else if (r.startsWith("investor"))
      html =
        user?.role === "investor"
          ? V.investorPage(s, user, ui, r)
          : V.loginPage("investor", ui);
    else if (r === "account" || r === "orders")
      html =
        user?.role === "customer"
          ? V.customerPage(s, user, ui, cart, r)
          : V.loginPage("customer", ui);
    else if (r.startsWith("product/"))
      html = V.productPage(s, user, ui, cart, r.split("/")[1]);
    else if (r === "cart") html = V.cartPage(s, user, ui, cart);
    else html = V.storefront(s, user, ui, cart, r === "combos");
    app.innerHTML = html;
    document.title = `Saiyadna Mart · ${r.startsWith("admin") ? "Master workspace" : r.startsWith("investor") ? "Investor portal" : "Good food. Shared growth."}`;
  } catch (e) {
    console.error(e);
    app.innerHTML = `<main class="fatal-error"><h1>Let’s get you back on track.</h1><p>${esc(e.message)}</p><button data-action="reset-demo" class="btn">Reset the demo workspace</button></main>`;
  } finally {
    rendering = false;
  }
}
export function closeModal() {
  modalRoot.innerHTML = "";
  document.body.classList.remove("modal-open");
  if (restoreFocus?.isConnected) restoreFocus.focus();
  restoreFocus = null;
}
function modal(title, subtitle, body, wide = false) {
  restoreFocus = document.activeElement;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-backdrop><section class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><header class="modal-header"><div><h2 id="modal-title">${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>${btn(icon("close"), "close-modal", 'aria-label="Close dialog"', "icon-btn")}</header><div class="modal-body">${body}</div></section></div>`;
  document.body.classList.add("modal-open");
  setTimeout(
    () =>
      modalRoot
        .querySelector("input:not([type=hidden]),select,textarea,button")
        ?.focus(),
    10,
  );
}
function confirmAction(title, message, action, label = "Confirm") {
  pendingConfirm = action;
  modal(
    title,
    "",
    `<p class="confirm-message">${esc(message)}</p><div class="modal-actions">${btn("Go back", "close-modal", "", "btn btn-outline")}${btn(label, "confirm", "", "btn")}</div>`,
  );
}
const activeUser = (s) => Store.currentUser(s);
function adminMutation(fn) {
  return Store.transact((s) => {
    const a = activeUser(s);
    D.requireRole(a, ["admin"]);
    return fn(s, a);
  });
}
function investorMutation(fn) {
  return Store.transact((s) => {
    const u = activeUser(s);
    D.requireRole(u, ["investor"]);
    return fn(s, u);
  });
}
function failure(form, e) {
  const el = form?.querySelector(".form-feedback");
  if (el) {
    el.className = "form-feedback form-error";
    el.textContent = e.message;
  } else toast(e.message, true);
}
function formEnd(label = "Save changes") {
  return `<div class="form-feedback" role="alert"></div><div class="modal-actions"><button type="button" data-action="close-modal" class="btn btn-outline">Cancel</button><button class="btn" type="submit">${label} ${icon("arrow")}</button></div>`;
}
function addToCart(id, variantId) {
  const s = Store.load(),
    p = s.products.find((p) => p.id === id && p.active),
    v = p?.variants.find((v) => v.id === variantId);
  if (!p || !v) throw new Error("This product is not available.");
  const cart = Store.getCart(),
    item = cart.find((x) => x.productId === id && x.variantId === variantId),
    qty = (item?.quantity || 0) + 1;
  if (qty > v.stock || qty > 99)
    throw new Error("That quantity is not available.");
  if (item) item.quantity = qty;
  else cart.push({ productId: id, variantId, quantity: 1 });
  Store.setCart(cart);
  return p;
}
function checkout() {
  const s = Store.load(),
    u = Store.currentUser(s);
  if (u?.role !== "customer") {
    returnRoute = "cart";
    autoCheckout = true;
    navigate("login/customer");
    toast("Sign in to continue with your order.");
    return;
  }
  const a = u.address || { name: u.name, phone: "", city: "Dhaka", street: "" };
  let q;
  try {
    q = D.quote(s, Store.getCart(), a, ui.coupon);
  } catch (e) {
    toast(e.message, true);
    navigate("cart");
    return;
  }
  modal(
    "A little goodness, on its way.",
    "Confirm your delivery details and place a demo order.",
    `<form data-form="checkout" data-request-id="${D.uid("checkout")}"><div class="checkout-mini-grid"><div><h3>Delivery address</h3><p class="form-hint">These details will also be saved to your customer account.</p><div class="form-grid">${field("Full name", "name", a.name, "text", "required")}${field("Phone number", "phone", a.phone, "tel", 'required pattern="01[0-9]{9}" maxlength="11" placeholder="01XXXXXXXXX"')}${select("City / district", "city", cities, a.city)}${field("Full address", "street", a.street, "text", 'required minlength="8" placeholder="House, road, area"')}</div><h3 class="section-gap">Payment method</h3><label class="payment-option"><input type="radio" name="payment" value="COD" checked>${icon("wallet")}<div><strong>Cash on delivery</strong><span>Pay when your order arrives · demo</span></div></label><label class="payment-option"><input type="radio" name="payment" value="bKash demo">${icon("coin")}<div><strong>bKash simulation</strong><span>Simulates success. No payment is collected.</span></div></label></div><aside class="checkout-mini-summary"><h3>Your order</h3>${q.items.map((i) => `<div class="mini-order-item"><img src="${esc(i.image)}" alt=""><div><b>${esc(i.name)}</b><span>${esc(i.pack)} × ${i.quantity}</span></div><strong>${money(i.unitPrice * i.quantity)}</strong></div>`).join("")}<div id="checkout-totals">${checkoutTotals(q)}</div></aside></div>${formEnd("Place demo order")}</form>`,
    true,
  );
}
const checkoutTotals = (q) =>
  `<div class="summary-line"><span>Subtotal</span><b>${money(q.subtotal)}</b></div><div class="summary-line"><span>Discount</span><b>−${money(q.discount)}</b></div><div class="summary-line"><span>Delivery</span><b>${q.shipping ? money(q.shipping) : "Free"}</b></div><div class="summary-total"><span>Total</span><strong>${money(q.total)}</strong></div>`;
function viewOrder(id) {
  const s = Store.load(),
    u = Store.currentUser(s),
    o = s.orders.find((o) => o.id === id);
  if (!o || !u || (u.role !== "admin" && o.userId !== u.id))
    throw new Error("This order is not available for your account.");
  const steps = ["Pending", "Processing", "Shipped", "Delivered"],
    index = steps.indexOf(o.status),
    transitions = {
      Pending: ["Processing", "Cancelled"],
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Delivered", "Cancelled"],
      Delivered: ["Refunded"],
      Cancelled: [],
      Refunded: [],
    };
  modal(
    `Order ${o.number}`,
    `${when(o.date)} · ${esc(o.payment)}`,
    `<div class="order-detail-top">${badge(o.status)}<span>${esc(o.paymentStatus)}</span></div>${index >= 0 ? `<div class="order-progress">${steps.map((x, i) => `<div class="${i <= index ? "complete" : ""}"><span>${i < index ? icon("check") : i + 1}</span><small>${x}</small></div>`).join("")}</div>` : ""}<div class="order-address"><strong>${esc(o.address?.name)}</strong><span>${esc(o.address?.street)}, ${esc(o.address?.city)}</span><span>${esc(o.address?.phone)}</span></div>${o.items.map((i) => `<div class="mini-order-item"><img src="${esc(i.image)}" alt=""><div><b>${esc(i.name)}</b><span>${esc(i.pack)} × ${i.quantity}</span></div><strong>${money(i.unitPrice * i.quantity)}</strong></div>`).join("")}${checkoutTotals(o)}${u.role === "admin" ? `<div class="info-note">${icon("info")} Product cost: ${money(o.cogs)} · Agent commission: ${money(o.commission)}</div><div class="modal-actions">${transitions[o.status].map((next) => btn(next === "Refunded" ? "Refund order" : next === "Cancelled" ? "Cancel order" : `Mark ${next.toLowerCase()}`, "order-status", `data-id="${o.id}" data-status="${next}"`, ["Refunded", "Cancelled"].includes(next) ? "btn btn-outline" : "btn")).join("")}</div>` : ""}`,
  );
}
function investmentModal() {
  const s = Store.load(),
    u = Store.currentUser(s);
  D.requireRole(u, ["investor"]);
  modal(
    "Grow your investment",
    "Submit a demo contribution for master approval.",
    `<form data-form="investment">${field("Amount (৳)", "amount", "", "number", 'min="1" max="100000000" step="0.01" required placeholder="e.g. 25000"')}${select("Payment method", "method", payoutMethods, "Bank transfer")}${field("Demo payment reference", "reference", "", "text", 'required maxlength="80" placeholder="e.g. DEMO-TOPUP-004"')}<div class="info-note">${icon("info")} No funds are collected. Your capital updates after the master approves this request.</div>${formEnd("Submit investment")}</form>`,
  );
}
function withdrawalModal() {
  const s = Store.load(),
    u = Store.currentUser(s);
  D.requireRole(u, ["investor"]);
  const w = D.wallet(s, u.id);
  modal(
    "Request a withdrawal",
    "Choose the balance and payout details for your request.",
    `<form data-form="withdrawal">${select(
      "Withdraw from",
      "kind",
      [
        ["profit", "Available profit"],
        ["capital", "Available capital"],
      ],
      "profit",
    )}<div class="balance-callout" id="withdraw-balance"><span>Available profit</span><strong>${money(w.profitAvailable)}</strong></div>${field("Amount (৳)", "amount", "", "number", 'required min="0.01" step="0.01" placeholder="Enter your amount"')}${select("Payout method", "method", payoutMethods, "bKash")}${field("Demo payout account / number", "account", "01700000000", "text", 'required minlength="5" maxlength="60"')}<p class="form-hint">The amount is reserved until approval or rejection. Capital paid out stops participating in future allocations.</p>${formEnd("Submit request")}</form>`,
  );
}
function payoutModal(id, type = "withdrawal") {
  const s = Store.load(),
    a = Store.currentUser(s);
  D.requireRole(a, ["admin"]);
  const x =
    type === "commission"
      ? s.orders.find((o) => o.id === id)
      : s.withdrawals.find((w) => w.id === id);
  if (!x) throw new Error("Request not found.");
  modal(
    type === "commission" ? "Record agent payout" : "Record investor payout",
    "This records a simulated manual transfer.",
    `<form data-form="payout" data-id="${id}" data-kind="${type}"><div class="balance-callout"><span>Amount to mark paid</span><strong>${money(type === "commission" ? x.commission : x.amount)}</strong></div>${field("Demo transfer reference", "reference", `DEMO-${Date.now().toString().slice(-7)}`, "text", 'required maxlength="80"')}<p class="form-hint">In this prototype, marking paid updates the ledger only. It does not transfer money.</p>${formEnd("Confirm demo payout")}</form>`,
  );
}
function variantFields(v = {}, i = 0) {
  return `<div class="variant-editor" data-variant-row><input type="hidden" name="variantId${i}" value="${esc(v.id || "")}"><span class="variant-row-title">Pack ${i + 1}</span>${field("Pack label", `label${i}`, v.label || "", "text", 'required placeholder="e.g. 500 GM"')}${field("Price ৳", `price${i}`, v.price == null ? "" : v.price / 100, "number", 'required min="0" step="0.01"')}${field("Was ৳", `compareAt${i}`, v.compareAt == null ? "" : v.compareAt / 100, "number", 'required min="0" step="0.01"')}${field("Cost ৳", `cost${i}`, v.cost == null ? "" : v.cost / 100, "number", 'required min="0" step="0.01"')}${field("Stock", `stock${i}`, v.stock ?? 0, "number", 'required min="0" step="1"')}</div>`;
}
function productEditor(id) {
  const s = Store.load(),
    a = Store.currentUser(s);
  D.requireRole(a, ["admin"]);
  const p = s.products.find((p) => p.id === id) || {
    id: "",
    name: "",
    bn: "",
    category: "Honey",
    description: "",
    image: "assets/honey-black-cumin.jpg",
    badge: "New arrival",
    variants: [{}],
  };
  modal(
    p.id ? "Edit product" : "A new pantry favourite",
    "Manage the details, pack sizes, price and stock.",
    `<form data-form="product" data-id="${p.id}"><div class="form-grid">${field("Product name", "name", p.name, "text", 'required maxlength="100"')}${field("Bengali product name", "bn", p.bn, "text", 'maxlength="100"')}${select("Category", "category", ["Honey", "Oils", "Dairy", "Spices", "Combos"], p.category)}${field("Product badge", "badge", p.badge, "text", 'maxlength="35"')}${field("Image path or HTTPS image URL", "image", p.image, "text", "required")}<label class="field"><span>Description</span><textarea name="description" required maxlength="700">${esc(p.description)}</textarea></label></div><h3 class="section-gap">Pack sizes & inventory</h3><div id="variant-rows">${p.variants.map(variantFields).join("")}</div>${btn(`${icon("plus")} Add pack size`, "add-variant", "", "btn btn-outline btn-sm")}${formEnd(p.id ? "Save product" : "Create product")}</form>`,
    true,
  );
}
function investorEditor(id) {
  const s = Store.load(),
    a = Store.currentUser(s);
  D.requireRole(a, ["admin"]);
  const u = s.users.find((u) => u.id === id && u.role === "investor") || {
    id: "",
    name: "",
    login: `SM-INV-${1001 + s.users.filter((u) => u.role === "investor").length}`,
    password: "",
    active: true,
  };
  modal(
    u.id ? "Manage investor account" : "Welcome a new investor",
    "Each investor has an individual ID and demo password.",
    `<form data-form="investor-account" data-id="${u.id}">${field("Full name", "name", u.name, "text", 'required maxlength="80"')}${field("Unique investor ID", "login", u.login, "text", 'required pattern="[A-Za-z0-9_-]+" maxlength="40"')}${field(u.id ? "New password (leave blank to keep)" : "Demo password", "password", "", "password", `${u.id ? "" : "required"} minlength="8" autocomplete="new-password"`)}<label class="checkbox"><input type="checkbox" name="active" ${u.active ? "checked" : ""}> Account is active</label><p class="form-hint">New accounts start with zero capital. Submit and approve an investment to activate financial participation.</p>${formEnd(u.id ? "Save account" : "Create investor")}</form>`,
  );
}
function reviewModal(id) {
  const s = Store.load(),
    u = Store.currentUser(s);
  if (u?.role !== "customer") {
    returnRoute = `product/${id}`;
    navigate("login/customer");
    toast("Sign in as a customer to leave a review.");
    return;
  }
  const p = s.products.find((p) => p.id === id && p.active);
  if (!p) throw new Error("Product unavailable.");
  const old = s.reviews.find((r) => r.productId === id && r.userId === u.id);
  modal(
    "Share a little feedback",
    esc(p.name),
    `<form data-form="review" data-id="${id}">${select(
      "Your rating",
      "rating",
      [
        [5, "★★★★★ — Loved it"],
        [4, "★★★★☆ — Very good"],
        [3, "★★★☆☆ — Good"],
        [2, "★★☆☆☆ — Could be better"],
        [1, "★☆☆☆☆ — Disappointed"],
      ],
      old?.rating || 5,
    )}<label class="field"><span>Your review</span><textarea name="text" required minlength="10" maxlength="1000" placeholder="What did you think of this product?">${esc(old?.text || "")}</textarea></label><p class="form-hint">Reviews appear publicly after master approval.</p>${formEnd("Submit review")}</form>`,
  );
}
function aboutDemo() {
  modal(
    "One business. Three connected portals.",
    "A presentation prototype of the Saiyadna Mart experience.",
    `<div class="about-demo"><p>Shop as a customer, explore the investor dashboard, and manage the business from the master workspace.</p><ul><li>Changes are saved in this browser and update other open tabs on the same site.</li><li>All logins, orders, investments and payouts are simulations. Demo credentials are public.</li><li>Sample business history is preloaded. The storefront adds local page views to the demo analytics.</li><li>Real shared accounts, payment processing, visitor analytics and cross-device updates need a backend integration.</li></ul><div class="portal-links"><a href="#/login/customer" class="btn btn-outline">Customer</a><a href="#/login/investor" class="btn btn-outline">Investor</a><a href="#/login/admin" class="btn">Master</a></div></div>`,
  );
}
function csvDownload(filename, rows) {
  const csv =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            let x = String(value ?? "");
            if (typeof value === "string" && /^[=+@\-\t\r]/.test(x))
              x = "'" + x;
            return '"' + x.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Your report has been downloaded.");
}
function exportReport(type) {
  const s = Store.load(),
    u = Store.currentUser(s);
  D.requireRole(u, ["admin", "investor"]);
  if (type === "orders") {
    D.requireRole(u, ["admin"]);
    csvDownload("saiyadna-orders.csv", [
      [
        "Order",
        "Date",
        "Customer",
        "Status",
        "Payment",
        "Net sales BDT",
        "Delivery BDT",
        "Total BDT",
      ],
      ...s.orders.map((o) => [
        o.number,
        o.date,
        o.address?.name,
        o.status,
        o.payment,
        o.netSales / 100,
        o.shipping / 100,
        o.total / 100,
      ]),
    ]);
    return;
  }
  if (type === "ledger") {
    D.requireRole(u, ["investor"]);
    csvDownload("saiyadna-my-return-ledger.csv", [
      ["Date", "Reference", "My allocation BDT"],
      ...s.profitEntries
        .filter((e) => D.inPeriod(e.date, ui.period))
        .map((e) => [
          e.date,
          e.label,
          (e.allocations.find((a) => a.userId === u.id)?.amount || 0) / 100,
        ]),
    ]);
    return;
  }
  const m = D.stats(s, ui.period),
    rows = [
      ["SAIYADNA MART PROTOTYPE REPORT", "Sample data only"],
      ["Period", V.periodOptions.find((x) => x[0] === ui.period)?.[1]],
      ["Net sales BDT", m.netSales / 100],
      ["Product costs BDT", m.cogs / 100],
      ["Agent commissions BDT", m.commissions / 100],
      ["Operating expenses BDT", m.expenses / 100],
      ["Net profit BDT", m.netProfit / 100],
      ["Visitors (sample + local)", m.visitors],
      ["Page views (sample + local)", m.pageviews],
    ];
  if (u.role === "investor") {
    const w = D.wallet(s, u.id);
    rows.push(
      ["Investor ID", u.login],
      ["My active capital BDT", w.invested / 100],
      ["My lifetime net returns BDT", w.earned / 100],
      ["My available profit BDT", w.profitAvailable / 100],
    );
  }
  rows.push(
    [],
    ["Interval", "Net sales BDT", "Net profit BDT", "Visitors"],
    ...D.series(s, ui.period).map((x) => [
      x.key,
      x.sales / 100,
      x.profit / 100,
      x.visitors,
    ]),
  );
  csvDownload("saiyadna-business-report.csv", rows);
}
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-backdrop]")) {
    closeModal();
    return;
  }
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const action = b.dataset.action;
  e.preventDefault();
  try {
    if (action === "close-modal") {
      closeModal();
      return;
    }
    if (action === "confirm") {
      const fn = pendingConfirm;
      pendingConfirm = null;
      closeModal();
      fn?.();
      return;
    }
    if (action === "about-demo") {
      aboutDemo();
      return;
    }
    if (action === "logout") {
      closeModal();
      Store.signOut();
      navigate("shop");
      toast("You have signed out.");
      return;
    }
    if (action === "sidebar") {
      ui.sidebar = !ui.sidebar;
      render();
      return;
    }
    if (action === "toggle-register") {
      ui.register = !ui.register;
      render();
      return;
    }
    if (action === "category") {
      ui.category = b.dataset.category;
      if (route() === "combos" && ui.category !== "Combos") navigate("shop");
      else render();
      document
        .getElementById("catalog")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "clear-search") {
      ui.search = "";
      ui.category = "All";
      render();
      return;
    }
    if (action === "add-cart" || action === "buy-now") {
      const p = addToCart(b.dataset.id, b.dataset.variantId);
      if (action === "buy-now") checkout();
      else toast(`${p.name} added to your basket.`);
      return;
    }
    if (action.startsWith("cart-")) {
      const cart = Store.getCart(),
        i = Number(b.dataset.index);
      if (!cart[i]) return;
      if (
        action === "cart-remove" ||
        (action === "cart-minus" && cart[i].quantity === 1)
      )
        cart.splice(i, 1);
      else {
        cart[i].quantity += action === "cart-plus" ? 1 : -1;
        D.quote(Store.load(), cart, Store.currentUser()?.address, "");
      }
      Store.setCart(cart);
      return;
    }
    if (action === "checkout") {
      checkout();
      return;
    }
    if (action === "view-order") {
      viewOrder(b.dataset.id);
      return;
    }
    if (action === "invest") {
      investmentModal();
      return;
    }
    if (action === "withdraw") {
      withdrawalModal();
      return;
    }
    if (action === "payout" || action === "commission-payout") {
      payoutModal(
        b.dataset.id,
        action === "payout" ? "withdrawal" : "commission",
      );
      return;
    }
    if (action === "product-editor") {
      productEditor(b.dataset.id);
      return;
    }
    if (action === "investor-editor") {
      investorEditor(b.dataset.id);
      return;
    }
    if (action === "review") {
      reviewModal(b.dataset.id);
      return;
    }
    if (action === "add-variant") {
      const holder = document.getElementById("variant-rows"),
        count = holder.querySelectorAll("[data-variant-row]").length;
      if (count >= 6)
        throw new Error(
          "Up to six pack options are supported in this prototype.",
        );
      holder.insertAdjacentHTML("beforeend", variantFields({}, count));
      return;
    }
    if (action === "order-filter") {
      ui.orderFilter = b.dataset.filter;
      ui.page = 1;
      render();
      return;
    }
    if (action === "page") {
      ui.page = Number(b.dataset.page);
      render();
      return;
    }
    if (action === "order-status") {
      const id = b.dataset.id,
        status = b.dataset.status;
      confirmAction(
        `${status === "Cancelled" ? "Cancel" : status === "Refunded" ? "Refund" : "Update"} this order?`,
        status === "Delivered"
          ? "This recognises the sale and allocates its profit to active investors."
          : status === "Refunded"
            ? "This reverses the recognised sale and its original investor allocations."
            : `The order will be marked ${status.toLowerCase()}.`,
        () => {
          adminMutation((s, a) => D.changeOrderStatus(s, a, id, status));
          toast(`Order marked ${status.toLowerCase()}.`);
          viewOrder(id);
        },
      );
      return;
    }
    if (action === "approve-investment" || action === "reject-investment") {
      const id = b.dataset.id,
        decision = action === "approve-investment" ? "Approved" : "Rejected";
      confirmAction(
        `${decision === "Approved" ? "Approve" : "Reject"} this contribution?`,
        decision === "Approved"
          ? "Confirm the demo contribution. Approved capital participates in future profit allocations."
          : "The contribution will not be added to active capital.",
        () => {
          adminMutation((s, a) => D.reviewInvestment(s, a, id, decision));
          toast(`Investment ${decision.toLowerCase()}.`);
        },
      );
      return;
    }
    if (action === "reject-withdrawal") {
      const id = b.dataset.id;
      confirmAction(
        "Reject withdrawal request?",
        "The reserved amount will return to the available balance.",
        () => {
          adminMutation((s, a) => D.reviewWithdrawal(s, a, id, "Rejected"));
          toast("Withdrawal rejected; balance released.");
        },
      );
      return;
    }
    if (action === "toggle-product") {
      const id = b.dataset.id,
        p = Store.load().products.find((p) => p.id === id);
      confirmAction(
        `${p.active ? "Archive" : "Restore"} this product?`,
        p.active
          ? "The product will be removed from the storefront. Existing order records remain available."
          : "The product will appear in the storefront again.",
        () => {
          adminMutation((s, a) => {
            const p = s.products.find((p) => p.id === id);
            p.active = !p.active;
            D.log(
              s,
              p.active ? "Product restored" : "Product archived",
              p.name,
              a.name,
            );
          });
          toast("Catalogue updated.");
        },
      );
      return;
    }
    if (action === "moderate-review") {
      adminMutation((s, a) => {
        const r = s.reviews.find((x) => x.id === b.dataset.id);
        if (!r) throw new Error("Review not found.");
        if (!["Approved", "Hidden"].includes(b.dataset.status))
          throw new Error("Invalid status.");
        r.status = b.dataset.status;
        D.log(s, "Review moderated", r.status, a.name);
      });
      toast("Review updated.");
      return;
    }
    if (action === "delete-review") {
      const id = b.dataset.id;
      confirmAction(
        "Delete this review?",
        "This removes the review and recalculates the product rating.",
        () => {
          adminMutation((s, a) => {
            s.reviews = s.reviews.filter((x) => x.id !== id);
            D.log(s, "Review deleted", id, a.name);
          });
          toast("Review deleted.");
        },
      );
      return;
    }
    if (action === "expense") {
      modal(
        "Record an operating expense",
        "The expense reduces net profit and creates an investor adjustment.",
        `<form data-form="expense">${field("Description", "label", "", "text", 'required maxlength="100" placeholder="e.g. Packaging and delivery operations"')}${field("Amount (৳)", "amount", "", "number", 'required min="0.01" step="0.01"')}${formEnd("Record expense")}</form>`,
      );
      return;
    }
    if (action === "reset-demo") {
      confirmAction(
        "Reset this demo workspace?",
        "This clears local edits, orders and accounts and restores sample data in this browser.",
        () => {
          Store.reset();
          ui.coupon = "";
          navigate("shop");
          toast("Fresh sample data is ready.");
        },
        "Reset demo",
      );
      return;
    }
    if (
      action === "export-report" ||
      action === "export-orders" ||
      action === "export-ledger"
    ) {
      exportReport(action.split("-")[1]);
      return;
    }
    if (action === "notifications") {
      const s = Store.load(),
        u = Store.currentUser(s);
      D.requireRole(u, ["admin", "investor"]);
      const rows =
        u.role === "admin"
          ? s.activity.slice(0, 8)
          : [
              ...s.investments
                .filter((x) => x.userId === u.id)
                .map((x) => ({
                  title: `Investment ${x.status.toLowerCase()}`,
                  detail: `${money(x.amount)} · ${x.reference}`,
                  at: x.reviewedAt || x.date,
                })),
              ...s.withdrawals
                .filter((x) => x.userId === u.id)
                .map((x) => ({
                  title: `Withdrawal ${x.status.toLowerCase()}`,
                  detail: `${money(x.amount)} · ${x.method}`,
                  at: x.reviewedAt || x.date,
                })),
            ]
              .sort((a, b) => b.at.localeCompare(a.at))
              .slice(0, 8);
      modal(
        "Recent activity",
        "The latest updates for your workspace.",
        rows
          .map(
            (x) =>
              `<div class="activity-entry"><span class="activity-icon">${icon("bell")}</span><div><strong>${esc(x.title)}</strong><p>${esc(x.detail)}</p><small>${when(x.at)}</small></div></div>`,
          )
          .join("") || "<p>No activity yet.</p>",
      );
      return;
    }
  } catch (error) {
    toast(error.message, true);
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("[data-variant]")) {
    ui.variants[t.dataset.variant] = t.value;
    render();
  }
  if (t.matches("[data-sort]")) {
    ui.sort = t.value;
    render();
  }
  if (t.matches("[data-period]")) {
    ui.period = t.value;
    render();
  }
  if (t.closest('[data-form="checkout"]') && t.name === "city") {
    try {
      const q = D.quote(
        Store.load(),
        Store.getCart(),
        { city: t.value },
        ui.coupon,
      );
      document.getElementById("checkout-totals").innerHTML = checkoutTotals(q);
    } catch (error) {
      toast(error.message, true);
    }
  }
  if (t.closest('[data-form="withdrawal"]') && t.name === "kind") {
    const s = Store.load(),
      u = Store.currentUser(s),
      w = D.wallet(s, u.id);
    document.getElementById("withdraw-balance").innerHTML =
      `<span>Available ${t.value === "profit" ? "profit" : "capital"}</span><strong>${money(t.value === "profit" ? w.profitAvailable : w.capitalAvailable)}</strong>`;
  }
});
document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form)),
    type = form.dataset.form;
  try {
    if (type === "login") {
      const u = Store.signIn(form.dataset.role, f.login, f.password);
      ui.register = false;
      const next =
        returnRoute ||
        (u.role === "admin"
          ? "admin/overview"
          : u.role === "investor"
            ? "investor/overview"
            : "shop");
      returnRoute = null;
      navigate(next);
      toast(`Welcome, ${u.name.split(" ")[0]}.`);
      if (autoCheckout && u.role === "customer") {
        autoCheckout = false;
        setTimeout(checkout, 50);
      }
      return;
    }
    if (type === "register") {
      const u = Store.registerCustomer(f);
      ui.register = false;
      navigate(returnRoute || "account");
      returnRoute = null;
      toast("Your demo customer account is ready.");
      if (autoCheckout) {
        autoCheckout = false;
        setTimeout(checkout, 50);
      }
      return;
    }
    if (type === "search") {
      ui.search = f.search.trim();
      ui.category = "All";
      navigate("shop");
      render();
      document
        .getElementById("catalog")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (type === "table-search") {
      ui.tableSearch = f.search.trim();
      ui.page = 1;
      render();
      return;
    }
    if (type === "coupon") {
      D.quote(
        Store.load(),
        Store.getCart(),
        Store.currentUser()?.address,
        f.coupon,
      );
      ui.coupon = f.coupon.trim().toUpperCase();
      render();
      toast(ui.coupon ? "Coupon applied." : "Coupon removed.");
      return;
    }
    if (type === "address") {
      Store.transact((s) => {
        const u = activeUser(s);
        D.requireRole(u, ["customer"]);
        D.validateAddress(f);
        u.address = {
          name: f.name.trim(),
          phone: f.phone,
          city: f.city,
          street: f.street.trim(),
        };
        u.name = f.name.trim();
        D.log(s, "Customer address updated", u.name, u.name);
      });
      toast("Your delivery address is saved.");
      return;
    }
    if (type === "checkout") {
      const order = Store.transact((s) => {
        const u = activeUser(s);
        D.requireRole(u, ["customer"]);
        D.validateAddress(f);
        u.address = {
          name: f.name.trim(),
          phone: f.phone,
          city: f.city,
          street: f.street.trim(),
        };
        u.name = f.name.trim();
        return D.placeOrder(s, u, {
          cart: Store.getCart(),
          coupon: ui.coupon,
          payment: f.payment,
          requestId: form.dataset.requestId,
        });
      });
      Store.setCart([]);
      ui.coupon = "";
      closeModal();
      modal(
        "Goodness is on its way.",
        "Your demo order has been placed.",
        `<div class="order-success"><span>${icon("check")}</span><h3>${order.number}</h3><p>We’ve saved your order and delivery details. Follow its progress from your account.</p><strong>${money(order.total)}</strong><small>No payment was collected.</small><a class="btn full-width" href="#/orders">Track my order ${icon("arrow")}</a><a class="text-link" href="#/shop">Continue shopping</a></div>`,
      );
      return;
    }
    if (type === "investment") {
      investorMutation((s, u) =>
        D.requestInvestment(s, u, D.taka(f.amount), f.method, f.reference),
      );
      closeModal();
      toast("Investment submitted for master approval.");
      return;
    }
    if (type === "withdrawal") {
      investorMutation((s, u) =>
        D.requestWithdrawal(s, u, {
          amount: D.taka(f.amount),
          kind: f.kind,
          method: f.method,
          account: f.account,
        }),
      );
      closeModal();
      toast("Withdrawal requested. Your amount is reserved.");
      return;
    }
    if (type === "payout") {
      adminMutation((s, a) =>
        form.dataset.kind === "commission"
          ? D.payCommission(s, a, form.dataset.id, f.reference)
          : D.reviewWithdrawal(s, a, form.dataset.id, "Paid", f.reference),
      );
      closeModal();
      toast("Demo payout recorded.");
      return;
    }
    if (type === "expense") {
      adminMutation((s, a) => D.addExpense(s, a, D.taka(f.amount), f.label));
      closeModal();
      toast("Expense and investor adjustments recorded.");
      return;
    }
    if (type === "product") {
      adminMutation((s, a) => {
        if (!f.name.trim()) throw new Error("Add a product name.");
        if (
          !/^https:\/\//i.test(f.image) &&
          !/^assets\/[A-Za-z0-9_.-]+\.(png|webp|jpe?g|svg)$/i.test(f.image)
        )
          throw new Error("Use an assets image path or an HTTPS image URL.");
        const old = s.products.find((x) => x.id === form.dataset.id),
          id = old?.id || D.uid("product");
        const variants = [];
        for (let i = 0; f[`label${i}`] != null; i++) {
          const label = f[`label${i}`].trim();
          if (!label) throw new Error("Every pack needs a label.");
          variants.push({
            id: f[`variantId${i}`] || D.uid("pack"),
            label,
            price: D.integer(D.taka(f[`price${i}`]), "Price", 0),
            compareAt: D.integer(
              D.taka(f[`compareAt${i}`]),
              "Original price",
              0,
            ),
            cost: D.integer(D.taka(f[`cost${i}`]), "Cost", 0),
            stock: D.integer(f[`stock${i}`], "Stock", 0, 1000000),
          });
        }
        if (!variants.length) throw new Error("Add at least one pack size.");
        const value = {
          id,
          name: f.name.trim(),
          bn: f.bn.trim(),
          description: f.description.trim(),
          image: f.image.trim(),
          category: f.category,
          badge: f.badge.trim(),
          variants,
          active: old?.active ?? true,
        };
        if (old) Object.assign(old, value);
        else s.products.push(value);
        D.log(s, old ? "Product updated" : "Product added", value.name, a.name);
      });
      closeModal();
      toast("Product saved.");
      return;
    }
    if (type === "investor-account") {
      adminMutation((s, a) => {
        const old = s.users.find(
          (u) => u.id === form.dataset.id && u.role === "investor",
        );
        if (!f.name.trim() || !f.login.trim())
          throw new Error("Name and unique ID are required.");
        if (
          s.users.some(
            (u) =>
              u.id !== old?.id &&
              u.login.toLowerCase() === f.login.trim().toLowerCase(),
          )
        )
          throw new Error("This account ID is already in use.");
        if ((!old || f.password) && f.password.length < 8)
          throw new Error("Use at least 8 characters for the demo password.");
        const value = {
          id: old?.id || D.uid("investor"),
          role: "investor",
          name: f.name.trim(),
          login: f.login.trim(),
          password: f.password || old?.password,
          active: f.active === "on",
        };
        if (old) Object.assign(old, value);
        else s.users.push(value);
        D.log(
          s,
          old ? "Investor account updated" : "Investor account created",
          value.name,
          a.name,
        );
      });
      closeModal();
      toast("Investor account saved.");
      return;
    }
    if (type === "partner") {
      adminMutation((s, a) => {
        const rate = Number(f.rate),
          discount = Number(f.discountPct),
          code = f.code.trim().toUpperCase();
        if (
          !Number.isFinite(rate) ||
          rate < 0 ||
          rate > 100 ||
          !Number.isFinite(discount) ||
          discount < 0 ||
          discount > 90
        )
          throw new Error("Use valid percentage values.");
        if (!/^[A-Z0-9_-]+$/.test(code) || code === s.settings.couponCode)
          throw new Error(
            "Use a unique partner coupon with letters and numbers.",
          );
        Object.assign(s.partners[0], {
          name: f.name.trim(),
          code,
          rate,
          discountPct: discount,
          active: f.active === "on",
        });
        D.log(
          s,
          "Partner commission rules updated",
          `${rate}% · ${code}`,
          a.name,
        );
      });
      toast("Partner rules saved for future orders.");
      return;
    }
    if (type === "settings") {
      adminMutation((s, a) => {
        const x = s.settings;
        for (const key of ["couponPct", "investorPoolPct"]) {
          const n = Number(f[key]);
          if (
            !Number.isFinite(n) ||
            n < 0 ||
            n > (key === "couponPct" ? 90 : 100)
          )
            throw new Error("Enter valid percentage values.");
          x[key] = n;
        }
        for (const key of [
          "freeDelivery",
          "deliveryDhaka",
          "deliveryOutside",
          "couponCap",
        ])
          x[key] = D.integer(D.taka(f[key]), key, 0);
        x.commissionHoldDays = D.integer(
          f.commissionHoldDays,
          "Hold days",
          0,
          365,
        );
        const code = f.couponCode.trim().toUpperCase();
        if (
          !/^[A-Z0-9_-]+$/.test(code) ||
          s.partners.some((p) => p.code === code)
        )
          throw new Error("Use a unique store coupon code.");
        if (
          f.featuredCombo &&
          !s.products.some(
            (p) =>
              p.id === f.featuredCombo && p.active && p.category === "Combos",
          )
        )
          throw new Error("Choose an active combo offer.");
        Object.assign(x, {
          featuredCombo: f.featuredCombo,
          storeName: f.storeName.trim(),
          tagline: f.tagline.trim(),
          heroTitle: f.heroTitle.trim(),
          heroSubtitle: f.heroSubtitle.trim(),
          couponCode: code,
          storeOpen: f.storeOpen === "on",
        });
        if (!x.storeName || !x.heroTitle || !x.heroSubtitle)
          throw new Error("Store name, headline and description are required.");
        D.log(
          s,
          "Store settings updated",
          "Brand, offers, delivery and allocation settings",
          a.name,
        );
      });
      toast("Settings saved across the demo portals.");
      return;
    }
    if (type === "review") {
      Store.transact((s) => {
        const u = activeUser(s);
        D.requireRole(u, ["customer"]);
        const rating = D.integer(f.rating, "Rating", 1, 5),
          text = f.text.trim(),
          productId = form.dataset.id;
        if (text.length < 10 || text.length > 1000)
          throw new Error("Write between 10 and 1000 characters.");
        if (!s.products.some((p) => p.id === productId && p.active))
          throw new Error("Product unavailable.");
        const old = s.reviews.find(
            (r) => r.userId === u.id && r.productId === productId,
          ),
          verified = s.orders.some(
            (o) =>
              o.userId === u.id &&
              o.status === "Delivered" &&
              o.items.some((i) => i.productId === productId),
          );
        const value = {
          id: old?.id || D.uid("review"),
          productId,
          userId: u.id,
          name: u.name,
          rating,
          text,
          status: "Pending",
          date: new Date().toISOString(),
          verified,
          sample: false,
        };
        if (old) Object.assign(old, value);
        else s.reviews.unshift(value);
        D.log(
          s,
          "Product review submitted",
          s.products.find((p) => p.id === productId).name,
          u.name,
        );
      });
      closeModal();
      toast("Thanks! Your review is awaiting approval.");
      return;
    }
  } catch (error) {
    failure(form, error);
  }
});
document.addEventListener("keydown", (e) => {
  if (!modalRoot.firstElementChild) return;
  if (e.key === "Escape") {
    closeModal();
    return;
  }
  if (e.key === "Tab") {
    const elements = [
        ...modalRoot.querySelectorAll(
          'button:not([disabled]),a[href],input:not([type="hidden"]),select,textarea,[tabindex="0"]',
        ),
      ],
      first = elements[0],
      last = elements.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG" && !e.target.dataset.fallback) {
      e.target.dataset.fallback = "true";
      e.target.src = "assets/favicon.svg";
    }
  },
  true,
);
window.addEventListener("hashchange", () => {
  if (location.hash === "#catalog") {
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  closeModal();
  ui.sidebar = false;
  ui.tableSearch = "";
  ui.page = 1;
  if (route() === "combos") ui.category = "Combos";
  else if (route() === "shop") ui.category = "All";
  render();
  window.scrollTo(0, 0);
  if (["shop", "combos"].includes(route()) || route().startsWith("product/"))
    Store.recordVisit();
});
window.addEventListener("storage", (e) => {
  if (e.key === Store.STORAGE_KEY) {
    render();
  }
});
window.addEventListener("mart:change", render);
window.addEventListener("mart:cart", render);
render();
if (["shop", "combos"].includes(route()) || route().startsWith("product/"))
  Store.recordVisit();
