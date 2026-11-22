-- StoryTime schema, part 4: fixes from the fresh review of part A (docs/reviews/stage4a-review.md, "Fixes").
-- Earlier migrations are not rewritten; changed functions are replaced here with CREATE OR REPLACE, which keeps
-- their owner and their grants. Each block names the finding it fixes; tests/db/review-fixes.test.ts proves each.

-- ---------------------------------------------------------------------------------------------------------------
-- R4. Closed by default: a table, sequence or function created after this point gives signed-out visitors and
-- signed-in users nothing until a migration grants it. (Supabase's own default grants everything on new public
-- objects to anon and authenticated, and EXECUTE on every new function to PUBLIC.) tests/db/catalogue.test.ts lists
-- every public table and function, so a new object fails the tests until it is reviewed.
-- ---------------------------------------------------------------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;

-- Tables made before this point under the old default keep what it granted; signed-out visitors read only age
-- groups and prices (part 2's rule), so take back anything else they were given.
do $$
declare
  t text;
begin
  for t in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm') and c.relname not in ('age_groups', 'pass_prices')
  loop
    execute format('revoke all on public.%I from anon', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Private schema: settings and records that no API role can reach (PostgREST exposes only the public schema, and
-- anon/authenticated have no USAGE here). Only the SECURITY DEFINER functions below read them.
-- ---------------------------------------------------------------------------------------------------------------
create schema private;
revoke all on schema private from public;

create table private.settings (
  id boolean primary key default true check (id),
  -- R5. The test checkout works only where this is true: set it on the preview project, never in production:
  --   update private.settings set allow_test_payments = true;
  allow_test_payments boolean not null default false,
  -- R5. Real providers the site may take orders for, once connected in the payment-callback edge function:
  --   update private.settings set payment_providers = '{cardcom}';
  payment_providers text[] not null default '{}',
  -- R3. The secret salt for the trial record. Made here, at random, and never leaves the database.
  ledger_salt text not null default encode(sha256(convert_to(gen_random_uuid()::text || clock_timestamp()::text || gen_random_uuid()::text, 'UTF8')), 'hex')
);
insert into private.settings default values;

-- R1. The terms versions the site has published. A sign-up or an order must name one of these. Add a row in a
-- migration whenever src/data/terms.ts TERMS_VERSION changes (tests/db/review-fixes.test.ts checks they match).
create table private.terms_versions (
  version text primary key,
  published_at timestamptz not null default now()
);
insert into private.terms_versions (version) values ('draft-2026-11-22');

-- R3. One row per email address that has started a trial, kept when the account is deleted, so deleting the
-- account and signing up again does not give a second trial. Holds no email: only a salted SHA-256 of the
-- normalised address (lower case, trimmed) and the day. Listed for the lawyer in docs/LEGAL-CHECKLIST.md.
create table private.trial_ledger (
  email_hash text primary key,
  used_on date not null default current_date
);

revoke all on all tables in schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- R1. The database refuses an account that did not accept the current terms and confirm being an adult, whoever
-- calls GoTrue's sign-up. GoTrue then answers the sign-up with an error and no account is made.
-- Note: this also refuses users made in the Supabase dashboard ("Add user", "Invite") and any future social
-- sign-in, unless their metadata carries the same three fields.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.account_role := case when meta ->> 'role' = 'teacher' then 'teacher' else 'parent' end;
  v_lang public.site_lang := case when meta ->> 'language' in ('ar', 'he', 'en', 'da') then (meta ->> 'language')::public.site_lang else 'ar' end;
begin
  if not coalesce(meta -> 'terms_accepted' = 'true'::jsonb
                  and meta -> 'adult' = 'true'::jsonb
                  and exists (select 1 from private.terms_versions v where v.version = meta ->> 'terms_version'), false) then
    raise exception 'terms_required';
  end if;
  insert into public.profiles (id, role, language) values (new.id, v_role, v_lang);
  insert into public.consents (account_id, kind, granted, terms_version, source)
  values (new.id, 'terms', true, meta ->> 'terms_version', 'sign-up');
  insert into public.consents (account_id, kind, granted, source) values (new.id, 'adult', true, 'sign-up');
  -- Recorded either way, so "did not tick the box" is provable too. Never pre-ticked (legal checklist 19, 33).
  insert into public.consents (account_id, kind, granted, source)
  values (new.id, 'marketing', coalesce(meta -> 'marketing' = 'true'::jsonb, false), 'sign-up');
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- W1. A user may add only a marketing choice from Settings. Terms at checkout are written by create_order, and
-- terms and adult at sign-up by handle_new_user, so the consent record stays proof of what the person saw.
-- ---------------------------------------------------------------------------------------------------------------
drop policy consents_add_own on public.consents;
create policy consents_add_own on public.consents for insert to authenticated
  with check (account_id = (select auth.uid()) and kind = 'marketing' and source = 'settings' and terms_version is null);

-- ---------------------------------------------------------------------------------------------------------------
-- W5. Two parallel inserts cannot both pass the 5-profile count: the account's profile row is locked first.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.limit_children() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.profiles where id = new.account_id for update;
  if (select count(*) from public.children where account_id = new.account_id) >= 5 then
    raise exception 'profile_limit';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- R3. Trial: one per account AND one per email address, also after the account was deleted.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.start_trial(p_age_group text) returns public.trials
language plpgsql security definer set search_path = '' as $$
declare
  t public.trials;
  v_hash text;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if exists (select 1 from public.trials where account_id = auth.uid()) then raise exception 'trial_used'; end if;
  select encode(sha256(convert_to(s.ledger_salt || ':' || lower(btrim(u.email)), 'UTF8')), 'hex') into v_hash
  from auth.users u cross join private.settings s
  where u.id = auth.uid() and u.email is not null;
  if v_hash is not null and exists (select 1 from private.trial_ledger where email_hash = v_hash) then
    raise exception 'trial_used';
  end if;
  if not exists (select 1 from public.age_groups where id = p_age_group) then raise exception 'bad_age_group'; end if;
  insert into public.trials (account_id, age_group, started_at, ends_at)
  values (auth.uid(), p_age_group, now(), now() + interval '3 days')
  returning * into t;
  insert into public.trial_items (trial_id, story_id)
  select t.id, sag.story_id
  from public.story_age_groups sag
  join public.stories s on s.id = sag.story_id and s.status = 'published'
  where sag.age_group = p_age_group and sag.is_trial
  order by sag.trial_position nulls last, s.published_at
  limit 3;
  if not found then raise exception 'no_trial_stories'; end if;
  if v_hash is not null then
    insert into private.trial_ledger (email_hash) values (v_hash) on conflict do nothing;
    if not found then raise exception 'trial_used'; end if;
  end if;
  return t;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Orders: R1 (a known terms version), R5 (known providers only; the test provider only where switched on),
-- W11 (at most 5 unpaid orders an hour per account).
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.create_order(p_age_group text, p_months integer, p_provider text, p_terms_version text)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_price integer;
  s private.settings;
  o public.orders;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_terms_version is null or not exists (select 1 from private.terms_versions where version = p_terms_version) then
    raise exception 'terms_required';
  end if;
  select price_agorot into v_price from public.pass_prices where age_group = p_age_group and months = p_months;
  if not found then raise exception 'bad_plan'; end if;
  select * into s from private.settings;
  if p_provider = 'test' then
    if not s.allow_test_payments then raise exception 'test_payments_off'; end if;
  elsif p_provider is null or not (p_provider = any (s.payment_providers)) then
    raise exception 'provider_not_connected';
  end if;
  if v_price is null and p_provider <> 'test' then raise exception 'price_not_set'; end if;
  if (select count(*) from public.orders
      where account_id = auth.uid() and status = 'pending' and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate_limited';
  end if;
  insert into public.orders (account_id, age_group, months, amount_agorot, price_was_placeholder, provider, terms_version)
  values (auth.uid(), p_age_group, p_months, coalesce(v_price, 0), v_price is null, p_provider, p_terms_version)
  returning * into o;
  insert into public.consents (account_id, kind, granted, terms_version, source)
  values (auth.uid(), 'terms', true, p_terms_version, 'checkout');
  return o;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- confirm_payment: R2 (a verified success after a "failed" or "cancelled" event still makes the pass: the buyer
-- was charged), R5 (test provider only where switched on), W3 (a repeated event answers for its own order only).
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.confirm_payment(
  p_provider text, p_event_id text, p_order_id uuid, p_provider_payment_id text, p_amount_agorot integer,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_event uuid;
  v_first_order uuid;
  o public.orders;
  v_start timestamptz;
  v_pass uuid;
begin
  if p_provider = 'test' and not (select allow_test_payments from private.settings) then
    raise exception 'test_payments_off';
  end if;
  insert into public.provider_events (provider, event_id, order_id, kind, payload)
  values (p_provider, p_event_id, p_order_id, 'payment_succeeded', p_payload)
  on conflict (provider, event_id) do nothing
  returning id into v_event;
  if v_event is null then
    -- Seen before: answer with what the first delivery made, for the order it named.
    select order_id into v_first_order from public.provider_events where provider = p_provider and event_id = p_event_id;
    if v_first_order is distinct from p_order_id then raise exception 'event_order_mismatch'; end if;
    return (select id from public.passes where order_id = v_first_order);
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if o.provider <> p_provider then raise exception 'provider_mismatch'; end if;
  if o.status = 'paid' then
    update public.provider_events set processed_at = now() where id = v_event;
    return (select id from public.passes where order_id = p_order_id);
  end if;
  -- A "failed" or "cancelled" event may arrive before the success (a retry on the provider's page, or events out
  -- of order). The provider's verified success wins: the money was taken, so the pass is made.
  if o.status not in ('pending', 'failed', 'cancelled') then raise exception 'order_not_pending'; end if;
  if p_amount_agorot <> o.amount_agorot then raise exception 'amount_mismatch'; end if;
  if o.account_id is null then raise exception 'account_gone'; end if;

  insert into public.payments (order_id, provider, provider_payment_id, amount_agorot)
  values (o.id, p_provider, p_provider_payment_id, p_amount_agorot);
  update public.orders set status = 'paid', paid_at = now() where id = o.id;

  -- A pass bought while another for the same group is running starts when that one ends.
  select greatest(now(), coalesce(max(ends_at), now())) into v_start
  from public.passes
  where account_id = o.account_id and age_group = o.age_group and status = 'active' and ends_at > now();

  insert into public.passes (account_id, order_id, age_group, months, starts_at, ends_at)
  values (o.account_id, o.id, o.age_group, o.months, v_start, v_start + make_interval(months => o.months))
  returning id into v_pass;

  update public.provider_events set processed_at = now() where id = v_event;
  return v_pass;
end;
$$;

-- W2: a failure event must come from the order's own provider. R5: test provider only where switched on.
create or replace function public.record_payment_failure(p_provider text, p_event_id text, p_order_id uuid, p_kind text, p_payload jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_event uuid;
  v_provider text;
begin
  if p_kind not in ('payment_failed', 'payment_cancelled') then raise exception 'bad_event_kind'; end if;
  if p_provider = 'test' and not (select allow_test_payments from private.settings) then
    raise exception 'test_payments_off';
  end if;
  select provider into v_provider from public.orders where id = p_order_id;
  if not found then raise exception 'order_not_found'; end if;
  if v_provider <> p_provider then raise exception 'provider_mismatch'; end if;
  insert into public.provider_events (provider, event_id, order_id, kind, payload)
  values (p_provider, p_event_id, p_order_id, p_kind, p_payload)
  on conflict (provider, event_id) do nothing
  returning id into v_event;
  if v_event is null then return; end if;
  update public.orders
     set status = case when p_kind = 'payment_failed' then 'failed'::public.order_status else 'cancelled'::public.order_status end
   where id = p_order_id and status = 'pending';
  update public.provider_events set processed_at = now() where id = v_event;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- W4. Cancelling a pass moves the passes queued behind it (same account, same group) earlier by the time the
-- cancelled pass had left, so a paying customer is not left waiting for a date that no longer means anything.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.cancel_purchase(p_pass uuid) returns public.refunds
language plpgsql security definer set search_path = '' as $$
declare
  p public.passes;
  o public.orders;
  r public.refunds;
  v_unused interval;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into p from public.passes where id = p_pass and account_id = auth.uid() for update;
  if not found then raise exception 'pass_not_found'; end if;
  if p.status <> 'active' then raise exception 'pass_not_active'; end if;
  select * into o from public.orders where id = p.order_id;
  if o.paid_at is null or now() > o.paid_at + interval '14 days' then raise exception 'cancel_window_closed'; end if;
  update public.passes set status = 'cancelled', cancelled_at = now() where id = p.id;
  v_unused := p.ends_at - greatest(now(), p.starts_at);
  if v_unused > interval '0' then
    update public.passes
       set starts_at = starts_at - v_unused, ends_at = ends_at - v_unused
     where account_id = p.account_id and age_group = p.age_group and status = 'active'
       and id <> p.id and starts_at >= p.ends_at;
  end if;
  insert into public.refunds (order_id, pass_id, amount_agorot) values (o.id, p.id, o.amount_agorot) returning * into r;
  return r;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- R6 (part). The public "Cancel a purchase" form: at most 3 requests an hour for one email address. The rest of
-- the fix (a CAPTCHA and a per-address limit in an edge function) needs a CAPTCHA account: see the review file.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.request_cancellation(p_email text, p_order_ref text, p_message text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.cancellation_requests
      where lower(email) = lower(btrim(p_email)) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate_limited';
  end if;
  insert into public.cancellation_requests (email, order_ref, message) values (btrim(p_email), btrim(p_order_ref), nullif(btrim(p_message), ''));
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- W6. "Download my data": one shape for both backends (src/data/local/server.ts exportMyData uses the same keys),
-- now with the email address and the trial's stories.
-- ---------------------------------------------------------------------------------------------------------------
create or replace function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'exported_at', now(),
    'email', auth.jwt() ->> 'email',
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', coalesce((select jsonb_agg(c) from public.children c where c.account_id = auth.uid()), '[]'::jsonb),
    'progress', coalesce((select jsonb_agg(pr) from public.progress pr join public.children c on c.id = pr.child_id where c.account_id = auth.uid()), '[]'::jsonb),
    'consents', coalesce((select jsonb_agg(x order by x.created_at) from public.consents x where x.account_id = auth.uid()), '[]'::jsonb),
    'trial', (select to_jsonb(t) || jsonb_build_object('story_ids', coalesce((select jsonb_agg(ti.story_id) from public.trial_items ti where ti.trial_id = t.id), '[]'::jsonb))
              from public.trials t where t.account_id = auth.uid()),
    'orders', coalesce((select jsonb_agg(o) from public.orders o where o.account_id = auth.uid()), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(pm) from public.payments pm join public.orders o on o.id = pm.order_id where o.account_id = auth.uid()), '[]'::jsonb),
    'passes', coalesce((select jsonb_agg(ps) from public.passes ps where ps.account_id = auth.uid()), '[]'::jsonb),
    'refunds', coalesce((select jsonb_agg(r) from public.refunds r join public.orders o on o.id = r.order_id where o.account_id = auth.uid()), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- W8. The cancellation fee can never exceed the legal cap: the lower of 5% of the price paid or 100 shekels
-- (legal checklist item 6; src/data/rules.ts maxCancellationFee).
-- ---------------------------------------------------------------------------------------------------------------
create function public.guard_refund_fee() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_paid integer;
begin
  if new.fee_agorot is null then return new; end if;
  select amount_agorot into v_paid from public.orders where id = new.order_id;
  if new.fee_agorot < 0 or new.fee_agorot > least(floor(v_paid * 0.05)::integer, 10000) then
    raise exception 'fee_over_cap';
  end if;
  return new;
end;
$$;
create trigger refunds_fee_cap before insert or update on public.refunds
  for each row execute function public.guard_refund_fee();

-- ---------------------------------------------------------------------------------------------------------------
-- W9. Unlocking the author's text needs a recorded consent: a reference to her written consent, new for each
-- unlock (CLAUDE.md rule 3). The audit log already records who unlocked it.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.stories add column text_unlock_consent_ref text;
comment on column public.stories.text_unlock_consent_ref is 'Reference to the author''s written consent for the last unlock of text_locked. Required, and new, for each unlock.';

create function public.guard_text_unlock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.text_locked and not new.text_locked
     and (nullif(btrim(coalesce(new.text_unlock_consent_ref, '')), '') is null
          or new.text_unlock_consent_ref is not distinct from old.text_unlock_consent_ref) then
    raise exception 'unlock_needs_consent';
  end if;
  return new;
end;
$$;
create trigger stories_text_unlock before update of text_locked on public.stories
  for each row execute function public.guard_text_unlock();

-- ---------------------------------------------------------------------------------------------------------------
-- Who may call the new functions: nobody directly (they are triggers).
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.guard_refund_fee(), public.guard_text_unlock() from public, anon, authenticated;
