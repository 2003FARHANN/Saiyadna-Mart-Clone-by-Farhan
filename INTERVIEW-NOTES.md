# নিজের prototype বুঝে interview দিন

লক্ষ্য মুখস্থ উত্তর নয়—একটি feature-এর data flow ও failure case বোঝা। যে অংশ এখনো জানেন না, সেটা পরিষ্কার বলুন।

## এই project-এর flow

1. User button click করে → `app.js` event handler চলে।
2. Handler `Store.transact(...)` দিয়ে current data নেয়।
3. `domain.js` role, amount, stock, state transition ও business rules যাচাই করে।
4. সফল হলে `store.js` browser storage-এ নতুন state save করে।
5. Change event-এ `views.js` নতুন HTML render করে। একই site-এর অন্য tab `storage` event পায়।

এই flow server-based application-এ হবে: browser → API → authentication/authorization → database transaction → response → UI update।

## ৮টি প্রশ্নের উত্তর তৈরি রাখুন

**১. Frontend আর backend কী?** Frontend user-এর browser-এ interface ও interaction চালায়। Backend trusted server-এ data access, permissions, payment verification ও shared records নিয়ন্ত্রণ করে। এই ZIP frontend prototype।

**২. Authentication আর authorization-এর পার্থক্য?** Authentication: আপনি কে? Authorization: আপনি কী করতে পারবেন? Investor login করলেই master action করতে পারবে না। এখানে UI check আছে; production API-তেও প্রতিটি operation-এ role/ownership check লাগবে।

**৩. Product price browser থেকে পাঠালে সমস্যা কী?** User browser request বদলাতে পারে। Server trusted product price থেকে total calculate করবে। এখানে `quote()` central calculation দেখায়; production-এ একই rule server-এ রাখতে হবে।

**৪. একই product-এর শেষ unit দুইজন কিনলে?** “Stock > 0” দেখে আলাদা update যথেষ্ট নয়। Database transaction ও conditional stock update প্রয়োজন। এই local demo-তে stock validation আছে, concurrent buyer race protection নেই।

**৫. Double-click বা retry-তে duplicate order/payment কীভাবে আটকাবেন?** Idempotency key দিয়ে একই request দ্বিতীয়বার এলে আগের result ফেরত দিন। `placeOrder()`-এ request ID example আছে। Production-এ database unique constraint এবং payment event ID deduplication লাগবে।

**৬. Sales আর profit কি একই?** না। Product sales থেকে cost বাদ দিলে gross profit। এই prototype-এ তার থেকে agent commission ও operating expense বাদ দিলে net profit। Delivery fee pass-through ধরে বাইরে রাখা হয়েছে। Business-এর actual accounting policy আগে confirm করতে হবে।

**৭. Refund-এর সময় investor rate বদলে গেলে?** বর্তমান rate দিয়ে refund calculate করলে ভুল হবে। Original allocation snapshot reverse করতে হবে। `changeOrderStatus()`-এর refund branch সেই কাজ করে।

**৮. Realtime কীভাবে করবেন?** এখানে একই browser-এর tabs storage event পায়। একাধিক device-এর জন্য shared database এবং server events/WebSocket/subscription দরকার। Realtime notification পেলেই finance value বিশ্বাস না করে authoritative server state আবার fetch করতে হবে।

## Bug ধরার পদ্ধতি

একটি bug report লিখুন: steps → expected result → actual result → browser/device → error/log। তারপর smallest reproducible case বানান।

| সমস্যা                | প্রথমে কোথায় দেখবেন                        | সমাধানের ধরন                                 |
| --------------------- | ------------------------------------------ | -------------------------------------------- |
| Cart total ভুল        | variant ID, quantity, coupon, delivery     | এক জায়গায় trusted total calculation          |
| Stock negative        | simultaneous request, repeated submit      | atomic reservation + idempotency             |
| Investor balance ভুল  | pending reserve, paid withdrawals, refunds | ledger reconciliation + snapshot reversal    |
| অন্যের order দেখা যায় | API ownership check                        | server-side record authorization             |
| Page blank            | Console, module path, deployment output    | সঠিক `dist` deploy ও missing asset fix       |
| Review-এ HTML চালু হয় | unescaped user text                        | safe text rendering; server-side validation  |
| Dashboard ধীর         | repeated loops/query/date formatting       | measure, reuse results, DB aggregation/index |

## আজ যেটুকু practice করবেন

- HTML form, label, required field এবং button type বুঝুন।
- CSS flex/grid ও media query দেখে product grid mobile-এ কীভাবে বদলায় বলুন।
- JS `const`, functions, arrays, `map/filter/reduce`, objects, events, modules ও `try/catch` practice করুন।
- `quote()` পড়ে একটি product price, discount এবং delivery হাতে হিসাব করুন।
- একটি order place করে domain test-এর cancellation/refund case চালান।
- Git-এর add/commit/branch ও browser Console/Network panel ব্যবহার শিখুন।

একটি ছোট change নিজে করুন: delivery fee বদলানো, নতুন pack যোগ করা, বা hero text edit। তারপর কোথায় data বদলাল এবং কোন flow-তে প্রভাব পড়ল ব্যাখ্যা করুন। কাজটা নিজে বোঝাতে পারলে presentation অনেক বেশি বিশ্বাসযোগ্য হবে।
