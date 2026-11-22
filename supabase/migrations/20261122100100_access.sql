-- StoryTime schema, part 2: who may read and write what.
--
-- The rules (docs/PRODUCT-CHECKLIST.md sections 0, 14, 20; CLAUDE.md rule 6):
--   * A user reads and writes only their own account data.
--   * Story texts, pages, films, activities and activity steps are readable only with an active trial covering
--     that story, an active pass for one of its age groups, or the owner role.
--   * Catalogue facts for covers and the locked view (title, age group, cover) are readable by any signed-in user.
--   * Only the owner writes content. Signed-out visitors read only age groups and prices.
--   * Trials, orders and passes are created only through the functions in part 3, never by a direct insert.
--
-- Every helper is SECURITY DEFINER with an empty search_path, so a policy that calls it cannot be steered by a
-- caller's own objects, and it reads the tables it needs without recursing into their policies.
-- auth.uid() is wrapped in (select ...) in policies so Postgres evaluates it once per statement.

-- ---------------------------------------------------------------------------------------------------------------
-- Least privilege: Supabase grants everything on new tables to anon and authenticated by default. Take it all
-- back and grant only what each policy below needs.
-- ---------------------------------------------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------------------------------------------

create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
$$;

create function public.story_is_published(p_story uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.stories s where s.id = p_story and s.status = 'published')
$$;

-- An active trial whose copied story list includes this story.
create function public.has_trial_access(p_story uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.trials t
    join public.trial_items ti on ti.trial_id = t.id
    where t.account_id = auth.uid()
      and ti.story_id = p_story
      and now() >= t.started_at
      and now() < t.ends_at
  )
$$;

-- An active, current pass for any age group the story is listed in.
create function public.has_pass_access(p_story uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.passes p
    join public.story_age_groups sag on sag.age_group = p.age_group
    where p.account_id = auth.uid()
      and sag.story_id = p_story
      and p.status = 'active'
      and now() >= p.starts_at
      and now() < p.ends_at
  )
$$;

-- The one question every paid read asks. The owner sees drafts too; everyone else needs a published story and an
-- active trial or pass. Signed out (auth.uid() is null) is always false.
create function public.has_access_to_story(p_story uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_owner()
    or (
      auth.uid() is not null
      and public.story_is_published(p_story)
      and (public.has_trial_access(p_story) or public.has_pass_access(p_story))
    )
$$;

create function public.has_access_to_activity(p_activity uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select public.has_access_to_story(a.story_id) from public.activities a where a.id = p_activity), false)
$$;

-- A file's row is readable when it is the cover of a published story (catalogue), or is used by content the
-- caller may read. (The file itself sits in private storage behind short-lived links: part B.)
create function public.can_read_media(p_media uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_owner()
    or (auth.uid() is not null and exists (
      select 1 from public.stories s where s.cover_media_id = p_media and s.status = 'published'
    ))
    or exists (select 1 from public.pages pg where pg.picture_media_id = p_media and public.has_access_to_story(pg.story_id))
    or exists (
      select 1 from public.films f
      where (f.video_media_id = p_media or f.captions_media_id = p_media) and public.has_access_to_story(f.story_id)
    )
    or exists (
      select 1 from public.activity_steps st
      where st.media_id = p_media and public.has_access_to_activity(st.activity_id)
    )
$$;

-- Teachers keep classes, everyone else keeps child profiles.
create function public.learner_kind_for_me() returns public.learner_kind
language sql stable security definer set search_path = '' as $$
  select case when p.role = 'teacher' then 'class'::public.learner_kind else 'child'::public.learner_kind end
  from public.profiles p where p.id = auth.uid()
$$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.has_access_to_story(uuid) to anon, authenticated;
grant execute on function public.is_owner(), public.story_is_published(uuid), public.has_trial_access(uuid),
  public.has_pass_access(uuid), public.has_access_to_activity(uuid), public.can_read_media(uuid),
  public.learner_kind_for_me() to authenticated;

-- ---------------------------------------------------------------------------------------------------------------
-- Reference data: readable by everyone, prices editable by the owner.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.age_groups enable row level security;
grant select on public.age_groups to anon, authenticated;
create policy age_groups_read on public.age_groups for select to anon, authenticated using (true);

alter table public.pass_prices enable row level security;
grant select on public.pass_prices to anon, authenticated;
grant update (price_agorot) on public.pass_prices to authenticated;
create policy pass_prices_read on public.pass_prices for select to anon, authenticated using (true);
create policy pass_prices_owner_write on public.pass_prices for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

-- ---------------------------------------------------------------------------------------------------------------
-- Account data: only the account itself (the owner sees accounts, never children's names or progress).
-- ---------------------------------------------------------------------------------------------------------------
alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;
grant update (language, story_language, onboarded_at) on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_owner()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table public.children enable row level security;
grant select, insert, delete on public.children to authenticated;
grant update (name, age_group) on public.children to authenticated;
create policy children_own on public.children for all to authenticated
  using (account_id = (select auth.uid()))
  with check (account_id = (select auth.uid()) and kind = (select public.learner_kind_for_me()));

alter table public.progress enable row level security;
grant select, insert, update, delete on public.progress to authenticated;
create policy progress_own on public.progress for all to authenticated
  using (exists (select 1 from public.children c where c.id = child_id and c.account_id = (select auth.uid())))
  with check (exists (select 1 from public.children c where c.id = child_id and c.account_id = (select auth.uid())));

alter table public.consents enable row level security;
grant select, insert on public.consents to authenticated;
create policy consents_read_own on public.consents for select to authenticated
  using (account_id = (select auth.uid()));
create policy consents_add_own on public.consents for insert to authenticated
  with check (account_id = (select auth.uid()) and source in ('settings', 'checkout'));

alter table public.trials enable row level security;
grant select on public.trials to authenticated;
create policy trials_read on public.trials for select to authenticated
  using (account_id = (select auth.uid()) or (select public.is_owner()));

alter table public.trial_items enable row level security;
grant select on public.trial_items to authenticated;
create policy trial_items_read on public.trial_items for select to authenticated
  using (exists (select 1 from public.trials t where t.id = trial_id and (t.account_id = (select auth.uid()) or (select public.is_owner()))));

alter table public.orders enable row level security;
grant select on public.orders to authenticated;
create policy orders_read on public.orders for select to authenticated
  using (account_id = (select auth.uid()) or (select public.is_owner()));

alter table public.payments enable row level security;
grant select on public.payments to authenticated;
create policy payments_read on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.account_id = (select auth.uid()) or (select public.is_owner()))));

alter table public.passes enable row level security;
grant select on public.passes to authenticated;
create policy passes_read on public.passes for select to authenticated
  using (account_id = (select auth.uid()) or (select public.is_owner()));

alter table public.refunds enable row level security;
grant select on public.refunds to authenticated;
grant update (amount_agorot, fee_agorot, status, issued_at, credit_document_url) on public.refunds to authenticated;
create policy refunds_read on public.refunds for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.account_id = (select auth.uid()) or (select public.is_owner()))));
create policy refunds_owner_update on public.refunds for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

alter table public.deletion_requests enable row level security;
grant select on public.deletion_requests to authenticated;
create policy deletion_requests_read on public.deletion_requests for select to authenticated
  using (account_id = (select auth.uid()) or (select public.is_owner()));

-- Service records: owner reads; only the server (service role, which bypasses RLS) writes.
alter table public.provider_events enable row level security;
grant select on public.provider_events to authenticated;
create policy provider_events_owner on public.provider_events for select to authenticated using ((select public.is_owner()));

alter table public.cancellation_requests enable row level security;
grant select on public.cancellation_requests to authenticated;
grant update (handled_at) on public.cancellation_requests to authenticated;
create policy cancellation_requests_owner_read on public.cancellation_requests for select to authenticated using ((select public.is_owner()));
create policy cancellation_requests_owner_update on public.cancellation_requests for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

alter table public.email_log enable row level security;
grant select on public.email_log to authenticated;
create policy email_log_owner on public.email_log for select to authenticated using ((select public.is_owner()));

alter table public.audit_log enable row level security;
grant select on public.audit_log to authenticated;
create policy audit_log_owner on public.audit_log for select to authenticated using ((select public.is_owner()));

-- ---------------------------------------------------------------------------------------------------------------
-- Catalogue: any signed-in user reads published stories' facts; the owner reads and writes everything.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.stories enable row level security;
grant select, insert, update, delete on public.stories to authenticated;
create policy stories_read on public.stories for select to authenticated
  using (status = 'published' or (select public.is_owner()));
create policy stories_owner_insert on public.stories for insert to authenticated with check ((select public.is_owner()));
create policy stories_owner_update on public.stories for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy stories_owner_delete on public.stories for delete to authenticated using ((select public.is_owner()));

alter table public.story_listings enable row level security;
grant select, insert, update, delete on public.story_listings to authenticated;
create policy story_listings_read on public.story_listings for select to authenticated
  using (public.story_is_published(story_id) or (select public.is_owner()));
create policy story_listings_owner_insert on public.story_listings for insert to authenticated with check ((select public.is_owner()));
create policy story_listings_owner_update on public.story_listings for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy story_listings_owner_delete on public.story_listings for delete to authenticated using ((select public.is_owner()));

alter table public.story_age_groups enable row level security;
grant select, insert, update, delete on public.story_age_groups to authenticated;
create policy story_age_groups_read on public.story_age_groups for select to authenticated
  using (public.story_is_published(story_id) or (select public.is_owner()));
create policy story_age_groups_owner_insert on public.story_age_groups for insert to authenticated with check ((select public.is_owner()));
create policy story_age_groups_owner_update on public.story_age_groups for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy story_age_groups_owner_delete on public.story_age_groups for delete to authenticated using ((select public.is_owner()));

alter table public.story_signoffs enable row level security;
grant select, insert, update, delete on public.story_signoffs to authenticated;
create policy story_signoffs_owner on public.story_signoffs for all to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

alter table public.media enable row level security;
grant select, insert, update, delete on public.media to authenticated;
create policy media_read on public.media for select to authenticated using (public.can_read_media(id));
create policy media_owner_insert on public.media for insert to authenticated with check ((select public.is_owner()));
create policy media_owner_update on public.media for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy media_owner_delete on public.media for delete to authenticated using ((select public.is_owner()));

-- ---------------------------------------------------------------------------------------------------------------
-- Paid content: readable only with access to the story.
-- ---------------------------------------------------------------------------------------------------------------
alter table public.pages enable row level security;
grant select, insert, update, delete on public.pages to authenticated;
create policy pages_read on public.pages for select to authenticated using (public.has_access_to_story(story_id));
create policy pages_owner_insert on public.pages for insert to authenticated with check ((select public.is_owner()));
create policy pages_owner_update on public.pages for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy pages_owner_delete on public.pages for delete to authenticated using ((select public.is_owner()));

alter table public.story_texts enable row level security;
grant select, insert, update, delete on public.story_texts to authenticated;
create policy story_texts_read on public.story_texts for select to authenticated using (public.has_access_to_story(story_id));
create policy story_texts_owner_insert on public.story_texts for insert to authenticated with check ((select public.is_owner()));
create policy story_texts_owner_update on public.story_texts for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy story_texts_owner_delete on public.story_texts for delete to authenticated using ((select public.is_owner()));

alter table public.films enable row level security;
grant select, insert, update, delete on public.films to authenticated;
create policy films_read on public.films for select to authenticated using (public.has_access_to_story(story_id));
create policy films_owner_insert on public.films for insert to authenticated with check ((select public.is_owner()));
create policy films_owner_update on public.films for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy films_owner_delete on public.films for delete to authenticated using ((select public.is_owner()));

alter table public.activities enable row level security;
grant select, insert, update, delete on public.activities to authenticated;
create policy activities_read on public.activities for select to authenticated using (public.has_access_to_story(story_id));
create policy activities_owner_insert on public.activities for insert to authenticated with check ((select public.is_owner()));
create policy activities_owner_update on public.activities for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy activities_owner_delete on public.activities for delete to authenticated using ((select public.is_owner()));

alter table public.activity_steps enable row level security;
grant select, insert, update, delete on public.activity_steps to authenticated;
create policy activity_steps_read on public.activity_steps for select to authenticated using (public.has_access_to_activity(activity_id));
create policy activity_steps_owner_insert on public.activity_steps for insert to authenticated with check ((select public.is_owner()));
create policy activity_steps_owner_update on public.activity_steps for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy activity_steps_owner_delete on public.activity_steps for delete to authenticated using ((select public.is_owner()));
