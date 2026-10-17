# ৭ মিনিটের interview demo

শুরুতে বলুন: “এটি customer, investor এবং master workflow দেখানোর interactive prototype। এখন data browser-local; real auth, payment এবং shared backend production phase-এ যুক্ত হবে।”

## 1. Storefront — ১ মিনিট

Homepage-এর offer banner, category, search ও pack-size selection দেখান। 500 GM থেকে 1 KG করলে price ও basket item বদলায়। Combo offer-এর Buy now checkout shortcut খুলবে।

Customer login: `customer@saiyadna.demo` / `Customer123!`।

একটি product basket-এ দিন; quantity বদলান। `FRESH10` coupon apply করুন। Address-এ name, 11-digit demo phone, city ও পূর্ণ address দিন। COD অথবা bKash simulation বেছে Place demo order চাপুন। Order number নোট করুন।

বোঝান: “Price, stock এবং discount business-rule function দিয়ে আবার calculate হচ্ছে। Saved delivery address ছাড়া order নেওয়া হচ্ছে না। এই bKash option শুধু simulation।”

## 2. Master fulfilment — ১ মিনিট

একই URL নতুন browser tab-এ খুলুন। Master login: `SM-MASTER` / `Master123!`। একটি tab-এর login অন্য tab-কে sign out করে না।

Orders-এ নতুন order খুলে ক্রমান্বয়ে Processing → Shipped → Delivered করুন। প্রথম customer tab-এর My orders-এ status বদল দেখা যাবে।

বোঝান: “Checkout-এ stock reserve হয়। Delivered হওয়ার পরে sales এবং investor profit ledger-এ entry হয়। Cancel/refund নির্দিষ্ট transition মেনে চলে।”

## 3. Investor dashboard — ১ মিনিট

তৃতীয় tab-এ Investor login: `SM-INV-1001` / `Investor123!`।

Today, This month, 2 months, 5 months select করুন। Net sales, net profit, personal returns, capital এবং traffic দেখান। Business insights-এ product cost/commission/expense breakdown দেখান।

বোঝান: “Seed history sample। 25% pool demonstration assumption; investor capital ratio অনুযায়ী allocation হয়। Profit guaranteed নয়।”

## 4. Investment approval — ১ মিনিট

Investor → Add investment → ৳10000 → reference `DEMO-INTERVIEW-001` → submit। প্রথমে Pending, capital অপরিবর্তিত থাকবে।

Master → Funds & payouts → matching investment Approve। Investor tab-এ capital ৳10000 বাড়বে।

বোঝান: “Pending contribution দিয়ে returns পাওয়া যায় না। Approval-এর পরে future profit events-এ share হিসাব হয়।”

## 5. Withdrawal — ১ মিনিট

Investor → Request withdrawal → Profit → ৳500 → demo number `01700000000`। Available balance কমবে এবং request Pending হবে।

Master → Funds & payouts → matching withdrawal Mark paid → reference দিন। Investor payout history-তে Paid হবে। আরেকটি ছোট request Reject করে reserved balance ফেরত দেখাতে পারেন।

বোঝান: “একই balance বারবার withdraw করা যায় না। Request-এ reserve এবং payout-এর আগে আবার balance validation আছে। এখানে কোনো টাকা transfer হয় না।”

## 6. Reviews ও catalogue — ১ মিনিট

Customer product page-এ rating ও review দিন। Master → Product reviews → Approve। Customer page-এ review দেখা যাবে।

Master → Products → Edit একটি product-এর pack price/stock; storefront-এ update দেখুন। Archive করলে public catalogue থেকে সরবে। Store settings-এ homepage headline বা featured combo বদলান।

## 7. Technical explanation — ১ মিনিট

`domain.js` business rules, `views.js` rendering, `app.js` event handling, `store.js` local data—এই চারটি file-এর সম্পর্ক বোঝান। `npm test` চালিয়ে ১৬টি rule test দেখাতে পারেন।

সৎভাবে বলুন: “AI-assisted development করেছি। আমি এই order, stock, withdrawal এবং refund flow বুঝে verify করেছি। Production-এ browser-এর role guard যথেষ্ট নয়; server validation ও database transactions লাগবে।”

## Demo শেষে

Master → Store settings → Reset demo data দিলে শুরু অবস্থায় ফিরবে। Reset শুধু demo presentation শুরু করার জন্য; আপনার local changes মুছে যাবে।

একই browser এবং একই deployed origin-এর tabs ব্যবহার করুন। অন্য browser, incognito profile, device বা অন্য deployment URL-এর data আলাদা। একসঙ্গে একাধিক tab-এ write করার race protection এই prototype-এ নেই; demo actions ক্রমান্বয়ে করুন।
