-- Recheck of 27 Nov 2026, N3: an order number glued to a word by a hyphen ("Ref-3F2A1B9C", Danish "Ordre-3F2A1B9C")
-- was missed, because the letters before the hyphen are hexadecimal too ("ef-", "e-") and joined the run. A run is
-- now read from its start and from just after each hyphen in it. The rest of the rule is unchanged: at least 8
-- hexadecimal characters (hyphens ignored, case ignored, at most 32) that the order's id starts with.
-- src/data/rules.ts orderRefMatches() is the same rule. The function keeps its signature, so its callers
-- (private.request_matches, owner_cancel_for_request) need no change.
create or replace function private.order_ref_matches(p_ref text, p_order uuid) returns boolean
language sql immutable set search_path = '' as $$
  select exists (
    select 1
    from regexp_matches(lower(coalesce(p_ref, '')), '[0-9a-f][0-9a-f-]{7,}', 'g') as m(x)
    cross join lateral generate_series(1, length(m.x[1])) as s(at)
    cross join lateral (select replace(substr(m.x[1], s.at), '-', '') as run) as r
    where (s.at = 1 or substr(m.x[1], s.at - 1, 1) = '-')
      and length(r.run) between 8 and 32
      and starts_with(replace(p_order::text, '-', ''), r.run)
  )
$$;
revoke execute on function private.order_ref_matches(text, uuid) from public, anon, authenticated;
