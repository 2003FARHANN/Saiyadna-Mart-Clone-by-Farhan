// Demo accounting uses integer paisa. This module has no browser dependencies.
export const VERSION = 1;
export const DAY = 86400000;
export const uid = (prefix = "id") =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
export const taka = (n) => Math.round(Number(n) * 100);
const dhakaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export const dateKey = (value = new Date()) => {
  const parts = dhakaDateFormatter.formatToParts(new Date(value));
  const part = (t) => parts.find((p) => p.type === t).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};
export const dayStart = (key) => new Date(`${key}T00:00:00+06:00`).getTime();
export function periodStart(period, now = new Date()) {
  const today = dateKey(now),
    start = dayStart(today);
  if (period === "today") return start;
  if (period === "7d") return start - 6 * DAY;
  const months = Number(period) || 1;
  const [y, m] = today.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - months, 1));
  return dayStart(
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`,
  );
}
export function inPeriod(date, period, now = new Date()) {
  const t = new Date(date).getTime();
  return t >= periodStart(period, now) && t <= new Date(now).getTime();
}
export function requireRole(user, roles) {
  if (!user?.active || !roles.includes(user.role))
    throw new Error("This action is not available for your account.");
}
export function integer(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw new Error(
      `${label} must be a whole number between ${min} and ${max}.`,
    );
  return n;
}
export function amount(value, label = "Amount") {
  return integer(value, label, 1, 100000000000);
}
export function capital(s, userId) {
  return (
    s.investments
      .filter((x) => x.userId === userId && x.status === "Approved")
      .reduce((a, x) => a + x.amount, 0) -
    s.withdrawals
      .filter(
        (x) =>
          x.userId === userId && x.kind === "capital" && x.status === "Paid",
      )
      .reduce((a, x) => a + x.amount, 0)
  );
}
export function earnings(s, userId) {
  return s.profitEntries.reduce(
    (a, x) => a + (x.allocations.find((v) => v.userId === userId)?.amount || 0),
    0,
  );
}
export function wallet(s, userId) {
  const invested = capital(s, userId),
    earned = earnings(s, userId);
  const used = (kind) =>
    s.withdrawals
      .filter(
        (x) =>
          x.userId === userId &&
          x.kind === kind &&
          ["Pending", "Paid"].includes(x.status),
      )
      .reduce((a, x) => a + x.amount, 0);
  return {
    invested,
    earned,
    profitAvailable: Math.max(0, earned - used("profit")),
    capitalAvailable: Math.max(
      0,
      invested -
        s.withdrawals
          .filter(
            (x) =>
              x.userId === userId &&
              x.kind === "capital" &&
              x.status === "Pending",
          )
          .reduce((a, x) => a + x.amount, 0),
    ),
    paid: s.withdrawals
      .filter((x) => x.userId === userId && x.status === "Paid")
      .reduce((a, x) => a + x.amount, 0),
    reserved:
      used("profit") -
      s.withdrawals
        .filter(
          (x) =>
            x.userId === userId && x.kind === "profit" && x.status === "Paid",
        )
        .reduce((a, x) => a + x.amount, 0),
  };
}
function allocate(s, netProfit) {
  const pool = Math.round((netProfit * s.settings.investorPoolPct) / 100);
  const people = s.users
    .filter((x) => x.role === "investor" && x.active)
    .map((x) => ({ userId: x.id, capital: capital(s, x.id) }))
    .filter((x) => x.capital > 0);
  const total = people.reduce((a, x) => a + x.capital, 0);
  let assigned = 0;
  return people.map((x, i) => {
    const n =
      i === people.length - 1
        ? pool - assigned
        : Math.trunc((pool * x.capital) / total);
    assigned += n;
    return { userId: x.userId, amount: n };
  });
}
export function log(
  s,
  title,
  detail,
  actor = "System",
  at = new Date().toISOString(),
) {
  s.activity.unshift({ id: uid("event"), title, detail, actor, at });
  s.activity = s.activity.slice(0, 120);
}
function recognize(s, order, date) {
  if (s.profitEntries.some((x) => x.orderId === order.id)) return;
  const netProfit = order.netSales - order.cogs - order.commission;
  s.profitEntries.push({
    id: uid("profit"),
    orderId: order.id,
    label: `Order ${order.number}`,
    date,
    netProfit,
    allocations: allocate(s, netProfit),
    poolPct: s.settings.investorPoolPct,
  });
  order.recognizedAt = date;
}
export function quote(s, cart, address, coupon = "") {
  if (!cart.length) throw new Error("Your basket is empty.");
  const merged = new Map();
  for (const line of cart) {
    const key = `${line.productId}/${line.variantId}`,
      quantity = integer(line.quantity, "Quantity", 1, 99),
      previous = merged.get(key);
    if (previous) previous.quantity += quantity;
    else merged.set(key, { ...line, quantity });
  }
  const items = [...merged.values()].map((line) => {
    const p = s.products.find((p) => p.id === line.productId && p.active),
      v = p?.variants.find((v) => v.id === line.variantId);
    if (!p || !v)
      throw new Error("A product in your basket is no longer available.");
    const quantity = integer(line.quantity, "Quantity", 1, 99);
    if (v.stock < quantity)
      throw new Error(`Only ${v.stock} ${p.name} (${v.label}) available.`);
    return {
      productId: p.id,
      variantId: v.id,
      name: p.name,
      image: p.image,
      pack: v.label,
      quantity,
      unitPrice: v.price,
      unitCost: v.cost,
    };
  });
  const subtotal = items.reduce((a, x) => a + x.unitPrice * x.quantity, 0),
    code = coupon.trim().toUpperCase();
  let discount = 0,
    partnerId = null;
  if (code) {
    const partner = s.partners.find((p) => p.active && p.code === code);
    if (partner) {
      partnerId = partner.id;
      discount = Math.round((subtotal * partner.discountPct) / 100);
    } else if (code === s.settings.couponCode)
      discount = Math.min(
        Math.round((subtotal * s.settings.couponPct) / 100),
        s.settings.couponCap,
      );
    else throw new Error("This coupon is not valid.");
  }
  const netSales = subtotal - discount;
  const shipping =
    netSales >= s.settings.freeDelivery
      ? 0
      : address?.city === "Dhaka"
        ? s.settings.deliveryDhaka
        : s.settings.deliveryOutside;
  const partner = s.partners.find((x) => x.id === partnerId);
  const commission = partner ? Math.round((netSales * partner.rate) / 100) : 0;
  return {
    items,
    subtotal,
    discount,
    netSales,
    shipping,
    total: netSales + shipping,
    cogs: items.reduce((a, x) => a + x.unitCost * x.quantity, 0),
    partnerId,
    commission,
    commissionRate: partner?.rate || 0,
    coupon: code,
  };
}
export function validateAddress(address) {
  if (
    !address?.name?.trim() ||
    !/^01\d{9}$/.test(address.phone || "") ||
    !address.city?.trim() ||
    !(address.street || "").trim() ||
    address.street.trim().length < 8
  )
    throw new Error(
      "Save your name, 11-digit Bangladesh phone number, city and full address first.",
    );
}
export function placeOrder(
  s,
  user,
  { cart, coupon = "", payment = "COD", requestId },
  now = new Date(),
) {
  requireRole(user, ["customer"]);
  const previous =
    requestId &&
    s.orders.find((x) => x.requestId === requestId && x.userId === user.id);
  if (previous) return previous;
  if (!s.settings.storeOpen)
    throw new Error(
      "The store is temporarily taking a break. Please check back soon.",
    );
  validateAddress(user.address);
  if (!["COD", "bKash demo"].includes(payment))
    throw new Error("Choose a payment method.");
  const q = quote(s, cart, user.address, coupon),
    date = now.toISOString();
  q.items.forEach((i) => {
    s.products
      .find((p) => p.id === i.productId)
      .variants.find((v) => v.id === i.variantId).stock -= i.quantity;
  });
  const order = {
    id: uid("ord"),
    requestId: requestId || uid("checkout"),
    number: `SM-${s.nextOrder++}`,
    userId: user.id,
    date,
    status: "Pending",
    payment,
    paymentStatus: payment === "COD" ? "Unpaid" : "Paid (demo)",
    paidAt: payment === "COD" ? null : date,
    address: { ...user.address },
    ...q,
  };
  s.orders.unshift(order);
  log(
    s,
    "New order",
    `${order.number} · ${q.items.length} item types`,
    user.name,
    date,
  );
  return order;
}
export function changeOrderStatus(s, admin, id, status, now = new Date()) {
  requireRole(admin, ["admin"]);
  const o = s.orders.find((x) => x.id === id);
  if (!o) throw new Error("Order not found.");
  const transitions = {
    Pending: ["Processing", "Cancelled"],
    Processing: ["Shipped", "Cancelled"],
    Shipped: ["Delivered", "Cancelled"],
    Delivered: ["Refunded"],
    Cancelled: [],
    Refunded: [],
  };
  if (!transitions[o.status]?.includes(status))
    throw new Error("This order transition is not allowed.");
  const date = now.toISOString();
  if (status === "Delivered") {
    o.paymentStatus = "Paid (demo)";
    o.paidAt ||= date;
    recognize(s, o, date);
  }
  if (["Cancelled", "Refunded"].includes(status)) {
    o.items.forEach((i) => {
      const v = s.products
        .find((p) => p.id === i.productId)
        ?.variants.find((v) => v.id === i.variantId);
      if (v) v.stock += i.quantity;
    });
    if (status === "Refunded") {
      const original = s.profitEntries.find(
        (x) => x.orderId === o.id && !x.reversal,
      );
      if (original)
        s.profitEntries.push({
          id: uid("reversal"),
          orderId: o.id,
          reversal: true,
          label: `Refund ${o.number}`,
          date,
          netProfit: -original.netProfit,
          allocations: original.allocations.map((x) => ({
            ...x,
            amount: -x.amount,
          })),
          poolPct: original.poolPct,
        });
      o.refundedAt = date;
    }
    o.paymentStatus = o.paidAt ? "Refunded (demo)" : "Cancelled";
    const c = s.commissionPayouts.find((x) => x.orderId === id);
    if (c) c.status = c.status === "Paid" ? "Recovery due" : "Cancelled";
  }
  o.status = status;
  log(s, `Order ${status.toLowerCase()}`, o.number, admin.name, date);
  return o;
}
export function requestInvestment(
  s,
  user,
  amountValue,
  method,
  reference,
  now = new Date(),
) {
  requireRole(user, ["investor"]);
  amount(amountValue);
  if (!reference?.trim()) throw new Error("Add a demo payment reference.");
  if (
    s.investments.some(
      (x) =>
        x.userId === user.id &&
        x.reference === reference.trim() &&
        x.status !== "Rejected",
    )
  )
    throw new Error("This reference has already been submitted.");
  const item = {
    id: uid("inv"),
    userId: user.id,
    amount: amountValue,
    method,
    reference: reference.trim(),
    status: "Pending",
    date: now.toISOString(),
  };
  s.investments.unshift(item);
  log(s, "Investment requested", user.name, user.name);
  return item;
}
export function reviewInvestment(s, admin, id, decision) {
  requireRole(admin, ["admin"]);
  const x = s.investments.find((x) => x.id === id);
  if (!x || x.status !== "Pending")
    throw new Error("This request has already been reviewed.");
  if (!["Approved", "Rejected"].includes(decision))
    throw new Error("Invalid decision.");
  x.status = decision;
  x.reviewedAt = new Date().toISOString();
  log(
    s,
    `Investment ${decision.toLowerCase()}`,
    s.users.find((u) => u.id === x.userId)?.name,
    admin.name,
  );
}
export function requestWithdrawal(
  s,
  user,
  { amount: val, kind, method, account },
  now = new Date(),
) {
  requireRole(user, ["investor"]);
  amount(val);
  if (!["profit", "capital"].includes(kind))
    throw new Error("Choose profit or capital.");
  if (!account?.trim() || account.trim().length < 5)
    throw new Error("Add your demo payout account.");
  const w = wallet(s, user.id);
  if (val > (kind === "profit" ? w.profitAvailable : w.capitalAvailable))
    throw new Error("Amount exceeds the available balance.");
  const x = {
    id: uid("wd"),
    userId: user.id,
    amount: val,
    kind,
    method,
    account: account.trim(),
    date: now.toISOString(),
    status: "Pending",
  };
  s.withdrawals.unshift(x);
  log(s, "Withdrawal requested", `${user.name} · ${kind}`, user.name);
  return x;
}
export function reviewWithdrawal(s, admin, id, decision, reference = "") {
  requireRole(admin, ["admin"]);
  const x = s.withdrawals.find((x) => x.id === id);
  if (!x || x.status !== "Pending")
    throw new Error("This request has already been reviewed.");
  if (!["Paid", "Rejected"].includes(decision))
    throw new Error("Invalid decision.");
  if (decision === "Paid") {
    if (!reference.trim())
      throw new Error("Add a demo transfer reference before marking paid.");
    const other = s.withdrawals
      .filter(
        (y) =>
          y.id !== id &&
          y.userId === x.userId &&
          y.kind === x.kind &&
          ["Paid", "Pending"].includes(y.status),
      )
      .reduce((a, y) => a + y.amount, 0);
    const allApproved = s.investments
      .filter((y) => y.userId === x.userId && y.status === "Approved")
      .reduce((a, y) => a + y.amount, 0);
    const available =
      (x.kind === "profit" ? earnings(s, x.userId) : allApproved) - other;
    if (x.amount > available)
      throw new Error(
        "Balance changed after this request. Reject it and request a new amount.",
      );
  }
  x.status = decision;
  x.reference = reference;
  x.reviewedAt = new Date().toISOString();
  log(
    s,
    `Withdrawal ${decision.toLowerCase()}`,
    s.users.find((u) => u.id === x.userId)?.name,
    admin.name,
  );
}
export function addExpense(s, admin, val, label, now = new Date()) {
  requireRole(admin, ["admin"]);
  amount(val);
  if (!label?.trim()) throw new Error("Add an expense description.");
  const x = {
    id: uid("expense"),
    amount: val,
    label: label.trim(),
    date: now.toISOString(),
  };
  s.expenses.unshift(x);
  s.profitEntries.push({
    id: uid("profit"),
    expenseId: x.id,
    label: x.label,
    date: x.date,
    netProfit: -val,
    allocations: allocate(s, -val),
    poolPct: s.settings.investorPoolPct,
  });
  log(s, "Expense recorded", label, admin.name);
}
export function stats(s, period = "1", now = new Date()) {
  const start = periodStart(period, now),
    end = now.getTime();
  const included = (date) => {
    const t = new Date(date).getTime();
    return t >= start && t <= end;
  };
  const recognized = s.orders.filter(
    (o) => o.recognizedAt && included(o.recognizedAt),
  );
  const refunds = s.orders.filter(
    (o) => o.refundedAt && included(o.refundedAt),
  );
  const sum = (key) =>
    recognized.reduce((a, o) => a + o[key], 0) -
    refunds.reduce((a, o) => a + o[key], 0);
  const expenses = s.expenses
    .filter((x) => included(x.date))
    .reduce((a, x) => a + x.amount, 0);
  const netSales = sum("netSales"),
    cogs = sum("cogs"),
    commissions = sum("commission"),
    netProfit = netSales - cogs - commissions - expenses;
  const traffic = s.traffic.filter(
    (x) => dayStart(x.day) >= start && dayStart(x.day) <= end,
  );
  return {
    netSales,
    cogs,
    commissions,
    expenses,
    netProfit,
    grossProfit: netSales - cogs,
    orders: recognized.length - refunds.length,
    pending: s.orders.filter((o) =>
      ["Pending", "Processing", "Shipped"].includes(o.status),
    ).length,
    visitors: traffic.reduce((a, x) => a + x.visitors, 0),
    pageviews: traffic.reduce((a, x) => a + x.pageviews, 0),
    conversion: traffic.reduce((a, x) => a + x.visitors, 0)
      ? (100 * recognized.length) / traffic.reduce((a, x) => a + x.visitors, 0)
      : 0,
  };
}
export function series(s, period, now = new Date()) {
  const start = periodStart(period, now),
    days = Math.ceil((now.getTime() - start) / DAY),
    monthly = days > 40,
    rows = new Map();
  const included = (date) => {
    const t = new Date(date).getTime();
    return t >= start && t <= now.getTime();
  };
  for (let t = start; t <= now.getTime(); t += DAY) {
    const key = dateKey(t).slice(0, monthly ? 7 : 10);
    if (!rows.has(key))
      rows.set(key, { key, sales: 0, profit: 0, visitors: 0 });
  }
  for (const o of s.orders) {
    if (o.recognizedAt && included(o.recognizedAt)) {
      const r = rows.get(dateKey(o.recognizedAt).slice(0, monthly ? 7 : 10));
      if (r) r.sales += o.netSales;
    }
    if (o.refundedAt && included(o.refundedAt)) {
      const r = rows.get(dateKey(o.refundedAt).slice(0, monthly ? 7 : 10));
      if (r) r.sales -= o.netSales;
    }
  }
  for (const e of s.profitEntries) {
    if (included(e.date)) {
      const r = rows.get(dateKey(e.date).slice(0, monthly ? 7 : 10));
      if (r) r.profit += e.netProfit;
    }
  }
  for (const x of s.traffic) {
    if (dayStart(x.day) < start || dayStart(x.day) > now.getTime()) continue;
    const r = rows.get(x.day.slice(0, monthly ? 7 : 10));
    if (r) r.visitors += x.visitors;
  }
  return [...rows.values()];
}
export function commissionState(s, o, now = new Date()) {
  if (["Cancelled", "Refunded"].includes(o.status))
    return s.commissionPayouts.find((x) => x.orderId === o.id)?.status ===
      "Recovery due"
      ? "Recovery due"
      : "Cancelled";
  const paid = s.commissionPayouts.find((x) => x.orderId === o.id);
  if (paid) return paid.status;
  if (o.status !== "Delivered" || !o.paidAt) return "Awaiting delivery";
  if (now - new Date(o.paidAt) < s.settings.commissionHoldDays * DAY)
    return "On hold";
  return "Ready";
}
export function payCommission(s, admin, orderId, reference, now = new Date()) {
  requireRole(admin, ["admin"]);
  const o = s.orders.find((x) => x.id === orderId && x.partnerId);
  if (!o || commissionState(s, o, now) !== "Ready")
    throw new Error("Commission is not eligible for payout.");
  if (!reference.trim()) throw new Error("Add a demo transfer reference.");
  s.commissionPayouts.push({
    orderId,
    status: "Paid",
    reference,
    date: now.toISOString(),
  });
  log(s, "Agent commission paid", o.number, admin.name);
}
export function seedState(now = new Date()) {
  const s = {
    version: VERSION,
    seededAt: now.toISOString(),
    nextOrder: 10401,
    settings: {
      storeName: "Saiyadna Mart",
      tagline: "Good food. Shared growth.",
      freeDelivery: taka(800),
      deliveryDhaka: taka(60),
      deliveryOutside: taka(120),
      investorPoolPct: 25,
      commissionHoldDays: 7,
      couponCode: "FRESH10",
      couponPct: 10,
      couponCap: taka(200),
      storeOpen: true,
      featuredCombo: "essentials",
      heroTitle: "A little goodness.\nEvery single day.",
      heroSubtitle:
        "Discover pantry essentials, thoughtfully chosen for your family. Pure ingredients, honest flavour, delivered to your door.",
    },
    users: [
      {
        id: "cus-001",
        role: "customer",
        login: "customer@saiyadna.demo",
        password: "Customer123!",
        name: "Farhan Demo",
        active: true,
        address: {
          name: "Farhan Demo",
          phone: "01700000000",
          city: "Dhaka",
          street: "Demo House 12, Road 4, Bashundhara R/A",
        },
      },
      {
        id: "inv-001",
        role: "investor",
        login: "SM-INV-1001",
        password: "Investor123!",
        name: "Farhan Rahman",
        active: true,
      },
      {
        id: "inv-002",
        role: "investor",
        login: "SM-INV-1002",
        password: "Investor123!",
        name: "Nusrat Islam",
        active: true,
      },
      {
        id: "master",
        role: "admin",
        login: "SM-MASTER",
        password: "Master123!",
        name: "Master Admin",
        active: true,
      },
    ],
    products: [],
    orders: [],
    reviews: [],
    investments: [],
    withdrawals: [],
    expenses: [],
    profitEntries: [],
    traffic: [],
    activity: [],
    commissionPayouts: [],
    partners: [
      {
        id: "partner-01",
        name: "Demo sales partner",
        code: "PARTNER29",
        rate: 29,
        discountPct: 0,
        active: true,
      },
    ],
  };
  const list = [
    [
      "black-honey",
      "Black cumin honey",
      "কালোজিরা ফুলের মধু",
      "Honey",
      "honey-black-cumin.jpg",
      [
        ["1 KG", 1089, 1400, 700, 42],
        ["500 GM", 589, 700, 370, 58],
        ["250 GM", 289, 350, 185, 64],
      ],
      "Bestseller",
      "Rich, full-bodied honey with a distinctive floral character. A lovely addition to your breakfast ritual.",
    ],
    [
      "mustard-honey",
      "Mustard flower honey",
      "সরিষা ফুলের মধু",
      "Honey",
      "honey-mustard.jpg",
      [
        ["1 KG", 439, 800, 280, 52],
        ["500 GM", 249, 400, 150, 44],
      ],
      "45% off",
      "A mellow, everyday honey to drizzle over toast, stir into tea, or share around the breakfast table.",
    ],
    [
      "litchi-honey",
      "Litchi flower honey",
      "লিচু ফুলের মধু",
      "Honey",
      "honey-litchi.jpg",
      [
        ["1 KG", 639, 900, 410, 36],
        ["500 GM", 359, 450, 220, 46],
      ],
      "Seasonal pick",
      "Light and delicately floral. Bring a little sweetness to tea, yogurt and your favourite recipes.",
    ],
    [
      "mustard-oil",
      "Cold-pressed mustard oil",
      "ঘানি ভাঙা সরিষার তেল",
      "Oils",
      "mustard-oil.jpg",
      [
        ["250 ML", 79, 110, 48, 80],
        ["500 ML", 159, 220, 100, 54],
        ["1 L", 299, 400, 190, 38],
      ],
      "Pantry essential",
      "The familiar, bold flavour of mustard oil for everyday Bengali cooking.",
    ],
    [
      "coconut-oil",
      "Virgin coconut oil",
      "নারকেল তেল",
      "Oils",
      "coconut-oil.jpg",
      [
        ["250 GM", 489, 550, 310, 32],
        ["500 GM", 899, 1050, 620, 22],
      ],
      "Pure goodness",
      "A versatile coconut oil with a gentle aroma. Keep a jar ready for your everyday routine.",
    ],
    [
      "ghee",
      "Traditional gawa ghee",
      "খাঁটি দানাদার গাওয়া ঘি",
      "Dairy",
      "gawa-ghee.png",
      [
        ["100 GM", 189, 250, 120, 48],
        ["250 GM", 449, 600, 300, 35],
        ["500 GM", 849, 1100, 570, 28],
      ],
      "Customer favourite",
      "Golden, aromatic ghee that brings warmth and richness to rice, khichuri and family recipes.",
    ],
    [
      "chili",
      "Red chili powder",
      "মরিচ গুঁড়া",
      "Spices",
      "chili-powder.jpg",
      [
        ["1 KG", 539, 650, 340, 40],
        ["500 GM", 279, 330, 175, 48],
      ],
      "Kitchen staple",
      "Deep colour and a lively kick for the meals you love to cook.",
    ],
    [
      "turmeric",
      "Golden turmeric powder",
      "হলুদ গুঁড়া",
      "Spices",
      "turmeric-powder.jpg",
      [
        ["1 KG", 539, 600, 340, 38],
        ["500 GM", 279, 310, 175, 60],
      ],
      "Kitchen staple",
      "Vibrant turmeric, a familiar foundation for comforting home-cooked food.",
    ],
    [
      "essentials",
      "The everyday essentials box",
      "ঘি, মধু, তেল কম্বো",
      "Combos",
      "essentials-combo.png",
      [["3-piece box", 1097, 1360, 720, 26]],
      "Save ৳263",
      "Gawa ghee 250g, mustard oil 1L and mustard flower honey 500g. Three favourites, one thoughtful box.",
    ],
    [
      "honey-box",
      "The honey discovery box",
      "তিন ধরনের মধু কম্বো",
      "Combos",
      "honey-combo.png",
      [["3-jar box", 1417, 1550, 930, 24]],
      "Taste all three",
      "A sample collection of three distinctive honey varieties. A sweet little gift for your home.",
    ],
  ];
  s.products = list.map(
    ([id, name, bn, category, image, variants, badge, description]) => ({
      id,
      name,
      bn,
      category,
      image: `assets/${image}`,
      badge,
      description,
      active: true,
      variants: variants.map(([label, p, old, c, stock], i) => ({
        id: `${id}-${i}`,
        label,
        price: taka(p),
        compareAt: taka(old),
        cost: taka(c),
        stock,
      })),
    }),
  );
  const today = dayStart(dateKey(now)),
    start = today - 155 * DAY;
  s.investments = [
    {
      id: "opening-1",
      userId: "inv-001",
      amount: taka(150000),
      method: "Bank transfer",
      reference: "DEMO-OPEN-01",
      status: "Approved",
      date: new Date(start - DAY).toISOString(),
    },
    {
      id: "opening-2",
      userId: "inv-002",
      amount: taka(100000),
      method: "Bank transfer",
      reference: "DEMO-OPEN-02",
      status: "Approved",
      date: new Date(start - DAY).toISOString(),
    },
  ];
  let rng = 9402;
  const random = () => {
    rng = (rng * 1664525 + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  for (let d = 0; d < 156; d++) {
    const ts = start + d * DAY + 8 * 3600000;
    if (ts > now.getTime()) continue;
    const date = new Date(ts).toISOString();
    const count = 4 + Math.floor(random() * 5);
    s.traffic.push({
      day: dateKey(date),
      visitors: 130 + Math.floor(random() * 140),
      pageviews: 410 + Math.floor(random() * 430),
      sample: true,
    });
    for (let n = 0; n < count; n++) {
      const p = s.products[Math.floor(random() * s.products.length)],
        v = p.variants[0],
        qty = 1 + Math.floor(random() * 3),
        netSales = v.price * qty,
        cogs = v.cost * qty;
      const referred = random() < 0.1,
        commission = referred ? Math.round(netSales * 0.29) : 0;
      const order = {
        id: `seed-order-${d}-${n}`,
        number: `SM-${s.nextOrder++}`,
        userId: n === 0 ? "cus-001" : `sample-${n}`,
        date,
        status: "Delivered",
        payment: "COD",
        paymentStatus: "Paid (demo)",
        paidAt: date,
        recognizedAt: date,
        address: {
          name: n === 0 ? "Farhan Demo" : `Sample customer ${n}`,
          phone: "01700000000",
          city: n % 2 ? "Dhaka" : "Chattogram",
          street: "Demo address, sample records only",
        },
        items: [
          {
            productId: p.id,
            variantId: v.id,
            name: p.name,
            image: p.image,
            pack: v.label,
            quantity: qty,
            unitPrice: v.price,
            unitCost: v.cost,
          },
        ],
        subtotal: netSales,
        discount: 0,
        netSales,
        cogs,
        shipping: netSales >= s.settings.freeDelivery ? 0 : taka(60),
        total: netSales + (netSales >= s.settings.freeDelivery ? 0 : taka(60)),
        partnerId: referred ? "partner-01" : null,
        commission,
        commissionRate: referred ? 29 : 0,
        coupon: referred ? "PARTNER29" : "",
      };
      s.orders.push(order);
      recognize(s, order, date);
    }
    const expense = {
      id: `seed-expense-${d}`,
      label: "Daily fulfilment & operations",
      amount: taka(120 + Math.floor(random() * 80)),
      date,
    };
    s.expenses.push(expense);
    s.profitEntries.push({
      id: `seed-profit-expense-${d}`,
      expenseId: expense.id,
      label: expense.label,
      date,
      netProfit: -expense.amount,
      allocations: allocate(s, -expense.amount),
      poolPct: s.settings.investorPoolPct,
    });
  }
  s.orders.reverse();
  const customer = s.users[0];
  placeOrder(
    s,
    customer,
    {
      cart: [
        { productId: "essentials", variantId: "essentials-0", quantity: 1 },
      ],
      payment: "COD",
      requestId: "seed-pending-1",
    },
    new Date(now.getTime() - 3600000),
  );
  const second = placeOrder(
    s,
    customer,
    {
      cart: [
        { productId: "black-honey", variantId: "black-honey-1", quantity: 2 },
      ],
      payment: "bKash demo",
      requestId: "seed-pending-2",
    },
    new Date(now.getTime() - 1800000),
  );
  second.status = "Processing";
  s.reviews = s.products.flatMap((p, i) => [
    {
      id: `review-${i}-1`,
      productId: p.id,
      userId: `demo-reviewer-${i}`,
      name: ["Ayesha K.", "Rahim A.", "Sadia M.", "Tanvir H."][i % 4],
      rating: i % 3 ? 5 : 4,
      text: [
        "A lovely addition to our family pantry. Carefully packed and full of flavour.",
        "The quality was lovely and the packaging arrived in great condition.",
        "Just what we needed for our everyday cooking. Will order again.",
      ][i % 3],
      status: "Approved",
      date: new Date(now.getTime() - (i + 1) * DAY).toISOString(),
      verified: false,
      sample: true,
    },
  ]);
  s.investments.unshift({
    id: "pending-investment",
    userId: "inv-002",
    amount: taka(25000),
    method: "Bank transfer",
    reference: "DEMO-TOPUP-003",
    status: "Pending",
    date: new Date(now.getTime() - 2 * 3600000).toISOString(),
  });
  s.withdrawals = [
    {
      id: "seed-paid",
      userId: "inv-001",
      amount: taka(2500),
      kind: "profit",
      method: "bKash",
      account: "01700000000",
      date: new Date(now.getTime() - 28 * DAY).toISOString(),
      reviewedAt: new Date(now.getTime() - 27 * DAY).toISOString(),
      status: "Paid",
      reference: "DEMO-PAID-001",
    },
    {
      id: "seed-pending",
      userId: "inv-001",
      amount: taka(1500),
      kind: "profit",
      method: "bKash",
      account: "01700000000",
      date: new Date(now.getTime() - 3 * 3600000).toISOString(),
      status: "Pending",
    },
  ];
  log(
    s,
    "Prototype workspace ready",
    "Customer, investor and master portals are connected.",
    "System",
    now.toISOString(),
  );
  return s;
}
