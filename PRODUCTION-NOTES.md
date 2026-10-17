# Production phase: replace demo boundaries

This package is ready to host as a presentation prototype. It is not ready to handle real customer accounts, money or business records.

## Shared backend and identity

Create a server API and durable relational database for users, addresses, products, variants, orders, order items, reviews, investment contributions, withdrawals, profit events, allocations and audit events. Use server-managed sessions, password hashing and server-side role/record ownership checks. Investor APIs should return only authorised aggregates and that investor's records. Client code and localStorage are readable/editable by anyone and are not access-control boundaries.

Demo logins must not ship as production credentials. Use secure account provisioning/reset and an additional confirmation mechanism for privileged money operations. Keep provider secrets on the server.

## Orders and payments

Calculate prices, discounts and delivery charges on the server. Reserve stock atomically with the order, store immutable item-price/cost snapshots, deduplicate retries and handle reservation expiry. Decide whether bundles consume independent bundle inventory or component inventory.

Replace simulated bKash and payout actions with the business's selected payment provider/manual reconciliation process. Verify payment events on the server; use unique event/transaction IDs. Specify partial refunds, returns, failed delivery, COD collection, VAT, shipping costs and payment fees before implementing real settlement.

## Investments and reporting

Confirm the actual investor agreement and business definition of net profit. The 25% pool is a placeholder; the supplied sales-agent guide does not establish capital-investor return rules. Agree on loss allocation, inactive capital, settlement windows, capital withdrawal eligibility, recovery after paid returns, minimum withdrawals and rounding.

Move the event ledger and allocation snapshots to database transactions. Protect simultaneous withdrawals with atomic reservations and revalidation. Use immutable audit records and explicit reversal entries. Use approval steps and transfer references that match the real business process. The existing prototype formulas are implementation examples, not financial policy.

## Cross-device updates and operations

Use authorised subscriptions, server events or polling against the shared backend. A browser storage event only reaches tabs in the same browser origin. The prototype's whole-state localStorage writes have no multi-user locking; simultaneous writes can overwrite one another.

Replace sample traffic with consent-appropriate analytics and define unique visitors/conversion. Add monitoring, backups, rate limits, recovery, error reporting and meaningful tests for concurrent stock/payments/withdrawals. Review mobile layout and accessibility in actual browsers before launch.

## Existing demo constraints

- No real payment collection, payout, refund, delivery integration or email/SMS.
- Reviews and business history are sample data until the user creates local demo records.
- Sessions are per tab; state is per browser origin. Clearing browser storage deletes local changes.
- Customer order screen shows the latest 20 orders; investor ledger displays the latest 30 entries with full period CSV export.
- Agent commission screen displays the latest 25 attributed orders; production needs full filtering/pagination and weekly settlement batches.
- Activity log keeps the latest 120 local events and is editable client-side.
- Complete refunds only; no partial refund or automated recovery of funds already paid.
- Product image upload is not connected; the editor accepts local asset paths or HTTPS image links.
- Account recovery, customer-support tools and production policy pages are outside this prototype.
