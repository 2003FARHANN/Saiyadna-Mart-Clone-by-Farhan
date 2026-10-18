import test from "node:test";
import assert from "node:assert/strict";
import * as D from "../domain.js";
const now = new Date("2026-10-17T15:30:00Z");
function fixture() {
  const s = D.seedState(now);
  s.orders = [];
  s.expenses = [];
  s.profitEntries = [];
  s.withdrawals = [];
  s.activity = [];
  s.investments = s.investments.filter((x) => x.status === "Approved");
  return s;
}
const customer = (s) => s.users.find((u) => u.role === "customer");
const admin = (s) => s.users.find((u) => u.role === "admin");
const investor = (s) => s.users.find((u) => u.id === "inv-001");
const cart = [
  { productId: "black-honey", variantId: "black-honey-0", quantity: 1 },
];
function deliver(s, o, date = now) {
  for (const status of ["Processing", "Shipped", "Delivered"])
    D.changeOrderStatus(s, admin(s), o.id, status, date);
}
test("pack-specific price, coupon cap, and post-discount shipping threshold", () => {
  const s = fixture();
  const q = D.quote(
    s,
    [{ productId: "black-honey", variantId: "black-honey-1", quantity: 1 }],
    { city: "Dhaka" },
    "FRESH10",
  );
  assert.equal(q.subtotal, D.taka(589));
  assert.equal(q.discount, D.taka(58.9));
  assert.equal(q.shipping, D.taka(60));
  assert.equal(q.total, D.taka(590.1));
  assert.equal(
    D.quote(s, [{ ...cart[0], quantity: 5 }], { city: "Dhaka" }, "FRESH10")
      .discount,
    D.taka(200),
  );
  const p = s.products[0].variants[0];
  p.price = D.taka(800);
  assert.equal(D.quote(s, cart, { city: "Dhaka" }).shipping, 0);
  assert.equal(
    D.quote(s, cart, { city: "Dhaka" }, "FRESH10").shipping,
    D.taka(60),
  );
});
test("empty, negative, fractional, missing and combined overstock baskets are rejected", () => {
  const s = fixture();
  assert.throws(() => D.quote(s, [], {}));
  for (const quantity of [-1, 0, 1.5, NaN, 100])
    assert.throws(() => D.quote(s, [{ ...cart[0], quantity }], {}));
  assert.throws(() =>
    D.quote(s, [{ productId: "missing", variantId: "x", quantity: 1 }], {}),
  );
  s.products[0].variants[0].stock = 3;
  assert.throws(() =>
    D.quote(
      s,
      [
        { ...cart[0], quantity: 2 },
        { ...cart[0], quantity: 2 },
      ],
      {},
    ),
  );
  const q = D.quote(s, [cart[0], cart[0]], {});
  assert.equal(q.items.length, 1);
  assert.equal(q.items[0].quantity, 2);
});
test("customer must save a valid address; role guards apply", () => {
  const s = fixture(),
    u = customer(s);
  u.address = null;
  assert.throws(() => D.placeOrder(s, u, { cart }, now), /address/);
  assert.throws(() => D.placeOrder(s, investor(s), { cart }, now), /account/);
  assert.throws(() =>
    D.validateAddress({
      name: "Test",
      phone: "1234",
      city: "Dhaka",
      street: "House 12, Road 4",
    }),
  );
});
test("checkout reserves stock and duplicate request does not create another order", () => {
  const s = fixture(),
    stock = s.products[0].variants[0].stock;
  const a = D.placeOrder(s, customer(s), { cart, requestId: "same-id" }, now),
    b = D.placeOrder(s, customer(s), { cart, requestId: "same-id" }, now);
  assert.equal(a.id, b.id);
  assert.equal(s.orders.length, 1);
  assert.equal(s.products[0].variants[0].stock, stock - 1);
  assert.equal(D.stats(s, "today", now).netSales, 0);
});
test("delivery recognises sale and exactly allocates the integer-paisa profit pool", () => {
  const s = fixture(),
    o = D.placeOrder(s, customer(s), { cart }, now);
  deliver(s, o);
  const m = D.stats(s, "today", now),
    event = s.profitEntries[0];
  assert.equal(m.netSales, o.netSales);
  assert.equal(m.netProfit, o.netSales - o.cogs);
  assert.equal(
    event.allocations.reduce((a, x) => a + x.amount, 0),
    Math.round(m.netProfit * 0.25),
  );
  assert.equal(
    event.allocations.find((x) => x.userId === "inv-001").amount,
    Math.trunc(Math.round(m.netProfit * 0.25) * 0.6),
  );
  assert.throws(() => D.changeOrderStatus(s, admin(s), o.id, "Delivered", now));
  assert.equal(s.profitEntries.length, 1);
});
test("cancellation restores stock once and never recognises sales", () => {
  const s = fixture(),
    stock = s.products[0].variants[0].stock,
    o = D.placeOrder(s, customer(s), { cart }, now);
  D.changeOrderStatus(s, admin(s), o.id, "Cancelled", now);
  assert.equal(s.products[0].variants[0].stock, stock);
  assert.equal(s.profitEntries.length, 0);
  assert.throws(() => D.changeOrderStatus(s, admin(s), o.id, "Cancelled", now));
});
test("refund reverses original investor allocation despite a later rate/capital change", () => {
  const s = fixture(),
    stock = s.products[0].variants[0].stock,
    o = D.placeOrder(s, customer(s), { cart }, now);
  deliver(s, o);
  const original = structuredClone(s.profitEntries[0]);
  s.settings.investorPoolPct = 90;
  s.investments.push({
    id: "extra",
    userId: "inv-002",
    amount: D.taka(900000),
    status: "Approved",
    date: now.toISOString(),
  });
  D.changeOrderStatus(s, admin(s), o.id, "Refunded", now);
  assert.equal(D.stats(s, "today", now).netProfit, 0);
  assert.equal(D.earnings(s, "inv-001"), 0);
  assert.equal(s.products[0].variants[0].stock, stock);
  assert.equal(
    s.profitEntries[1].allocations[0].amount,
    -original.allocations[0].amount,
  );
});
test("pending capital is excluded and approved contribution affects only future allocations", () => {
  const s = fixture(),
    u = investor(s),
    before = D.capital(s, u.id);
  const x = D.requestInvestment(
    s,
    u,
    D.taka(50000),
    "Bank transfer",
    "DEMO-NEW",
    now,
  );
  assert.equal(D.capital(s, u.id), before);
  D.reviewInvestment(s, admin(s), x.id, "Approved");
  assert.equal(D.capital(s, u.id), before + D.taka(50000));
  assert.throws(() => D.reviewInvestment(s, admin(s), x.id, "Approved"));
  assert.throws(() =>
    D.requestInvestment(s, u, D.taka(50000), "Bank transfer", "DEMO-NEW", now),
  );
});
test("withdrawal reserves funds, prevents overspend, and rejection releases reserve", () => {
  const s = fixture(),
    u = investor(s),
    o = D.placeOrder(s, customer(s), { cart }, now);
  deliver(s, o);
  const before = D.wallet(s, u.id).profitAvailable;
  const w = D.requestWithdrawal(
    s,
    u,
    {
      amount: before - 1,
      kind: "profit",
      method: "bKash",
      account: "01700000000",
    },
    now,
  );
  assert.equal(D.wallet(s, u.id).profitAvailable, 1);
  assert.throws(() =>
    D.requestWithdrawal(
      s,
      u,
      { amount: 2, kind: "profit", method: "bKash", account: "01700000000" },
      now,
    ),
  );
  D.reviewWithdrawal(s, admin(s), w.id, "Rejected");
  assert.equal(D.wallet(s, u.id).profitAvailable, before);
});
test("paying a capital withdrawal changes capital, and duplicate payment is rejected", () => {
  const s = fixture(),
    u = investor(s),
    before = D.capital(s, u.id),
    w = D.requestWithdrawal(
      s,
      u,
      {
        amount: D.taka(10000),
        kind: "capital",
        method: "Bank transfer",
        account: "DEMO-ACCOUNT",
      },
      now,
    );
  assert.equal(D.capital(s, u.id), before);
  D.reviewWithdrawal(s, admin(s), w.id, "Paid", "DEMO-TRANSFER");
  assert.equal(D.capital(s, u.id), before - D.taka(10000));
  assert.throws(() =>
    D.reviewWithdrawal(s, admin(s), w.id, "Paid", "DUPLICATE"),
  );
});
test("negative adjustments after a withdrawal request prevent overpayment", () => {
  const s = fixture(),
    u = investor(s),
    o = D.placeOrder(s, customer(s), { cart }, now);
  deliver(s, o);
  const w = D.requestWithdrawal(
    s,
    u,
    {
      amount: D.wallet(s, u.id).profitAvailable,
      kind: "profit",
      method: "bKash",
      account: "01700000000",
    },
    now,
  );
  D.addExpense(s, admin(s), D.taka(100), "Packaging", now);
  assert.throws(
    () => D.reviewWithdrawal(s, admin(s), w.id, "Paid", "DEMO-TRANSFER"),
    /Balance changed/,
  );
});
test("agent commission needs coupon, delivery, payment and full 7-day hold", () => {
  const s = fixture(),
    o = D.placeOrder(
      s,
      customer(s),
      { cart, coupon: "PARTNER29", payment: "bKash demo" },
      now,
    );
  assert.equal(o.commission, Math.round(o.netSales * 0.29));
  assert.equal(D.commissionState(s, o, now), "Awaiting delivery");
  deliver(s, o);
  assert.equal(D.commissionState(s, o, now), "On hold");
  const after = new Date(now.getTime() + 7 * D.DAY);
  assert.equal(D.commissionState(s, o, after), "Ready");
  D.payCommission(s, admin(s), o.id, "DEMO-AGENT", after);
  assert.equal(D.commissionState(s, o, after), "Paid");
  D.changeOrderStatus(s, admin(s), o.id, "Refunded", after);
  assert.equal(D.commissionState(s, o, after), "Recovery due");
});
test("commission snapshot is preserved after partner-rate edits", () => {
  const s = fixture(),
    o = D.placeOrder(s, customer(s), { cart, coupon: "PARTNER29" }, now),
    saved = o.commission;
  s.partners[0].rate = 50;
  assert.equal(o.commission, saved);
  assert.equal(o.commissionRate, 29);
});
test("period boundaries use Bangladesh calendar months and include current month", () => {
  assert.equal(D.dateKey(D.periodStart("1", now)), "2026-10-01");
  assert.equal(D.dateKey(D.periodStart("5", now)), "2026-06-01");
  assert.equal(D.dateKey(D.periodStart("7d", now)), "2026-10-11");
  assert.equal(D.dateKey("2026-10-16T20:00:00Z"), "2026-10-17");
});
test("seeded reports and chart reconcile with event ledger for every reporting period", () => {
  const s = D.seedState(now);
  for (const period of ["today", "7d", "1", "2", "3", "4", "5"]) {
    const m = D.stats(s, period, now),
      rows = D.series(s, period, now),
      events = s.profitEntries.filter((x) => D.inPeriod(x.date, period, now));
    assert.equal(
      rows.reduce((a, x) => a + x.sales, 0),
      m.netSales,
    );
    assert.equal(
      rows.reduce((a, x) => a + x.profit, 0),
      m.netProfit,
    );
    assert.equal(
      events.reduce((a, x) => a + x.netProfit, 0),
      m.netProfit,
    );
  }
});
test("non-admin mutation attempts and inactive investor requests are rejected", () => {
  const s = fixture();
  assert.throws(() => D.addExpense(s, customer(s), 100, "Oops", now));
  const u = investor(s);
  u.active = false;
  assert.throws(() => D.requestInvestment(s, u, 100, "Bank", "X", now));
});
