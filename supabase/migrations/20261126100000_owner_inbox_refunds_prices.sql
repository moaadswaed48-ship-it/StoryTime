-- Owner's area, part 2 (26 Nov 2026): the contact-message inbox, cancellations and refunds, and pass prices.
-- Earlier migrations are not rewritten. Every function here is owner-only (is_owner()), SECURITY DEFINER with an
-- empty search path, and writes its change to audit_log (directly, or through the audit triggers of part 1 on
-- refunds, passes and pass_prices). New functions are closed by default (20261122110000_review_fixes.sql, R4): each
-- one is granted to authenticated explicitly below and listed in tests/db/catalogue.test.ts.
-- No money moves here: no payment company is connected. The owner returns the money herself and records it.
-- tests/db/owner-part2.test.ts proves each rule.

-- ---------------------------------------------------------------------------------------------------------------
-- One way in for every owner change, so each one is checked and logged: the direct column grants from part 1
-- (written for the owner under row-level security) are taken back. The owner keeps reading through RLS.
-- ---------------------------------------------------------------------------------------------------------------
revoke update (price_agorot) on public.pass_prices from authenticated;
revoke update (amount_agorot, fee_agorot, status, issued_at, credit_document_url) on public.refunds from authenticated;
revoke update (handled_at) on public.contact_messages from authenticated;
revoke update (handled_at) on public.cancellation_requests from authenticated;

-- A price is a whole number of agorot between 1 shekel and 10,000 shekels, VAT included, or null (not set yet).
-- src/features/owner/data/money.ts PRICE_MIN_AGOROT / PRICE_MAX_AGOROT hold the same limits.
alter table public.pass_prices add constraint pass_prices_price_range
  check (price_agorot is null or price_agorot between 100 and 1000000);

-- How and when the owner returned the money (required when marking a refund as refunded). The family can read it
-- with their own refund (refunds_read policy) and in "Download my data".
alter table public.refunds add column note text check (note is null or char_length(note) between 1 and 500);

-- ---------------------------------------------------------------------------------------------------------------
-- Messages from the contact form
-- ---------------------------------------------------------------------------------------------------------------

-- Newest first (the latest 500), with the number not handled yet counted over all of them.
create function public.owner_inbox() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  return jsonb_build_object(
    'unhandled', (select count(*) from public.contact_messages where handled_at is null),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'name', m.name, 'email', m.email, 'lang', m.lang, 'message', m.message,
               'createdAt', m.created_at, 'handledAt', m.handled_at) order by m.created_at desc, m.id)
      from (select * from public.contact_messages order by created_at desc, id limit 500) m), '[]'::jsonb)
  );
end;
$$;

-- Marks a message handled (or back to "to do"). The audit row names the message, never its words or address.
create function public.owner_set_message_handled(p_message uuid, p_handled boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_was timestamptz;
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  select handled_at into v_was from public.contact_messages where id = p_message for update;
  if not found then raise exception 'not_found'; end if;
  if (v_was is not null) = coalesce(p_handled, false) then return; end if;
  update public.contact_messages set handled_at = case when p_handled then now() end where id = p_message;
  insert into public.audit_log (actor_id, action, target_table, target_id, detail)
  values (auth.uid(), 'update', 'contact_messages', p_message::text, jsonb_build_object('handled', p_handled));
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Cancellations and refunds
-- ---------------------------------------------------------------------------------------------------------------

-- Refund requests (made by cancel_purchase) with what the family paid and the legal fee cap, and the requests sent
-- through the public cancellation form. Newest first. The buyer's email comes from the account; none once deleted.
create function public.owner_refunds() returns jsonb
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
               'createdAt', c.created_at, 'handledAt', c.handled_at) order by c.created_at desc, c.id)
      from public.cancellation_requests c), '[]'::jsonb)
  );
end;
$$;

-- Sets (or clears) the cancellation fee of a request still waiting. The cap is guard_refund_fee() (fee_over_cap);
-- the refunds audit trigger records the change.
create function public.owner_set_refund_fee(p_refund uuid, p_fee_agorot integer) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_status text;
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  select status into v_status from public.refunds where id = p_refund for update;
  if not found then raise exception 'not_found'; end if;
  if v_status <> 'requested' then raise exception 'refund_closed'; end if;
  update public.refunds set fee_agorot = p_fee_agorot where id = p_refund and fee_agorot is distinct from p_fee_agorot;
end;
$$;

-- Records that the owner returned the money herself: the fee must be decided (0 is a decision) and a note given.
-- The refund becomes "issued" (which the email job answers with the refund email), the pass and the order
-- "refunded". Final: a refund once marked cannot be changed here. The audit triggers on refunds and passes log it.
create function public.owner_mark_refunded(p_refund uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  r public.refunds;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  if v_note is null or char_length(v_note) > 500 then raise exception 'note_required'; end if;
  select * into r from public.refunds where id = p_refund for update;
  if not found then raise exception 'not_found'; end if;
  if r.status <> 'requested' then raise exception 'refund_closed'; end if;
  if r.fee_agorot is null then raise exception 'fee_not_set'; end if;
  update public.refunds set status = 'issued', issued_at = now(), note = v_note where id = r.id;
  update public.passes set status = 'refunded' where id = r.pass_id and status = 'cancelled';
  update public.orders set status = 'refunded' where id = r.order_id;
end;
$$;

-- Marks a request from the public cancellation form handled (or back to "to do").
create function public.owner_set_cancellation_handled(p_request uuid, p_handled boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_was timestamptz;
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  select handled_at into v_was from public.cancellation_requests where id = p_request for update;
  if not found then raise exception 'not_found'; end if;
  if (v_was is not null) = coalesce(p_handled, false) then return; end if;
  update public.cancellation_requests set handled_at = case when p_handled then now() end where id = p_request;
  insert into public.audit_log (actor_id, action, target_table, target_id, detail)
  values (auth.uid(), 'update', 'cancellation_requests', p_request::text, jsonb_build_object('handled', p_handled));
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Prices
-- ---------------------------------------------------------------------------------------------------------------

-- Sets one pass's price, or clears it (null). create_order() charges this price, and still refuses every real
-- provider while a price is null (price_not_set). The pass_prices audit trigger records the change.
create function public.owner_set_price(p_age_group text, p_months integer, p_price_agorot integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  if p_price_agorot is not null and (p_price_agorot < 100 or p_price_agorot > 1000000) then raise exception 'bad_price'; end if;
  perform 1 from public.pass_prices where age_group = p_age_group and months = p_months for update;
  if not found then raise exception 'bad_plan'; end if;
  update public.pass_prices set price_agorot = p_price_agorot
   where age_group = p_age_group and months = p_months and price_agorot is distinct from p_price_agorot;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Who may call the new functions: signed-in users only, and each refuses everyone but the owner itself.
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.owner_inbox(), public.owner_set_message_handled(uuid, boolean), public.owner_refunds(),
  public.owner_set_refund_fee(uuid, integer), public.owner_mark_refunded(uuid, text),
  public.owner_set_cancellation_handled(uuid, boolean), public.owner_set_price(text, integer, integer)
  from public, anon;
grant execute on function public.owner_inbox(), public.owner_set_message_handled(uuid, boolean), public.owner_refunds(),
  public.owner_set_refund_fee(uuid, integer), public.owner_mark_refunded(uuid, text),
  public.owner_set_cancellation_handled(uuid, boolean), public.owner_set_price(text, integer, integer)
  to authenticated;
