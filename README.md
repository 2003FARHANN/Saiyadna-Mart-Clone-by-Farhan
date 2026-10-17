# Saiyadna Mart — 3 Portal Prototype

Customer storefront, investor dashboard এবং master workspace—একটি connected presentation demo। Source code ও deploy করার জন্য তৈরি `dist/` folder দুটোই এই ZIP-এ আছে।

**এটি browser-local prototype।** Real payment, secure server login, shared database বা cross-device realtime এখনো যুক্ত নেই। একই browser-এর একই site-এর tabs-এ পরিবর্তন দেখা যায়। অন্য browser/device নিজের আলাদা sample data পাবে। শুধু কাল্পনিক তথ্য ব্যবহার করুন।

## 1. Vercel-এ live করুন

সবচেয়ে সহজ পথ—terminal বা GitHub প্রয়োজন নেই:

1. ZIP extract করুন। ভিতরে `saiyadna-mart-prototype` folder পাবেন।
2. [vercel.com/drop](https://vercel.com/drop) খুলে আপনার Vercel account-এ sign in করুন।
3. Project-এর ভিতরের **`dist` folder** page-এ drag করুন। এই folder-এর সরাসরি ভিতরে `index.html` আছে।
4. Team ও project name বেছে **Deploy** করুন। পাওয়া URL খুলুন।
5. Login screen-এর Customer / Investor / Master tab থেকে demo ব্যবহার করুন।

ZIP নিজে drag না করে extract করা `dist` folder দিন। Website local computer-এ দেখতে `index.html` double-click করবেন না; JavaScript modules-এর জন্য HTTP server লাগে।

Vercel Drop-এর বর্তমান official নির্দেশনা: [Deploying to Vercel](https://vercel.com/docs/deployments#vercel-drop), checked 17 October 2026.

### GitHub / Vercel import বিকল্প

Project folder-এর source files একটি GitHub repository-তে রাখুন এবং Vercel-এ Import করুন।

| Setting               | Value                          |
| --------------------- | ------------------------------ |
| Root directory        | যে folder-এ `package.json` আছে |
| Framework preset      | Other                          |
| Build command         | `npm run build`                |
| Output directory      | `dist`                         |
| Environment variables | প্রয়োজন নেই                    |

`vercel.json` এই build ও output settings নির্ধারণ করে। CLI চাইলে project root থেকে `npx vercel --prod` চালাতে পারেন। Source edit করার পর `npm run build` চালিয়ে নতুন `dist` deploy করুন।

## 2. Demo login

| Portal          | ID / email               | Password       | URL suffix          |
| --------------- | ------------------------ | -------------- | ------------------- |
| Customer        | `customer@saiyadna.demo` | `Customer123!` | `/#/login/customer` |
| Investor        | `SM-INV-1001`            | `Investor123!` | `/#/login/investor` |
| Second investor | `SM-INV-1002`            | `Investor123!` | `/#/login/investor` |
| Master          | `SM-MASTER`              | `Master123!`   | `/#/login/admin`    |

Credentials public এবং code-এ আছে। Login form-এ default account আগে থেকেই দেওয়া থাকে। Customer নতুন demo account বানাতে পারে; master নতুন investor ID/password তৈরি করতে পারে।

## 3. কী কাজ করে

**Customer:** product search, category ও price sort, pack size, top combo offer, buy-now checkout shortcut, basket, quantity, coupon, required delivery address, COD / simulated bKash, order tracking, product rating ও moderated review। Buy now checkout খুলে দেয়; address ও confirmation ছাড়া order submit হয় না।

**Investor:** ব্যক্তিগত ID, active capital, available returns, sales/net profit/traffic, Today/7 days/1–5 calendar-month filters, contribution requests, profit অথবা capital withdrawal, approval history এবং CSV export। Investor UI-তে customer address/phone দেখানো হয় না।

**Master:** products/pack prices/costs/stock, archive/restore, order fulfilment/cancel/refund, investor account/password/status, investment approval/rejection, withdrawal payout/rejection, agent commission settings/payout, review moderation, operating expense, coupons, delivery fees, homepage text/featured combo, investor allocation rate, pause orders, activity log এবং demo reset।

Products archive করলে storefront থেকে সরে যায়; আগের order history অক্ষত থাকে। Bundle stock আলাদা SKU হিসেবে রাখা হয়েছে; component-level stock deduction এই prototype-এর অংশ নয়। Product image দিতে existing `assets/...` path বা HTTPS image URL ব্যবহার করুন।

## 4. Local development

Node.js 20 বা newer প্রয়োজন। App-এর কোনো runtime package dependency নেই।

```bash
npm run dev
```

Terminal-এ দেখানো `http://localhost:3000` খুলুন। Source edit করলে server বন্ধ করে command আবার চালান; এই ছোট server-এ hot reload নেই।

```bash
npm test
npm run build
```

`npm test` ১৬টি accounting/business-rule test চালায়। Build `dist/` নতুন করে তৈরি করে। Source files-এ edit করুন; `dist/`-এর edits পরের build-এ মুছে যাবে।

## 5. হিসাব কীভাবে চলে

- সব amount integer **paisa** হিসেবে রাখা হয়: ৳100 = 10000। Display-তে taka দেখায়।
- Checkout stock reserve করে। Pending/Processing/Shipped orders এখনো sales হিসেবে গণনা হয় না। Delivered হলে sale ও profit allocation হয়।
- Net sales = delivered product value − coupon discount − recognised refunds। Delivery fee হিসাবের বাইরে pass-through হিসেবে ধরা হয়েছে।
- Net profit = net sales − product costs − agent commissions − operating expenses। এটি prototype-এর সংজ্ঞা; tax/VAT/other business liabilities model করা হয়নি।
- Default investor pool = net profit-এর **25%**, active approved capital-এর অনুপাতে ভাগ। এটি একটি configurable demo assumption; guaranteed return বা company policy নয়।
- Contribution pending থাকলে capital বাড়ে না। Master approve করার পর future allocation-এ অংশ নেয়। New investor আগের profit পায় না।
- Negative profit/expenses negative allocation তৈরি করতে পারে। Pending withdrawals available balance reserve করে; payout-এর সময় আবার balance check হয়।
- Cancel stock ফেরত দেয়। Delivered order refund হলে original profit allocation reverse হয়, পরে rate/capital বদলালেও। Refund-এর পরে আগে paid profit balance-এর ঘাটতি future returns কমাতে পারে; automatic money recovery নেই।
- Bangladesh timezone `Asia/Dhaka` ব্যবহার করা হয়েছে। “2 months” মানে আগের calendar month-এর শুরু থেকে আজ পর্যন্ত; একইভাবে 3/4/5 months।
- ১৫৬ দিন পর্যন্ত sample history প্রথমবার seed হয়। ভবিষ্যতে নতুন business history স্বয়ংক্রিয়ভাবে যোগ হয় না; নতুন demo actions records তৈরি করে। Traffic sample history + এই browser-এর local storefront visits।

### Partner guide বনাম investor returns

আপনার দেওয়া “সায়্যিদনা মার্ট -পার্টনার এজেন্ট নির্দেশিকা.pdf” sales-agent programme বর্ণনা করে। সেই guide-এর **29% coupon-attributed commission**, **7-day hold**, delivered/paid eligibility এবং manual weekly payout workflow master portal-এ আলাদা রাখা হয়েছে।

Clicks alone commission তৈরি করে না। Demo partner coupon `PARTNER29`; সাধারণ customer offer `FRESH10`। Agent-এর 29% sales commission আর capital investor-এর 25% net-profit pool এক জিনিস নয়। 25% pool, operating costs, stock, alternate pack prices ও investor records illustrative। Company confirm করার পরে production rules চূড়ান্ত করতে হবে।

## 6. Source map

| File                        | দায়িত্ব                                            |
| --------------------------- | -------------------------------------------------- |
| `index.html`                | App entry ও page metadata                          |
| `styles.css`                | Responsive storefront/dashboard styling            |
| `views.js`                  | Page ও component HTML templates                    |
| `app.js`                    | Navigation, buttons, forms ও dialogs               |
| `store.js`                  | Local persistence, session ও demo sign-in          |
| `domain.js`                 | Data model, stock, orders, accounting, sample data |
| `tests/domain.test.mjs`     | Business-rule regression tests                     |
| `tools/build.mjs`           | Source থেকে deployable `dist/`                     |
| `tools/serve.mjs`           | Local HTTP server                                  |
| `assets/asset-sources.json` | Brand/product image sources                        |
| `DEMO-WALKTHROUGH.md`       | Interview-এ দেখানোর demo flow                      |
| `INTERVIEW-NOTES.md`        | Code বোঝার ছোট learning guide                      |
| `PRODUCTION-NOTES.md`       | Real shared system তৈরির পরের ধাপ                  |
| `QA-REPORT.md`              | কী যাচাই হয়েছে ও verification limit                |

## 7. Reset ও troubleshooting

- Master → Store settings → Reset demo data: এই browser-এর edited records মুছে sample state ফিরিয়ে আনে এবং sign out করে।
- Blank page হলে extracted `dist` folder deploy করেছেন কি না দেখুন। Browser developer tools → Console-এর error পড়ুন।
- Login না হলে সঠিক portal tab, account status এবং demo password মিলিয়ে নিন।
- অন্য device-এ changes না দেখা এই prototype-এর expected behaviour। Cross-device updates-এর জন্য backend প্রয়োজন।
- Browser storage blocked/full হলে changes save নাও হতে পারে। Site data clear করলে local demo records হারাবে।
- Source header settings `vercel.json` দিয়ে root project deployment-এ apply হয়। শুধু `dist` Drop করলে সেই root configuration যায় না; static demo তখনও চলে।

## Sources

Brand ও product images: [Saiyadna Mart](https://www.saiyadnamart.com/), individual sources in `assets/asset-sources.json`। This is a concept prototype inspired by the supplied website, not a claim of an official published replacement. Product descriptions, cost prices, historic sales, investors and reviews are sample content.

Google Fonts is an optional external styling request; system fonts are used if unavailable. All product images are included locally. No payment SDK, tracking script or external API is connected.
