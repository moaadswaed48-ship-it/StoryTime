# Payment providers for one-time online card payments (Israel) - raw research

Research date: 2026-11-22. Need: a very small Israeli business sells 1/3/12-month access passes on a website (one-time payment, no auto-renewal), buyers are Israeli parents and kindergarten teachers; later possibly foreign buyers.

## How to read this file

- Everything below comes from the providers' own sites or developer docs, opened by me, unless marked **[third party]**. "Not stated" means the page I opened did not say it; it does **not** mean the feature is missing.
- I read short product pages, developer reference pages and fee pages. Several provider home pages are marketing-only and give no technical detail. gov.il-style blocking did not apply here, but PayPlus's home page returned 403 once (the English page opened fine).
- Fees are quoted exactly as published, with the page they come from. All Israeli prices are before VAT unless stated. Fees change; confirm in writing before signing.
- "Hosted page" = the customer pays on a page run by the provider (redirect or iframe), so card numbers never touch your site; this is the least-work, lowest-PCI option.

---

## 1. Tranzila

- **Hosted page / embedded**: both. Hosted payment page ("דף סליקה"), iframe payment form, and "Hosted Fields" (embedded fields) per the home page and docs (https://www.tranzila.com/, https://docs.tranzila.com/docs/payments-and-billing/hosted-fields). The legacy iframe is deprecated with official support ending **1 January 2027**; docs recommend migrating to "DirectNG" (https://docs.tranzila.com/docs/payments-and-billing/iframe-integration).
- **API / webhook**: API V2 (header-based app key) and a **Notify URL** (`notify_url_address`) that receives the transaction result server-to-server in parallel with the redirect; can also be set in Tranzila settings (iframe doc). Bit flow ends with a webhook on completion (llms-full.txt on tranzila.com).
- **Bit / Apple Pay / Google Pay**: Bit via `bit_pay=1` or settings; Google Pay via `google_pay=1` (new iframe only); Apple Pay is added after registration and domain verification, or via hosted fields (iframe doc). A Bit API page notes limits with hosted fields/3DS - check your terminal.
- **Automatic receipt / invoice**: yes - "Digital Invoice" product automatically generates a digitally signed tax invoice after successful payment, stated as compliant with Tax Authority requirements; home page says the invoicing system is Tax-Authority approved (https://www.tranzila.com/llms-full.txt, https://www.tranzila.com/).
- **Published fees**: only "mobile payments from 29 NIS per month" (home page); the English page says the same; a cash-register plan at 209 NIS/month is advertised (search snippet of tranzila.com). **Card processing percentage: not published.** Tranzila's own blog quotes a market average of about 0.72% in 2025 (not its own rate).
- **Sign-up**: "Open a clearing account" form/WhatsApp; business-type requirements and documents **not stated**. The site has pages for small businesses, nonprofits and a guide "how does an osek patur choose a clearing solution" (https://www.tranzila.com/blog/exempt-dealer-clearing-solution/), which implies osek patur is served; not confirmed in writing.
- **Payment page languages**: `lang` parameter accepts `il` (Hebrew), `ar` (Arabic), `ru`, `es`, `de`, `fr`, `jp`. **English is not in the list I read**, so English must be checked (the Tranzila English page exists as a site, not as proof of an English payment page) (https://docs.tranzila.com/docs/payments-and-billing/iframe-integration).

## 2. Cardcom

- **Hosted page / embedded**: hosted payment page created by API ("Low Profile") that returns a page link; usable as redirect or iframe (https://kb.cardcom.solutions/apijosn/en/articles/503/create-payment-page-retrieve-transaction-details). Home page itself does not say.
- **API / webhook**: JSON/REST API with Swagger docs (https://secure.cardcom.solutions/Api/v11/Docs per search result). `WebHookUrl` sends the result server-to-server; Cardcom retries 7 times (1, 2, 2, 16, 60 minutes, then 12 hours twice); the article tells you to verify with `GetLpResult` and **not rely on the success page**. Older integrations use `IndicatorUrl` instead.
- **Bit / Apple Pay / Google Pay**: home page shows Bit, Apple Pay, Google Pay, PayPal; the API returns `UrlToBit`, `UrlToPayPal`, Google Pay button option; Apple Pay is listed as a payment source but set-up not described.
- **Automatic receipt / invoice**: yes via the same API call: `TypeToCreate` (Receipt, TaxInvoice, TaxInvoiceAndReceipt, ...), email sending, language `he`/`en` for the document; needs the Documents business model. For osek patur the system issues a "receipt without VAT" (Cardcom support/search result).
- **Published fees**: not on the home page. Cardcom's own comparison page says processing fee "starts at 1.2%" with no flat extra account charge; installment-credit adds 0.5%; the Bit button carries 1.6% (search snippets of cardcom.solutions pages: https://www.cardcom.solutions/עמלת-סליקה-לעסקים/). Final rate is set by a sales rep per turnover (Cardcom support). **Treat as "published as a starting point, not a quote".**
- **Sign-up**: online contact; osek patur eligibility **not stated**.
- **Languages of the payment page**: `Language` parameter values listed: `he`, `en`, `ru`, `ar` (the longer list is in another article); Hebrew and English use designs 5/6 (KB article, search summary).

## 3. PayPlus

- **Hosted page / embedded**: "Payment Pages" (hosted, secure clearing page for your domain), REDIRECT/IFRAME plugins, and Hosted Fields (https://www.payplus.co.il/en, https://docs.payplus.co.il/reference/hosted-fields).
- **API / webhook**: REST API; `refURL_callback` sends transaction details to your server (successful by default, failed ones with `send_failure_callback=true`); IPN lookup endpoint; a guide to validate requests from PayPlus (https://docs.payplus.co.il/reference/post_paymentpages-generatelink, https://docs.payplus.co.il/reference/validate-requests-received-from-payplus).
- **Bit / Apple Pay / Google Pay**: yes - the API enumerates `bit`, `paypal`, `apple-pay`, `google-pay`, `credit-card` charge methods; default allowed = credit card and Google Pay, others must be enabled (generateLink doc).
- **Automatic receipt / invoice**: "Invoice+" service and invoice fields in the API (customer, items, `paying_vat`); requires an activated invoice-company integration (generateLink doc).
- **Published fees**: **not published** (home page, search of payplus.co.il).
- **Sign-up**: "Open an account" form; requirements and osek patur eligibility **not stated**.
- **Languages**: `language_code` (default `he`); the doc page does **not** list the supported codes, so Arabic/English **not confirmed**. The site itself is in Hebrew and English.

## 4. Grow (formerly Meshulam)

- **Hosted page / embedded**: payment page via "Light API" `createPaymentProcess` (returns a hosted page URL); also payment links and SDKs (https://developers.grow.business/reference/create-payment-process-9). Calls must come from your server. Need `userId` and `pageCode` issued by Grow support first.
- **API / webhook**: server-to-server callback (form-encoded POST, not JSON) to `notifyUrl`; your server must confirm with `ApproveTransaction`; retries documented (https://developers.grow.business/reference/server-response). Sandbox: sandbox.meshulam.co.il.
- **Bit / Apple Pay / Google Pay**: the FAQ says customers can pay by Bit, Apple Pay, Google Pay, cards, bank transfer; Bit and PayBox cost the same 0.75% (https://grow.business/popular-questions/). The API page I read had no wallet parameters.
- **Automatic receipt / invoice**: yes - automatic invoice issuing "at no additional cost", emailed or SMS; invoice parameters and `invoiceNotifyUrl` in the API (FAQ, API page).
- **Published fees**: "0.75% per transaction + 59 NIS/month on the annual plan, 69 NIS/month on the monthly plan; includes up to 100 transactions and/or 100 documents per month; no setup fee on the main plan"; "Grow Light" for lower volume reported at 1% + 29 NIS/month; Diners and tourist cards differ (3.5% tourist); processing fee never below 0.50 NIS + VAT per payment per terms (https://grow.business/popular-questions/, https://grow.business/terms/, search summaries). Home page: "0.75% + 59 NIS per month". One FAQ page elsewhere says "from 0.9%" - **sources conflict**. Prices exclude VAT; full list at https://grow.business/fees (not opened).
- **Sign-up**: enter business details, approve a price offer, short verification; payments can start within one business day (FAQ). Documents and osek patur eligibility **not stated**. Websites need approval (Wix flow says up to a business day).
- **Languages**: the API page has no language parameter; **not stated**. Currency: shekels (Morning's page on Grow says foreign currency not supported).

## 5. HYP (formerly YaadPay)

- **Hosted page / embedded**: Hyp Pay: customers are redirected to a secure page hosted by Hyp; also iframe; wallets work the same in redirect or iframe (https://developers.hyp.co.il/pay, https://developers.hyp.co.il/pay/common-use-cases/digital-wallets). No-code editor for payment landing pages.
- **API / webhook**: API (`doDeal`, inquiry by `cgUid`); after payment the customer is redirected to success/error URLs with query parameters you should validate. **A server-to-server callback was not found** in the pages I opened (https://developers.hyp.co.il/payment-page-integration/integrating-hyps-payment-page-and-accepting-payment).
- **Bit / Apple Pay / Google Pay**: yes - Bit button appears by default once Bit is activated (QR code valid 9 minutes, Bit capped at 5,000 NIS, no installments); Apple Pay and Google Pay are enabled with a Hyp representative or account settings (docs disagree between two pages).
- **Receipt / invoice**: Hyp has a "digital invoice" product with a price page (https://hyp.co.il/digital-invoice-pricing/ - not opened); API invoice details **not found**.
- **Published fees**: Hyp Pay pricing not found. A Hyp blog gives only industry ranges (about 0.8% large business to about 2.4% small business) and a 2024 service-rate PDF I could not parse reliably (https://hyp.co.il/blog/small-business-credit-clearance-price/). **Not published.**
- **Sign-up**: via sales; osek patur eligibility **not stated**.
- **Languages**: payment page `lang` accepts examples EN and HE (and UI config `uiLang`); **Arabic not confirmed**.

## 6. Pelecard

- **Hosted page / embedded**: hosted payment pages and an API (Gateway 2.0 "API" and "IFrame/Redirect" guides, sandbox at gateway20.pelecard.biz/sandbox; docs at docs.pelecard.com) per pelecard.com search results and its API page. The API page stresses no redirect to external pages.
- **API / webhook**: API for payments, refunds, standing orders, reports. Server-to-server callback **not stated** on the pages I opened.
- **Bit / Apple Pay / Google Pay**: listed as products in the site navigation; a related article says the site card solution supports Apple Pay and Bit (https://pelecard.com/api/).
- **Receipt / invoice**: not described; "Green Invoice" appears as a product link.
- **Published fees**: none; articles say "low/minimal" only. **Not published.**
- **Sign-up**: quote form needs a **company ID (ח.פ)** field - possibly aimed at companies; osek patur not stated. Home page returned 503 on my first try.
- **Languages**: Hebrew site; payment page languages **not stated**.

## 7. iCount

- **Hosted page / embedded**: "secure clearing pages" ("עמודי סליקה") listed; also connectors to Shopify, Wix, Etsy, WooCommerce (https://www.icount.co.il/).
- **API / webhook**: API for connecting your systems and an app for Make; webhooks **not mentioned** on the page. (Not a developer-focused provider for a custom site.)
- **Bit / Apple Pay / Google Pay**: Bit yes; Apple Pay only on the iCount built-in terminal; Google Pay not mentioned.
- **Receipt / invoice**: yes - documents produced automatically, incl. every purchase in connected stores.
- **Published fees**: credit card terminal **30 NIS/month** with the iCount terminal, **20 NIS/month** with another terminal; card saving 20 NIS/month; sales-site connection 20 NIS/month per connection; 45-day free trial. **Percentage fee not published** on that page.
- **Sign-up**: page says it suits **osek patur and companies**; no criteria.
- **Languages**: not stated (Hebrew).

## 8. Morning (formerly Green Invoice)

- **Hosted page / embedded**: payment links and payment pages inside Morning's "digital payments" product, processed through **Grow** (https://www.greeninvoice.co.il/clearing/compare/ecommerce). WooCommerce and Shopify add-ons exist. Not a developer gateway.
- **API / webhook**: Morning's API exists (base api.greeninvoice.co.il); third-party skill pages say API needs "Best" plan or higher and webhooks need "Extra" - **[third party; unverified]** (https://www.greeninvoice.co.il/api-docs/ not opened).
- **Bit / Apple Pay / Google Pay**: yes (cards, Bit, Google Pay, Apple Pay listed). Bit +0.3% on processing fee; Diners +0.5% (min 1.7%); tourist cards 3.5%.
- **Receipt / invoice**: yes - documents issued automatically for every transaction, including refunds. This is the strongest "accounting included" option.
- **Published fees (all excluding VAT)**: Basic plan: 29 NIS/month on top of subscription, **1.6%** + **1.2 NIS** per transaction; Best: no extra monthly charge, **1.4%** + 1.2 NIS; Extra: 0.95%-1.4% by volume (1.4% up to 5,000 NIS/month; 1.2% for 5,001-20,000; 1% for 20,001-150,000; 0.95% above), + 1.2 NIS. Bank transfers under 5,000 NIS: 16.9 NIS fee; payouts on the 10th of the following month; terminal setup free (same page).
- **Sign-up**: activation up to 24 hours if details match; websites need review; companies/nonprofits take longer. **Osek patur eligibility not stated on that page** (Morning serves osek patur on its main product - not verified for the payment add-on).
- **Languages**: page is Hebrew only; payment page language **not stated**; shekels only.

## 9. Sumit (סאמיט)

- Accounting/billing system that also provides card clearing ("connect directly to card companies", PCI DSS Level 1 claimed) (https://www.sumit.co.il/).
- **Hosted page / embedded**: redirect payment pages created via `/billing/payments/beginredirect/`, an iframe-embeddable page, a Payments JavaScript library (your own form, card data goes to Sumit), and a direct REST API (https://help.sumit.co.il/he/articles/5832880, /5893615, /5833033).
- **API / webhook**: REST API with sandbox; the return URL carries parameters and you must verify server-to-server; webhooks documented for card/customer records changes; a payment-result webhook for the redirect was **not confirmed** (https://help.sumit.co.il/he/articles/11577644).
- **Bit / Apple Pay / Google Pay**: not mentioned on the pages I read.
- **Receipt / invoice**: tax invoices and receipts can be created and sent by email or WhatsApp; "automatic" not explicitly stated; free track includes invoice issuing.
- **Published fees**: paid track **from 19 NIS/month + VAT**; free track ("exempt" track) **0 NIS, up to 10 actions per month**; **no clearing fees listed**.
- **Sign-up**: osek patur criteria not stated; the free track is aimed at small/exempt businesses.
- **Languages**: Hebrew; not stated for payment pages.

## 10. PayPal (Israel)

- Israel business accounts can receive payments. Fees for receiving payments, **last updated 13 Oct 2026** on PayPal Israel: **domestic commercial 3.40% (4.01% incl. VAT) + fixed fee** (ILS 1.20 / 1.42 incl. VAT; USD 0.30; EUR 0.35; GBP 0.20); **international commercial**: same + 1.00% (senders in Canada, Northern/Europe I, US) or 2.00% (other countries); currency conversion 2.5% over the base rate (https://www.paypal.com/il/webapps/mpp/merchant-fees).
- Hosted checkout buttons/REST API/webhooks exist at PayPal level (general knowledge, not re-verified here); Tranzila and Cardcom both let you add a PayPal button to their pages (Tranzila `ppnewwin=2`, Cardcom `UrlToPayPal`), and both can then issue the Israeli invoice (Tranzila/Cardcom pages above).
- Much more expensive per sale than Israeli card clearing, but works for foreign buyers in many currencies, which matters for Denmark/EU later. Account requirements not read.

## 11. Stripe

- **Not available to an Israeli-registered business, as far as I could verify.** Stripe's global page (https://stripe.com/global) does not list Israel as a supported country and its country selector does not show Israel; Stripe's own "payments in Israel" guide did not say Israeli businesses can open accounts. Stripe job ads suggest an Israel presence, which is **not** the same as account availability.
- Third-party commentary says Israeli merchants often use a foreign (US/EU/UK) entity (for example via Stripe Atlas for a US company) - **[third party; not verified, and it carries US tax and legal consequences - ask the lawyer/accountant]**.
- Therefore for an Israeli business today: not an option; revisit only if Stripe announces Israel on its supported-countries page.

---

## Comparison at a glance (as read on 2026-11-22)

| Provider | Hosted page | Webhook / callback | Bit | Apple/Google Pay | Auto invoice | Published card fee | Languages (page) |
|---|---|---|---|---|---|---|---|
| Tranzila | yes (iframe, hosted fields) | yes (notify URL) | yes | yes (Apple Pay after registration) | yes (Digital Invoice) | not published (mobile from 29 NIS/month) | he, ar (en not in list read) |
| Cardcom | yes (Low Profile) | yes (WebHookUrl) | yes | Google yes, Apple listed | yes (API) | "from 1.2%" (own comparison page); Bit 1.6% | he, en, ru, ar |
| PayPlus | yes | yes (refURL_callback) | yes | yes | yes (Invoice+) | not published | codes not listed |
| Grow | yes (createPaymentProcess) | yes (notifyUrl + ApproveTransaction) | yes (0.75%) | yes | yes (free) | 0.75% + 59/69 NIS month (conflicting "from 0.9%") | not stated |
| HYP | yes | redirect only found | yes | yes | not found | not published | EN/HE; ar not confirmed |
| Pelecard | yes | not stated | listed | listed | not stated | not published | not stated |
| iCount | pages listed | not mentioned | yes | Apple on own terminal only | yes | terminal 20-30 NIS/month; % not published | not stated |
| Morning | payment links (via Grow) | API/webhook on higher plans [3rd party] | yes (+0.3%) | yes | yes (automatic) | 1.6% / 1.4% / 0.95-1.4% + 1.2 NIS | not stated |
| Sumit | yes (redirect, iframe, JS) | partial | not mentioned | not mentioned | yes | from 19 NIS/month; free track; no clearing % listed | not stated |
| PayPal | yes | yes (general) | no | no | no (needs add-on) | 3.40% + 1.20 NIS (+1-2% international) | many (not verified) |
| Stripe | - | - | - | - | - | not available for Israeli businesses (verify) | - |

## Recommendation table (very small business, least work)

| Situation | First choice | Why | Backup |
|---|---|---|---|
| Wants fewest moving parts, receipts handled automatically, accountant-friendly | **Morning (Green Invoice) with its payment add-on (runs on Grow)** | Fees published (1.4% Best plan + 1.2 NIS); every payment creates the Israeli document automatically; no developer needed (payment links) | Grow directly |
| Wants a hosted checkout that a developer can connect to the site and know the payment succeeded by server callback | **Cardcom** | Hosted page, webhook with retries, API creates the receipt/invoice, Arabic and English page languages documented, wallets and PayPal button | Tranzila |
| Needs Arabic checkout page and a documented notify URL | **Tranzila** | `ar` language option, notify URL, Bit/Google Pay/Apple Pay, digital invoice; fee must be quoted by sales | Cardcom |
| Lowest published percentage | **Grow** (0.75% + 59/69 NIS month, up to 100 transactions/documents) | Cheapest published; Bit at same rate; but checkout languages not stated and the monthly fee dominates at low volume | Morning Basic |
| Foreign buyers later | Add **PayPal** on top of an Israeli provider | Foreign currency and buyers; costs more per sale | Check provider currency support |

**My recommendation for the first launch:** use an Israeli provider that gives a hosted page plus automatic Israeli receipts - Cardcom or Tranzila if a developer connects the site (server callback to unlock the pass), Morning if the owner wants the least work and a published fee. Do not plan on Stripe. Confirm in writing: osek patur eligibility, the card fee, Arabic/Hebrew/English/Danish page languages, and whether a free-trial sign-up without payment needs no card.

---

## Ten-line plain summary

1. All the Israeli providers offer a hosted card page; the question is how much developer work and which paperwork each automates.
2. Cardcom and Tranzila have the clearest developer docs: hosted page, server callback, Bit and wallets, automatic invoices.
3. Cardcom documents Hebrew, English, Russian and Arabic page languages; Tranzila documents Hebrew, Arabic and others, but I did not see English listed.
4. Grow has the lowest published rate (0.75% + 59 NIS per month on the annual plan) but does not state page languages.
5. Morning publishes its card fees (1.6% / 1.4% / 0.95-1.4% plus 1.2 NIS per payment) and issues the Israeli receipt automatically; it runs on Grow and is the least work.
6. PayPlus, HYP and Pelecard publish no fees; Pelecard's quote form asks for a company ID, which may point at companies.
7. iCount and Sumit are accounting tools with payment features; their pages do not list a card percentage.
8. PayPal costs 3.40% + 1.20 NIS domestically (+1-2% for foreign senders) but helps foreign buyers later.
9. Stripe does not list Israel as a supported country; treat it as unavailable.
10. Almost nobody publishes whether osek patur can sign up for the card terminal; ask each one before choosing.

## What I could not verify

- Exact current fee for Tranzila, PayPlus, HYP, Pelecard, Sumit (clearing percentage); the Cardcom and Grow figures are published "starting" prices, not quotes; Grow fee pages (grow.business/fees) and Cardcom's price page were not opened directly.
- Osek patur eligibility for every provider's card terminal, documents needed to open an account, and activation time except Grow ("one business day") and Morning ("up to 24 hours").
- English/Arabic/Danish support of PayPlus, Grow, HYP (Arabic), Pelecard, Morning payment pages; Danish is not documented anywhere I read.
- Server callbacks for HYP, Pelecard and Sumit payment results; Bit support on Sumit; whether Tranzila's English page language exists.
- Whether Morning's API/webhook plan restrictions (third-party report) are current.
- PayPal business-account requirements and checkout languages; Stripe availability beyond the pages I read.
- Tranzila's Bit-with-hosted-fields limitation (the docs conflict between two pages).
