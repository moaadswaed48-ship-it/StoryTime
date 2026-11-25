# Handing StoryTime to a buyer: the checklist

**Draft for the lawyer and the owner. Not legal advice.** Written 25 Nov 2026 from the project's files. Items marked
**Q (lawyer)** need a lawyer's answer. The inventory of what changes hands is `WHAT-IS-TRANSFERRED.md`.

**In three lines:** before the sale, sign the author's permission, clean the code repository, and open every account
in a way that can be moved. At the sale, sign a written assignment, hand over the repository, the domain and the
accounts, and give the keys once so the buyer can replace them. Customer data moves only as the privacy law allows,
and the payment terminal does not move at all: the buyer opens her own.

---

## Step 0. Before anything (weeks ahead)

- [ ] **Author's permission signed**, with a clause that lets it pass to a buyer (`AUTHOR-PERMISSION-LETTER.md`,
      clause 6). Until then her story stays off the live site and out of `content/stories/` on any public link
      (`docs/HANDOFF.md`, Preview: "Never publish the preview with the author's story").
- [ ] **Written agreements with every person who adds work** from now on (native editors, lawyer, designer, voice
      actors): their work belongs to the owner, or can be passed to a buyer. Q (lawyer): wording.
- [ ] **Open each account in a form that can be transferred** (Q (lawyer): in the owner's name, a company's, or
      straight in the buyer's?). Use a shared business email address, not a personal one, as the login of every
      account, so the email can be handed over with them.
- [ ] Ask the lawyer for the documents in step 6.

## Step 1. Clean the code repository

The repository is `github.com/moaadswaed48-ship-it/StoryTime`, under the owner's personal account, with 10 branches.

- [ ] Decide: **transfer the whole repository** (GitHub can move it to the buyer's account) **or give a clean copy**
      (only the finished site, with fresh history). A clean copy is safer, because the history holds the items below.
- [ ] Remove or leave behind (`WHAT-IS-TRANSFERRED.md` section 1.4):
  - the old build on branch `laptop/landing-v2` and the other old branches (AI-made Sari model, paintings, hero
    picture, film clips, old free-plan narration);
  - the old site on the `gh-pages` branch, and the hidden test link `/StoryTime/next/`;
  - the owner's reference cartoon frames (`docs/film/ref/`, `docs/previews/reference/`);
  - the Lemo-Opuscar demo stills (`docs/previews/lemo/`), or keep them with their credit line;
  - `.claude/skills/` (advice files for AI sessions, not part of the product), or keep them with their licence
    notices.
- [ ] Check no secret key was ever saved in the history (none was found in the files read for this pack; a tool
      that scans the whole history should confirm it).
- [ ] Add the third-party notices file and confirm the licence list is current (`node
      docs/ownership/make-licence-list.mjs`).

## Step 2. Accounts and keys to hand over

Each service below is planned but **not yet created** (`docs/LEGAL-CHECKLIST.md` C), except GitHub. For each: move
the account (or the project inside it) to the buyer, then the buyer **replaces every key** so the old ones stop
working.

| Service | What it holds | Keys and settings the site uses (names only; values are never written in the project) | How it moves |
|---|---|---|---|
| GitHub | The code | — | Repository transfer, or a clean copy (step 1) |
| Domain registrar | The web address | — | Registrar transfer to the buyer's account (unlock, transfer code) |
| Supabase (EU region) | Database, sign-in, stored pictures and films, server functions | `SUPABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (or the older `VITE_SUPABASE_ANON_KEY`), `SUPABASE_SERVICE_ROLE_KEY` | Transfer the project to the buyer's Supabase organisation, or add her as owner and leave. Then rotate the keys. **Never** the owner's other Supabase project (project rule 9). |
| Server-function settings | Business details, emails, secrets | `BUSINESS_DETAILS`, `SUPPORT_EMAIL`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `SITE_URL`, `SITE_ORIGINS`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `SEND_EMAIL_HOOK_SECRET`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `ALLOW_TEST_PAYMENTS` (must be off on the live site) | The buyer sets new values. `BUSINESS_DETAILS` becomes **her** name, ID or company number and address, because the law asks the seller to show who she is (`docs/LEGAL-CHECKLIST.md` item 1). |
| Resend | Sending emails, the verified sending domain | `RESEND_API_KEY`, webhook secret | Move the account or the team; the buyer re-checks the domain's email records |
| Cloudflare | Hosting, private film storage | its own login | Move the site to the buyer's account |
| Payment company | Card payments and automatic receipts | the company's keys and callback address, once chosen | **Does not move.** A terminal belongs to a registered business. The buyer opens her own (step 4). |
| Voice service (ElevenLabs) | Recorded voices | its own login | The recordings move as files; check the plan's terms (`THIRD-PARTY-LICENCES.md` §3) |
| The owner's area of the site | Adding and publishing stories | owner role in the database (set only by the database owner) | Give the buyer the owner role; remove the old owner's. The owner's sign-in uses two steps (`docs/LEGAL-CHECKLIST.md` item 23). |

- [ ] Hand over keys **once**, through a safe channel (not plain email or chat), and confirm the buyer has replaced
      them. Then remove the old owner's access everywhere.

## Step 3. The domain

- [ ] The domain is bought (about 10 to 15 US dollars a year, `docs/MASTER-PLAN.md` §11) in an account that can be
      transferred, with auto-renew on and the expiry date written down.
- [ ] At the sale: unlock it, give the transfer code, confirm it renews in the buyer's name.
- [ ] Update `SITE_ORIGIN` (the site's main address) and the email sending domain to match.

## Step 4. Payment company and the business

- [ ] The buyer registers her own business (exempt or licensed dealer: her accountant decides; it changes the prices
      shown, with or without 18% VAT; `docs/LEGAL-CHECKLIST.md` §3).
- [ ] She opens her own account with a payment company (Cardcom, Tranzila and Grow were compared; confirm fees and
      languages in writing) and its automatic receipts.
- [ ] Her keys go into the site's settings; one test payment and one test refund are run before the switch.
- [ ] **Passes already sold under the owner's business:** who gives refunds and receipts for them after the sale?
      Q (lawyer). The 14-day right to cancel and refunds within 14 days apply (`docs/LEGAL-CHECKLIST.md` items 5 and 6).
- [ ] The legal pages, receipts and the purchase-confirmation email show **her** business details from the day of
      the switch.

## Step 5. Customer data and the privacy rules for moving it

Today there are **no real customers**: the site runs only in test mode on a hidden link. If the sale happens after
launch, the database holds parents' and teachers' accounts, children's first names or nicknames with an age group,
classes (no children's names), progress, consents, orders, payments and an email log (`docs/LEGAL-CHECKLIST.md` C).

- [ ] **Q (lawyer):** may the customer database pass to the buyer, and on what basis: notice to users, their consent,
      or a lawful basis such as the sale of the whole business? (`docs/research/israel-law-raw.md` §7: "privacy law
      applies to handing the customer database to the buyer: tell users or rely on a lawful basis".)
- [ ] Tell users before the move, in four languages, and update the privacy policy with the new owner's name and
      contact details (the privacy policy must name who holds the data and the recipients; `docs/LEGAL-CHECKLIST.md`
      items 19 to 22).
- [ ] Update the **database definitions document** (the written description of the database, its purposes and its
      transfers abroad; `docs/LEGAL-CHECKLIST.md` item 22) with the new holder.
- [ ] Keep the data in the EU region; the move is between accounts of the same service, not a new transfer abroad.
      Q (lawyer) if the buyer wants another region or service.
- [ ] Marketing consent does **not** pass automatically: Q (lawyer) whether people who agreed to news from the old
      owner may get news from the buyer (`docs/LEGAL-CHECKLIST.md`, spam law items).
- [ ] Records the law requires to keep (orders, payments, tax documents): who keeps them and for how long. Q (lawyer)
      (lawyer question 10 in `docs/legal/LAWYER-PACK.md`).
- [ ] After the move, the old owner keeps **no copy** of customer data, and says so in writing.

## Step 6. Documents to ask the lawyer for

1. **Assignment of copyright and other rights** from the owner to the buyer, in writing, covering every item the
   owner holds in `WHAT-IS-TRANSFERRED.md` sections 1.1 and 1.2. Ask that it:
   - names the works by list (the 45 stories in four languages, the code, the database design, the emails, the
     legal drafts, the character sheets, art engine, music and sound code, research and plans);
   - covers works not finished on the day (pictures, films, voices) if they are part of the deal;
   - says what is **not** included or not promised: the author's story (hers), outside libraries (their licences),
     and how far rights in AI-made output can be promised (`WHAT-IS-TRANSFERRED.md` Q1);
   - handles moral rights (credit and integrity stay with authors under Israeli law; section numbers to be checked,
     `israel-law-raw.md` §7).
2. **Transfer of the author's permission**, or a new letter from the author to the buyer.
3. **The assignments from editors, voice actors and other helpers**, passed on with the sale.
4. **The data-transfer wording** for users and for the privacy policy (step 5).
5. **The sale agreement** itself: price, what is handed over and when, support after the sale, what happens to passes
   already sold.

## Step 7. The day of the switch

- [ ] Domain, accounts and repository moved; keys replaced; old access removed.
- [ ] Business details, support email and legal pages show the buyer.
- [ ] One real sign-up, one test purchase and refund, one email of each main kind received.
- [ ] Hidden test link taken down.
- [ ] Users told (if any exist).
