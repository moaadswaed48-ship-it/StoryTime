-- Stage 4, part C: things the family side keeps per account or per profile, so they follow the account to another
-- device (product checklist sections 7, 9, 10 and 14).
--   * profiles.prefs: reading and film settings (auto-flip, captions, text size, shelf or list, hint seen).
--     Only these keys, with these types: anything else is refused, so the column cannot become a free store.
--   * progress.film_position_s: where the profile stopped in the story's film.
--   * favourites: "my shelf", per profile (a child or a class).
--   * export_my_data() gains the favourites (prefs and the film position come with profile and progress).

alter table public.profiles add column prefs jsonb not null default '{}'::jsonb;
alter table public.profiles add constraint profiles_prefs_check check (
  jsonb_typeof(prefs) = 'object'
  and prefs - array['autoFlip', 'captions', 'textScale', 'view', 'hintSeen'] = '{}'::jsonb
  and (not prefs ? 'autoFlip' or jsonb_typeof(prefs -> 'autoFlip') = 'boolean')
  and (not prefs ? 'captions' or jsonb_typeof(prefs -> 'captions') = 'boolean')
  and (not prefs ? 'hintSeen' or jsonb_typeof(prefs -> 'hintSeen') = 'boolean')
  and (not prefs ? 'textScale' or (jsonb_typeof(prefs -> 'textScale') = 'number' and (prefs ->> 'textScale')::numeric between 0 and 3))
  and (not prefs ? 'view' or prefs -> 'view' in ('"shelf"'::jsonb, '"list"'::jsonb, 'null'::jsonb))
);
grant update (prefs) on public.profiles to authenticated;

alter table public.progress add column film_position_s integer check (film_position_s between 0 and 36000);

create table public.favourites (
  child_id uuid not null references public.children (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (child_id, story_id)
);
alter table public.favourites enable row level security;
revoke all on public.favourites from public, anon, authenticated;
grant select, insert, delete on public.favourites to authenticated;
create policy favourites_own on public.favourites for all to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.account_id = (select auth.uid())))
  with check (exists (select 1 from public.children c where c.id = child_id and c.account_id = (select auth.uid())));

create or replace function public.export_my_data() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'exported_at', now(),
    'email', auth.jwt() ->> 'email',
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', coalesce((select jsonb_agg(c) from public.children c where c.account_id = auth.uid()), '[]'::jsonb),
    'progress', coalesce((select jsonb_agg(pr) from public.progress pr join public.children c on c.id = pr.child_id where c.account_id = auth.uid()), '[]'::jsonb),
    'favourites', coalesce((select jsonb_agg(f) from public.favourites f join public.children c on c.id = f.child_id where c.account_id = auth.uid()), '[]'::jsonb),
    'consents', coalesce((select jsonb_agg(x order by x.created_at) from public.consents x where x.account_id = auth.uid()), '[]'::jsonb),
    'trial', (select to_jsonb(t) || jsonb_build_object('story_ids', coalesce((select jsonb_agg(ti.story_id) from public.trial_items ti where ti.trial_id = t.id), '[]'::jsonb))
              from public.trials t where t.account_id = auth.uid()),
    'orders', coalesce((select jsonb_agg(o) from public.orders o where o.account_id = auth.uid()), '[]'::jsonb),
    'payments', coalesce((select jsonb_agg(pm) from public.payments pm join public.orders o on o.id = pm.order_id where o.account_id = auth.uid()), '[]'::jsonb),
    'passes', coalesce((select jsonb_agg(ps) from public.passes ps where ps.account_id = auth.uid()), '[]'::jsonb),
    'refunds', coalesce((select jsonb_agg(r) from public.refunds r join public.orders o on o.id = r.order_id where o.account_id = auth.uid()), '[]'::jsonb)
  )
$$;
