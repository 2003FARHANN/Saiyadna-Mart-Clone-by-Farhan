# Prototype verification

## Automated accounting checks

`npm test`: 16 Node.js tests cover pack prices, discounts/delivery, invalid baskets, duplicate-line stock checks, address requirement, role checks, order idempotency, stock reservation, delivered revenue, exact integer-paisa allocation, cancellation, refund snapshots, contribution approval, withdrawal reservation/rejection/payout, balance changes, commission hold/rate snapshots, Bangladesh date boundaries and chart/ledger reconciliation.

## DOM integration checks

Nine scenarios executed in an isolated jsdom environment with actual application event handlers:

1. Catalogue search, categories and combo filtering.
2. Pack selection, basket, coupon, login redirect, saved address and checkout.
3. Portal guard, rejected password, master fulfilment and recognised profit.
4. All investor reporting periods, pending contributions, reserved withdrawals and absence of customer address in the investor view.
5. Master investment approval and recorded payout update the investor ledger.
6. Verified-purchase review, approval and HTML escaping.
7. Product create/edit/archive with storefront updates.
8. Investor account creation and storefront/allocation settings.
9. All investor/master routes, new account sign-in, activity dialog and simulated cross-tab storage event.

Additional focused checks cover the master-selected homepage combo, archived-offer removal, tagline propagation and login-tab switching from registration.

## Build and assets

The source build produces a static `dist/` directory with local product assets and ES modules. JavaScript syntax, required files and archive contents are checked before packaging. The test data is created at runtime and no personal credentials, real customer records or payment keys are bundled.

## Verification limits

DOM simulation does not verify visual layout, real browser storage-event delivery, touch behaviour or provider deployment. An interactive browser preview was unavailable in the build environment, so no desktop/mobile screenshot or real-browser visual pass was performed. The ZIP has not been deployed to the user's Vercel account. Check the deployed URL on desktop and mobile using `DEMO-WALKTHROUGH.md` before the interview.

Tests verify demo logic; they do not turn client-side checks into production security or add concurrent database guarantees.
