-- StoryTime schema, part 3: the account and purchase flows as database functions.
--
-- Errors are raised with a short code in the message (for example 'trial_used'), which the data layer maps to a
-- message in the user's language. SQLSTATE P0001 is the default for RAISE EXCEPTION.

-- ---------------------------------------------------------------------------------------------------------------
-- Sign-up: profile and consents are written by the database from the sign-up form's metadata, because a new
-- account has no session until the email is confirmed.
--   raw_user_meta_data: { role: 'parent'|'teacher', language: 'ar'|'he'|'en'|'da', terms_version: '...',
--                         terms_accepted: true, adult: true, marketing: false }
-- ---------------------------------------------------------------------------------------------------------------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role public.account_role := case when meta ->> 'role' = 'teacher' then 'teacher' else 'parent' end;
  v_lang public.site_lang := case when meta ->> 'language' in ('ar', 'he', 'en', 'da') then (meta ->> 'language')::public.site_lang else 'ar' end;
begin
  insert into public.profiles (id, role, language) values (new.id, v_role, v_lang);
  if coalesce((meta ->> 'terms_accepted')::boolean, false) then
    insert into public.consents (account_id, kind, granted, terms_version, source)
    values (new.id, 'terms', true, meta ->> 'terms_version', 'sign-up');
  end if;
  if coalesce((meta ->> 'adult')::boolean, false) then
    insert into public.consents (account_id, kind, granted, source) values (new.id, 'adult', true, 'sign-up');
  end if;
  -- Recorded either way, so "did not tick the box" is provable too. Never pre-ticked (legal checklist 19, 33).
  insert into public.consents (account_id, kind, granted, source)
  values (new.id, 'marketing', coalesce((meta ->> 'marketing')::boolean, false), 'sign-up');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Parent or teacher may be changed only before the account holds any child or class profile.
create function public.set_my_role(p_role public.account_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_role not in ('parent', 'teacher') then raise exception 'role_not_allowed'; end if;
  if exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then raise exception 'role_not_allowed'; end if;
  if exists (select 1 from public.children where account_id = auth.uid()) then raise exception 'role_locked'; end if;
  update public.profiles set role = p_role, updated_at = now() where id = auth.uid();
end;
$$;

-- At most 5 child or class profiles per account (product checklist 7).
create function public.limit_children() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.children where account_id = new.account_id) >= 5 then
    raise exception 'profile_limit';
  end if;
  return new;
end;
$$;
create trigger children_limit before insert on public.children for each row execute function public.limit_children();

-- ---------------------------------------------------------------------------------------------------------------
-- Trial: one per account, 3 stories for 3 days, the stories copied at start.
-- ---------------------------------------------------------------------------------------------------------------
create function public.start_trial(p_age_group text) returns public.trials
language plpgsql security definer set search_path = '' as $$
declare
  t public.trials;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if exists (select 1 from public.trials where account_id = auth.uid()) then raise exception 'trial_used'; end if;
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
  return t;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Orders and payments
-- ---------------------------------------------------------------------------------------------------------------

-- The price always comes from the database, never from the browser. A price the owner has not set yet can be
-- bought only through the test provider, for 0, and the order says so.
create function public.create_order(p_age_group text, p_months integer, p_provider text, p_terms_version text)
returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_price integer;
  o public.orders;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_terms_version is null or p_terms_version = '' then raise exception 'terms_required'; end if;
  select price_agorot into v_price from public.pass_prices where age_group = p_age_group and months = p_months;
  if not found then raise exception 'bad_plan'; end if;
  if v_price is null and p_provider <> 'test' then raise exception 'price_not_set'; end if;
  insert into public.orders (account_id, age_group, months, amount_agorot, price_was_placeholder, provider, terms_version)
  values (auth.uid(), p_age_group, p_months, coalesce(v_price, 0), v_price is null, p_provider, p_terms_version)
  returning * into o;
  insert into public.consents (account_id, kind, granted, terms_version, source)
  values (auth.uid(), 'terms', true, p_terms_version, 'checkout');
  return o;
end;
$$;

-- The ONLY way a pass comes into being. Called by the payment callback (an edge function holding the service
-- role key) after it has verified the provider's message. Each provider event is stored once: a repeated
-- callback returns the pass already made and creates nothing.
create function public.confirm_payment(
  p_provider text, p_event_id text, p_order_id uuid, p_provider_payment_id text, p_amount_agorot integer,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_event uuid;
  o public.orders;
  v_start timestamptz;
  v_pass uuid;
begin
  insert into public.provider_events (provider, event_id, order_id, kind, payload)
  values (p_provider, p_event_id, p_order_id, 'payment_succeeded', p_payload)
  on conflict (provider, event_id) do nothing
  returning id into v_event;
  if v_event is null then
    -- Seen before: answer with what the first delivery made.
    return (select id from public.passes where order_id = p_order_id);
  end if;

  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if o.provider <> p_provider then raise exception 'provider_mismatch'; end if;
  if o.status = 'paid' then
    update public.provider_events set processed_at = now() where id = v_event;
    return (select id from public.passes where order_id = p_order_id);
  end if;
  if o.status <> 'pending' then raise exception 'order_not_pending'; end if;
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

-- A failed or abandoned payment, reported by the provider. Stored once; the order is marked, nothing is unlocked.
create function public.record_payment_failure(p_provider text, p_event_id text, p_order_id uuid, p_kind text, p_payload jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_event uuid;
begin
  if p_kind not in ('payment_failed', 'payment_cancelled') then raise exception 'bad_event_kind'; end if;
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
-- Cancelling a purchase (Consumer Protection Law 14ג(ג), legal checklist items 5-10)
-- ---------------------------------------------------------------------------------------------------------------

-- Signed in: cancel one's own pass within 14 days of the purchase. Access ends at once; profiles and progress
-- stay; a refund request is recorded for the owner, who sets any fee (capped by law) and issues the refund.
create function public.cancel_purchase(p_pass uuid) returns public.refunds
language plpgsql security definer set search_path = '' as $$
declare
  p public.passes;
  o public.orders;
  r public.refunds;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into p from public.passes where id = p_pass and account_id = auth.uid() for update;
  if not found then raise exception 'pass_not_found'; end if;
  if p.status <> 'active' then raise exception 'pass_not_active'; end if;
  select * into o from public.orders where id = p.order_id;
  if o.paid_at is null or now() > o.paid_at + interval '14 days' then raise exception 'cancel_window_closed'; end if;
  update public.passes set status = 'cancelled', cancelled_at = now() where id = p.id;
  insert into public.refunds (order_id, pass_id, amount_agorot) values (o.id, p.id, o.amount_agorot) returning * into r;
  return r;
end;
$$;

-- Signed out: the public form. Recorded whatever is typed, and answers nothing about whether the order exists.
create function public.request_cancellation(p_email text, p_order_ref text, p_message text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.cancellation_requests (email, order_ref, message) values (btrim(p_email), btrim(p_order_ref), nullif(btrim(p_message), ''));
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Account rights
-- ---------------------------------------------------------------------------------------------------------------

-- Deletes the account and everything that hangs on it (profiles, children, progress, consents, trial, passes).
-- Orders and payments stay without a name attached (tax records); the deletion is recorded.
-- NOT PROVEN on a real Supabase project: if the database role that owns this function may not delete from
-- auth.users there, move the delete into an edge function that calls auth.admin.deleteUser.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_req uuid;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  insert into public.deletion_requests (account_id) values (v_uid) returning id into v_req;
  delete from auth.users where id = v_uid;
  update public.deletion_requests set completed_at = now() where id = v_req;
end;
$$;

-- "Download my data": everything held about the caller, as one JSON document. Runs with the caller's rights, so
-- row-level security decides what is included.
create function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', coalesce((select jsonb_agg(c) from public.children c where c.account_id = auth.uid()), '[]'::jsonb),
    'progress', coalesce((select jsonb_agg(pr) from public.progress pr join public.children c on c.id = pr.child_id where c.account_id = auth.uid()), '[]'::jsonb),
    'consents', coalesce((select jsonb_agg(x order by x.created_at) from public.consents x where x.account_id = auth.uid()), '[]'::jsonb),
    'trial', (select to_jsonb(t) from public.trials t where t.account_id = auth.uid()),
    'orders', coalesce((select jsonb_agg(o) from public.orders o where o.account_id = auth.uid()), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(pm) from public.payments pm join public.orders o on o.id = pm.order_id where o.account_id = auth.uid()), '[]'::jsonb),
    'passes', coalesce((select jsonb_agg(ps) from public.passes ps where ps.account_id = auth.uid()), '[]'::jsonb),
    'refunds', coalesce((select jsonb_agg(r) from public.refunds r join public.orders o on o.id = r.order_id where o.account_id = auth.uid()), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- The author's story: no text change while it is locked (CLAUDE.md rule 3).
-- ---------------------------------------------------------------------------------------------------------------
create function public.guard_locked_text() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_story uuid := coalesce(new.story_id, old.story_id);
begin
  if exists (select 1 from public.stories where id = v_story and text_locked) then
    raise exception 'text_locked';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger story_texts_locked before insert or update or delete on public.story_texts
  for each row execute function public.guard_locked_text();

-- ---------------------------------------------------------------------------------------------------------------
-- Audit log: every change to content, prices, passes and refunds, with who made it.
-- ---------------------------------------------------------------------------------------------------------------
create function public.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (actor_id, action, target_table, target_id, detail)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce(rec ->> 'id', rec ->> 'story_id'), rec);
  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['stories', 'story_listings', 'story_age_groups', 'story_signoffs', 'pages', 'story_texts',
                           'films', 'activities', 'activity_steps', 'media', 'pass_prices', 'passes', 'refunds']
  loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_change()', 'audit_' || t, t);
  end loop;
end;
$$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger stories_touch before update on public.stories for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------------------------------------------
-- Who may call what.
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.handle_new_user(), public.limit_children(), public.guard_locked_text(),
  public.audit_change(), public.touch_updated_at(),
  public.confirm_payment(text, text, uuid, text, integer, jsonb),
  public.record_payment_failure(text, text, uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.confirm_payment(text, text, uuid, text, integer, jsonb),
  public.record_payment_failure(text, text, uuid, text, jsonb) to service_role;

revoke execute on function public.set_my_role(public.account_role), public.start_trial(text),
  public.create_order(text, integer, text, text), public.cancel_purchase(uuid), public.delete_my_account(),
  public.export_my_data(), public.request_cancellation(text, text, text)
  from public, anon;
grant execute on function public.set_my_role(public.account_role), public.start_trial(text),
  public.create_order(text, integer, text, text), public.cancel_purchase(uuid), public.delete_my_account(),
  public.export_my_data() to authenticated;
grant execute on function public.request_cancellation(text, text, text) to anon, authenticated;
