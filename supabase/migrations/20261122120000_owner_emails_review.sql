-- StoryTime schema, part 6: fixes from the fresh review of Stage 4 part B2 (docs/reviews/stage4b2-review.md,
-- "Fixes"). Earlier migrations are not rewritten; changed functions and policies are replaced here.
-- Each block names its finding; tests/db/owner-emails-review.test.ts proves each in PGlite.

-- ---------------------------------------------------------------------------------------------------------------
-- B1. Draft languages stay invisible to families. A story published "in these languages only" kept its other
-- languages' titles, page words and films readable by every family with access. Now a language's rows are
-- readable only when that language is published (or by the owner).
-- ---------------------------------------------------------------------------------------------------------------
create function public.story_lang_visible(p_story uuid, p_lang public.site_lang) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_owner() or exists (
    select 1 from public.stories s
    where s.id = p_story and s.status = 'published'
      and p_lang = any (coalesce(s.published_langs, array['ar', 'he', 'en', 'da']::public.site_lang[]))
  )
$$;

drop policy story_listings_read on public.story_listings;
create policy story_listings_read on public.story_listings for select to authenticated
  using (public.story_lang_visible(story_id, lang));
drop policy story_texts_read on public.story_texts;
create policy story_texts_read on public.story_texts for select to authenticated
  using (public.has_access_to_story(story_id) and public.story_lang_visible(story_id, lang));
drop policy films_read on public.films;
create policy films_read on public.films for select to authenticated
  using (public.has_access_to_story(story_id) and public.story_lang_visible(story_id, lang));

-- ---------------------------------------------------------------------------------------------------------------
-- B2. A published story stays complete. Editing a published story is live at once (the owner's choice), but a save
-- that leaves a published language without its title or a page's words, a page without a picture, or the story
-- without an age group is refused. owner_save_story() ends every real change with a version bump on the story,
-- which is where this runs, after all of the save's rows are written. (Sign-offs may go stale: the editor shows it.)
-- ---------------------------------------------------------------------------------------------------------------
create function public.guard_published_complete() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_lang public.site_lang;
begin
  if old.status <> 'published' or new.status <> 'published' or new.version is not distinct from old.version then
    return new;
  end if;
  if not exists (select 1 from public.story_age_groups g where g.story_id = new.id)
     or not exists (select 1 from public.pages p where p.story_id = new.id)
     or exists (select 1 from public.pages p where p.story_id = new.id and p.picture_media_id is null) then
    raise exception 'published_incomplete';
  end if;
  foreach v_lang in array case when new.credit = 'author' then array['ar']::public.site_lang[]
                               else coalesce(new.published_langs, array['ar', 'he', 'en', 'da']::public.site_lang[]) end loop
    if not public.story_lang_complete(new.id, v_lang) then
      raise exception 'published_incomplete';
    end if;
  end loop;
  return new;
end;
$$;
create trigger stories_published_complete before update on public.stories
  for each row execute function public.guard_published_complete();

-- ---------------------------------------------------------------------------------------------------------------
-- R1. A signed-in caller (the owner, through the API) cannot insert a story that is already published: the publish
-- rule in guard_publish() runs on update only. Imports by the server (no signed-in user) are unchanged.
-- ---------------------------------------------------------------------------------------------------------------
create function public.guard_publish_on_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and auth.uid() is not null then
    raise exception 'publish_blocked';
  end if;
  return new;
end;
$$;
create trigger stories_publish_guard_insert before insert on public.stories
  for each row execute function public.guard_publish_on_insert();

-- ---------------------------------------------------------------------------------------------------------------
-- R2. The author's words are locked in the tables themselves, not only inside owner_save_story(): her Arabic title
-- (story_listings) and her page list (no page added or removed) cannot change while text_locked is set, whoever
-- writes. Page pictures and layout still can (an existing page's upsert is allowed).
-- ---------------------------------------------------------------------------------------------------------------
create function public.guard_locked_listing() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_story uuid := coalesce(new.story_id, old.story_id);
begin
  if exists (select 1 from public.stories where id = v_story and text_locked)
     and ((tg_op = 'INSERT' and new.lang = 'ar')
          or (tg_op = 'DELETE' and old.lang = 'ar')
          or (tg_op = 'UPDATE' and (old.lang = 'ar' or new.lang = 'ar')
              and (old.title is distinct from new.title or old.lang is distinct from new.lang or old.story_id is distinct from new.story_id))) then
    raise exception 'text_locked';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger story_listings_locked before insert or update or delete on public.story_listings
  for each row execute function public.guard_locked_listing();

create function public.guard_locked_pages() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_story uuid := coalesce(new.story_id, old.story_id);
begin
  if not exists (select 1 from public.stories where id = v_story and text_locked) then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE'
     or (tg_op = 'INSERT' and not exists (select 1 from public.pages p where p.story_id = new.story_id and p.page_no = new.page_no))
     or (tg_op = 'UPDATE' and (old.page_no is distinct from new.page_no or old.story_id is distinct from new.story_id)) then
    raise exception 'text_locked';
  end if;
  return coalesce(new, old);
end;
$$;
create trigger pages_locked before insert or update or delete on public.pages
  for each row execute function public.guard_locked_pages();

-- ---------------------------------------------------------------------------------------------------------------
-- B3. The account-deleted email. The account (and so its address) is gone before the email job runs, so nothing
-- sent it. delete_my_account() now captures the address and language first and queues the email in email_log;
-- the job claims queued rows with email_claim_queued() and sends them (supabase/functions/email-reminders).
-- ---------------------------------------------------------------------------------------------------------------
alter table public.email_log add column claimed_at timestamptz;
alter table public.email_log drop constraint email_log_status_check;
alter table public.email_log add constraint email_log_status_check
  check (status in ('queued', 'sending', 'sent', 'bounced', 'complained', 'unsubscribed', 'failed', 'skipped'));

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_req uuid;
  v_email text;
  v_lang public.site_lang;
begin
  if v_uid is null then raise exception 'not_signed_in'; end if;
  select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  select p.language into v_lang from public.profiles p where p.id = v_uid;
  insert into public.deletion_requests (account_id) values (v_uid) returning id into v_req;
  if v_email is not null then
    -- account_id stays empty: the account is about to go. The address is kept only as the record of this email.
    insert into public.email_log (account_id, to_email, template, lang, status, dedupe_key)
    values (null, v_email, 'account_deleted', coalesce(v_lang, 'ar'), 'queued', 'account_deleted:' || v_req);
  end if;
  delete from auth.users where id = v_uid;
  update public.deletion_requests set completed_at = now() where id = v_req;
end;
$$;

-- Hands the job the emails queued by the database (today only account_deleted), each to one run only. A row left
-- in 'sending' for 15 minutes (a run that crashed) is handed out again; the Idempotency-Key on the send, made from
-- the row id, stops a double send at the sending service.
create function public.email_claim_queued(p_limit integer default 50) returns setof public.email_log
language sql security definer set search_path = '' as $$
  update public.email_log l set status = 'sending', claimed_at = now()
  where l.id in (
    select q.id from public.email_log q
    where q.template = 'account_deleted'
      and (q.status = 'queued' or (q.status = 'sending' and q.claimed_at < now() - interval '15 minutes'))
    order by q.created_at
    limit greatest(p_limit, 0)
    for update skip locked
  )
  returning l.*
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Who may call the new functions.
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.story_lang_visible(uuid, public.site_lang), public.guard_published_complete(),
  public.guard_publish_on_insert(), public.guard_locked_listing(), public.guard_locked_pages(),
  public.email_claim_queued(integer)
  from public, anon, authenticated;
grant execute on function public.story_lang_visible(uuid, public.site_lang) to authenticated;
grant execute on function public.email_claim_queued(integer) to service_role;
