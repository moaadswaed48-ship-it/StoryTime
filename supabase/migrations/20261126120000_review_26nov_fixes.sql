-- Fixes from the fresh review of 26 Nov 2026 (docs/reviews/site-review-26nov.md, findings 1, 3, 7 and 9).
-- Earlier migrations are not rewritten. tests/db/review-26nov.test.ts proves each rule in PGlite.

-- ---------------------------------------------------------------------------------------------------------------
-- Finding 1. refunds.amount_agorot is the amount returned to the family: what they paid minus the cancellation fee
-- the owner kept (0 when the refund is declined). cancel_purchase() stored the full price and nothing changed it
-- when a fee was set, so the refund email, the family's purchases and "Download my data" said the full price came
-- back. The column now follows the fee on every write, whoever writes it.
-- ---------------------------------------------------------------------------------------------------------------
create function public.refund_amount_returned() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_paid integer;
begin
  select amount_agorot into v_paid from public.orders where id = new.order_id;
  new.amount_agorot := case when new.status = 'declined' then 0 else v_paid - coalesce(new.fee_agorot, 0) end;
  return new;
end;
$$;
create trigger refunds_amount_returned before insert or update on public.refunds
  for each row execute function public.refund_amount_returned();
revoke execute on function public.refund_amount_returned() from public, anon, authenticated;
comment on column public.refunds.amount_agorot is
  'The amount returned to the family: the price paid minus fee_agorot (0 when declined). Kept by refunds_amount_returned.';

-- Rows written before this fix (none on a live project yet): bring their amount in line. The trigger computes it.
update public.refunds r set fee_agorot = r.fee_agorot
  from public.orders o
 where o.id = r.order_id
   and r.amount_agorot is distinct from (case when r.status = 'declined' then 0 else o.amount_agorot - coalesce(r.fee_agorot, 0) end);

-- ---------------------------------------------------------------------------------------------------------------
-- Finding 3. A request from the public "Cancel a purchase" form can now be acted on: the owner sees the orders that
-- match it (by order number and email) and can end that pass and open its refund request, through exactly the same
-- checked rules as a family's own cancellation (14 days from payment, an active pass, queued passes moved earlier;
-- the fee cap applies to the refund as before). Every change lands in the audit log.
-- ---------------------------------------------------------------------------------------------------------------

-- The cancellation itself, shared by cancel_purchase() (the family) and owner_cancel_for_request() (the owner).
-- Not callable from outside: each caller checks who may cancel this pass first.
create function private.cancel_pass(p_pass uuid) returns public.refunds
language plpgsql security definer set search_path = '' as $$
declare
  p public.passes;
  o public.orders;
  r public.refunds;
  v_unused interval;
begin
  select * into p from public.passes where id = p_pass for update;
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
revoke execute on function private.cancel_pass(uuid) from public, anon, authenticated;

-- The family's own cancellation: unchanged rules, now through the shared function.
create or replace function public.cancel_purchase(p_pass uuid) returns public.refunds
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  perform 1 from public.passes where id = p_pass and account_id = auth.uid();
  if not found then raise exception 'pass_not_found'; end if;
  return private.cancel_pass(p_pass);
end;
$$;

-- Whether what someone typed as the order number names this order: any run of 8 or more hexadecimal characters
-- (hyphens allowed, case ignored) that the order's id starts with. The family sees the first 8 characters in
-- Settings and the whole id in the purchase email. src/data/rules.ts orderRefMatches() is the same rule.
create function private.order_ref_matches(p_ref text, p_order uuid) returns boolean
language sql immutable set search_path = '' as $$
  select exists (
    select 1 from regexp_matches(lower(coalesce(p_ref, '')), '[0-9a-f][0-9a-f-]{7,}', 'g') as m(x)
    where length(replace(m.x[1], '-', '')) between 8 and 32
      and starts_with(replace(p_order::text, '-', ''), replace(m.x[1], '-', ''))
  )
$$;
revoke execute on function private.order_ref_matches(text, uuid) from public, anon, authenticated;

-- The paid orders a public request names: the order number matches and the buyer's account has the same email.
create function private.request_matches(p_request uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'orderId', o.id, 'ageGroup', o.age_group, 'months', o.months, 'paidAgorot', o.amount_agorot,
           'priceWasPlaceholder', o.price_was_placeholder, 'paidAt', o.paid_at, 'passId', ps.id, 'passStatus', ps.status,
           'canCancel', ps.status = 'active' and now() <= o.paid_at + interval '14 days',
           'refundId', (select r.id from public.refunds r where r.order_id = o.id order by r.requested_at desc limit 1))
           order by o.paid_at desc), '[]'::jsonb)
  from public.cancellation_requests c
  join auth.users u on lower(u.email) = lower(btrim(c.email))
  join public.orders o on o.account_id = u.id and o.paid_at is not null
  left join public.passes ps on ps.order_id = o.id
  where c.id = p_request and private.order_ref_matches(c.order_ref, o.id)
$$;
revoke execute on function private.request_matches(uuid) from public, anon, authenticated;

-- owner_refunds(), as before, with the matching orders on every public request.
create or replace function public.owner_refunds() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  return jsonb_build_object(
    'open', (select count(*) from public.refunds where status = 'requested'),
    'refunds', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', r.id, 'orderId', r.order_id, 'passId', r.pass_id, 'email', u.email, 'ageGroup', o.age_group,
               'months', o.months, 'paidAgorot', o.amount_agorot, 'priceWasPlaceholder', o.price_was_placeholder,
               'paidAt', o.paid_at, 'requestedAt', r.requested_at, 'feeAgorot', r.fee_agorot,
               'maxFeeAgorot', least(floor(o.amount_agorot * 0.05)::integer, 10000),
               'status', r.status, 'issuedAt', r.issued_at, 'note', r.note) order by r.requested_at desc, r.id)
      from public.refunds r
      join public.orders o on o.id = r.order_id
      left join auth.users u on u.id = o.account_id), '[]'::jsonb),
    'publicRequests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'email', c.email, 'orderRef', c.order_ref, 'message', c.message,
               'createdAt', c.created_at, 'handledAt', c.handled_at, 'matches', private.request_matches(c.id))
               order by c.created_at desc, c.id)
      from public.cancellation_requests c), '[]'::jsonb)
  );
end;
$$;

-- The owner ends the pass of an order that matches a public request and opens its refund request. Refused when
-- the order does not match the request (order_not_matching), the pass is no longer active (pass_not_active) or
-- more than 14 days have passed since payment (cancel_window_closed). The request is marked handled. The passes
-- and refunds audit triggers log the cancellation; the request's own audit row names the order.
create function public.owner_cancel_for_request(p_request uuid, p_order uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  c public.cancellation_requests;
  v_pass uuid;
  r public.refunds;
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  select * into c from public.cancellation_requests where id = p_request for update;
  if not found then raise exception 'not_found'; end if;
  select ps.id into v_pass
    from public.orders o
    join auth.users u on u.id = o.account_id
    join public.passes ps on ps.order_id = o.id
   where o.id = p_order and o.paid_at is not null
     and lower(u.email) = lower(btrim(c.email)) and private.order_ref_matches(c.order_ref, o.id);
  if v_pass is null then raise exception 'order_not_matching'; end if;
  r := private.cancel_pass(v_pass);
  update public.cancellation_requests set handled_at = coalesce(handled_at, now()) where id = c.id;
  insert into public.audit_log (actor_id, action, target_table, target_id, detail)
  values (auth.uid(), 'update', 'cancellation_requests', c.id::text,
          jsonb_build_object('handled', true, 'cancelled_order', p_order, 'refund', r.id));
  return r.id;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Findings 7 and 9. create_order() now takes the price the family was shown and refuses the order when the current
-- price differs (price_changed), so nobody is charged a price they did not see after the owner changes one. A real
-- payment company also stays refused until the seller's business name and number are recorded (seller_not_set):
-- the consumer law needs them on the page before a sale. Set them with:
--   update private.settings set seller_name = '<business name>', seller_number = '<business number>';
-- (and replace the visible placeholders in the dictionaries, docs/LAUNCH-CHECKLIST.md).
-- ---------------------------------------------------------------------------------------------------------------
alter table private.settings add column seller_name text, add column seller_number text;

drop function public.create_order(text, integer, text, text);
create function public.create_order(p_age_group text, p_months integer, p_provider text, p_terms_version text, p_expected_agorot integer)
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
  -- The price on the family's screen (null: "Price not set yet") must still be the price.
  if p_expected_agorot is distinct from v_price then raise exception 'price_changed'; end if;
  if v_price is null and p_provider <> 'test' then raise exception 'price_not_set'; end if;
  if p_provider <> 'test' and (nullif(btrim(coalesce(s.seller_name, '')), '') is null or nullif(btrim(coalesce(s.seller_number, '')), '') is null) then
    raise exception 'seller_not_set';
  end if;
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
-- Who may call the new and replaced functions: signed-in users only (each owner function refuses everyone else).
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.create_order(text, integer, text, text, integer), public.owner_cancel_for_request(uuid, uuid)
  from public, anon;
grant execute on function public.create_order(text, integer, text, text, integer), public.owner_cancel_for_request(uuid, uuid)
  to authenticated;
