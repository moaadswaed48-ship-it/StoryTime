-- StoryTime schema, part 1: tables.
-- Plan section 13. Written for Supabase (Postgres 15+); also run in PGlite by tests/db with a thin stand-in for
-- Supabase's auth schema and roles (tests/db/supabase-stand-in.sql).
--
-- Money is stored in agorot (1 shekel = 100 agorot), always including VAT. A price of null means "not set yet":
-- prices are placeholders until the owner gives them (CLAUDE.md rule 4).

-- ---------------------------------------------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------------------------------------------

create type public.account_role as enum ('parent', 'teacher', 'owner');
create type public.site_lang as enum ('ar', 'he', 'en', 'da');
create type public.story_status as enum ('draft', 'published');
create type public.learner_kind as enum ('child', 'class');
create type public.pass_status as enum ('active', 'cancelled', 'refunded');
create type public.order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');
create type public.media_source as enum ('studio', 'upload', 'third_party');

create table public.age_groups (
  id text primary key check (id in ('2-3', '4-5', '6-8')),
  min_age smallint not null,
  max_age smallint not null,
  position smallint not null unique
);
comment on table public.age_groups is 'The three age groups (plan section 14). A fourth (9-11) can be added later.';

insert into public.age_groups (id, min_age, max_age, position) values
  ('2-3', 2, 3, 1),
  ('4-5', 4, 5, 2),
  ('6-8', 6, 8, 3);

create table public.pass_prices (
  age_group text not null references public.age_groups (id),
  months smallint not null check (months in (1, 3, 12)),
  price_agorot integer check (price_agorot is null or price_agorot >= 0),
  currency text not null default 'ILS' check (currency = 'ILS'),
  includes_vat boolean not null default true,
  primary key (age_group, months)
);
comment on column public.pass_prices.price_agorot is 'Final price with VAT, in agorot. Null = not set by the owner yet (shown as a placeholder).';

insert into public.pass_prices (age_group, months)
select g.id, m.months from public.age_groups g cross join (values (1), (3), (12)) as m (months);

-- ---------------------------------------------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.account_role not null default 'parent',
  language public.site_lang not null default 'ar',
  story_language public.site_lang,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per account (an adult). role owner is set only by the database owner, never by the user.';

-- A child profile (parent accounts) or a class (teacher accounts). A class holds no children''s names.
create table public.children (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade,
  kind public.learner_kind not null,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  age_group text not null references public.age_groups (id),
  created_at timestamptz not null default now()
);
create index children_account_idx on public.children (account_id);
comment on column public.children.name is 'Child: first name or nickname only. Class: the class name.';

-- ---------------------------------------------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------------------------------------------

create table public.media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'video', 'captions', 'audio')),
  storage_path text not null,
  source public.media_source not null,
  licence text not null,
  credit text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.media is 'Every file with its source and licence (the ownership pack, plan section 13).';

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  status public.story_status not null default 'draft',
  version integer not null default 1 check (version >= 1),
  credit text not null default 'storytime' check (credit in ('storytime', 'author')),
  text_locked boolean not null default false,
  is_sample boolean not null default false,
  cover_media_id uuid references public.media (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.stories.text_locked is 'True for the author''s story: no text edits without her written consent (CLAUDE.md rule 3).';

-- Catalogue facts per language: what any signed-in user may see for covers and the locked view.
create table public.story_listings (
  story_id uuid not null references public.stories (id) on delete cascade,
  lang public.site_lang not null,
  title text not null,
  teaser text not null default '',
  primary key (story_id, lang)
);

-- A story can sit in one or more age groups; is_trial marks it as one of that group''s trial stories.
create table public.story_age_groups (
  story_id uuid not null references public.stories (id) on delete cascade,
  age_group text not null references public.age_groups (id),
  is_trial boolean not null default false,
  trial_position smallint,
  primary key (story_id, age_group)
);
create index story_age_groups_group_idx on public.story_age_groups (age_group);

-- Per-language sign-off by a reviewer before publishing (owner-only information).
create table public.story_signoffs (
  story_id uuid not null references public.stories (id) on delete cascade,
  lang public.site_lang not null,
  version integer not null,
  signed_off_by uuid references public.profiles (id) on delete set null,
  signed_off_at timestamptz not null default now(),
  primary key (story_id, lang)
);

-- Paid content from here on: readable only with access to the story.
create table public.pages (
  story_id uuid not null references public.stories (id) on delete cascade,
  page_no smallint not null check (page_no >= 1),
  picture_media_id uuid references public.media (id) on delete set null,
  layout jsonb not null default '{}'::jsonb,
  primary key (story_id, page_no)
);

create table public.story_texts (
  story_id uuid not null,
  page_no smallint not null,
  lang public.site_lang not null,
  display text not null,
  speech text not null,
  primary key (story_id, page_no, lang),
  foreign key (story_id, page_no) references public.pages (story_id, page_no) on delete cascade
);
comment on column public.story_texts.display is 'Text as shown on the page (light vowel marks).';
comment on column public.story_texts.speech is 'Text for the voice (full vowel marks).';

create table public.films (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  lang public.site_lang not null,
  video_media_id uuid references public.media (id) on delete set null,
  captions_media_id uuid references public.media (id) on delete set null,
  duration_s integer check (duration_s is null or duration_s > 0),
  unique (story_id, lang)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references public.stories (id) on delete cascade,
  texts jsonb not null default '{}'::jsonb
);
comment on column public.activities.texts is 'Per language: goal, materials, safety, adult note, class note. {"ar": {...}, "he": {...}}';

create table public.activity_steps (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  position smallint not null,
  media_id uuid references public.media (id) on delete set null,
  captions jsonb not null default '{}'::jsonb,
  unique (activity_id, position)
);

-- ---------------------------------------------------------------------------------------------------------------
-- Trials, money
-- ---------------------------------------------------------------------------------------------------------------

create table public.trials (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.profiles (id) on delete cascade,
  age_group text not null references public.age_groups (id),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  check (ends_at > started_at)
);
comment on table public.trials is 'One trial per account: 3 stories for 3 days. The stories are copied at start (trial_items) so a later owner change never takes a story away from a running trial.';

create table public.trial_items (
  trial_id uuid not null references public.trials (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  primary key (trial_id, story_id)
);
create index trial_items_story_idx on public.trial_items (story_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.profiles (id) on delete set null,
  age_group text not null references public.age_groups (id),
  months smallint not null check (months in (1, 3, 12)),
  amount_agorot integer not null check (amount_agorot >= 0),
  currency text not null default 'ILS',
  price_was_placeholder boolean not null default false,
  provider text not null,
  status public.order_status not null default 'pending',
  terms_version text not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_account_idx on public.orders (account_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_payment_id text not null,
  amount_agorot integer not null,
  receipt_url text,
  created_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index payments_order_idx on public.payments (order_id);

create table public.passes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid unique references public.orders (id) on delete set null,
  age_group text not null references public.age_groups (id),
  months smallint not null check (months in (1, 3, 12)),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.pass_status not null default 'active',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index passes_account_idx on public.passes (account_id, age_group);
comment on table public.passes is 'A pass is paid once and never renews. A pass bought while another for the same group is active starts when that one ends.';

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  pass_id uuid references public.passes (id) on delete set null,
  amount_agorot integer,
  fee_agorot integer,
  status text not null default 'requested' check (status in ('requested', 'issued', 'declined')),
  requested_at timestamptz not null default now(),
  issued_at timestamptz,
  credit_document_url text
);
create index refunds_order_idx on public.refunds (order_id);
comment on column public.refunds.fee_agorot is 'Set by the owner; the law caps it at the lower of 5% or 100 shekels (legal checklist item 6). Null until decided.';

-- Every payment-provider callback, stored once, so a repeated callback never counts twice.
create table public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  order_id uuid references public.orders (id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

-- A cancellation sent by someone who is not signed in (the public "Cancel a purchase" form).
create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 320),
  order_ref text not null check (char_length(order_ref) between 1 and 80),
  message text check (message is null or char_length(message) <= 2000),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

-- ---------------------------------------------------------------------------------------------------------------
-- Consents, progress, records
-- ---------------------------------------------------------------------------------------------------------------

-- Append-only: a change of mind is a new row, so the history stays provable.
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('terms', 'adult', 'marketing')),
  granted boolean not null,
  terms_version text,
  source text not null check (source in ('sign-up', 'settings', 'checkout')),
  created_at timestamptz not null default now()
);
create index consents_account_idx on public.consents (account_id, kind, created_at desc);

create table public.progress (
  child_id uuid not null references public.children (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  last_page smallint,
  film_watched boolean not null default false,
  activity_done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (child_id, story_id)
);

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.profiles (id) on delete set null,
  to_email text not null,
  template text not null,
  lang public.site_lang not null,
  status text not null check (status in ('queued', 'sent', 'bounced', 'unsubscribed', 'failed')),
  provider_message_id text,
  created_at timestamptz not null default now()
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.profiles (id) on delete set null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target_table text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
