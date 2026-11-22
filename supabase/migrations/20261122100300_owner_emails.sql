-- StoryTime schema, part 4 (Stage 4 part B2): the owner's area and the emails.
--
--   * "Publish in these languages only" (stories.published_langs) and a publish rule the database enforces itself:
--     every published language complete and signed off on its current content, pictures on every page, an age group.
--   * Sign-offs remember a fingerprint of the language's content; any later change makes the sign-off stale.
--   * At most three trial stories per age group.
--   * owner_* functions: read and save a whole story in one transaction (security invoker: row-level security and
--     the owner policies of part 2 still apply), the owner's dashboard (security definer, owner only).
--   * Files: name, type and size on the media table; a private storage bucket "content" with owner write and
--     access-checked read (only where Supabase's storage schema exists; skipped in the PGlite tests).
--   * Emails: a dedupe key on email_log so a reminder is never sent twice, a suppression list for bounces and
--     complaints, unsubscribe by email link recorded as a consent, and the audience the reminder job reads.
--
-- Tested in PGlite by tests/db/owner-emails.test.ts. NOT run on a real Supabase project (none is approved):
-- in particular the storage block, the bucket size limit and the edge functions that call these functions.

-- ---------------------------------------------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------------------------------------------
alter table public.stories add column published_langs public.site_lang[];
comment on column public.stories.published_langs is 'Null = every language. Otherwise the owner chose "publish in these languages only".';

alter table public.media
  add column file_name text,
  add column mime_type text,
  add column bytes bigint check (bytes is null or bytes >= 0);

alter table public.story_signoffs add column fingerprint text;
comment on column public.story_signoffs.fingerprint is 'story_lang_fingerprint() when signed off; a sign-off counts only while it still matches.';

-- ---------------------------------------------------------------------------------------------------------------
-- Language completeness and fingerprints
-- ---------------------------------------------------------------------------------------------------------------

-- A language is complete when it has a title and every page has its text (the gaps that block sign-off).
create function public.story_lang_complete(p_story uuid, p_lang public.site_lang) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.story_listings l where l.story_id = p_story and l.lang = p_lang and btrim(l.title) <> '')
    and exists (select 1 from public.pages p where p.story_id = p_story)
    and not exists (
      select 1 from public.pages p
      where p.story_id = p_story
        and not exists (
          select 1 from public.story_texts t
          where t.story_id = p.story_id and t.page_no = p.page_no and t.lang = p_lang and btrim(t.display) <> ''
        )
    )
$$;

-- Everything a reviewer signs off in one language: title, teaser, page texts, film and captions, activity words.
create function public.story_lang_fingerprint(p_story uuid, p_lang public.site_lang) returns text
language sql stable security definer set search_path = '' as $$
  select md5(
    coalesce((select l.title || chr(2) || l.teaser from public.story_listings l where l.story_id = p_story and l.lang = p_lang), '') || chr(1) ||
    coalesce((
      select string_agg(coalesce(t.display, '') || chr(2) || coalesce(t.speech, ''), chr(3) order by p.page_no)
      from public.pages p
      left join public.story_texts t on t.story_id = p.story_id and t.page_no = p.page_no and t.lang = p_lang
      where p.story_id = p_story
    ), '') || chr(1) ||
    coalesce((select coalesce(f.video_media_id::text, '') || chr(2) || coalesce(f.captions_media_id::text, '') from public.films f where f.story_id = p_story and f.lang = p_lang), '') || chr(1) ||
    coalesce((select (a.texts -> p_lang::text)::text from public.activities a where a.story_id = p_story), '') || chr(1) ||
    coalesce((
      select string_agg(coalesce(s.captions ->> p_lang::text, ''), chr(3) order by s.position)
      from public.activity_steps s join public.activities a on a.id = s.activity_id
      where a.story_id = p_story
    ), '')
  )
$$;

-- Sign-off: only for a complete language the story can have; the fingerprint is taken by the database.
create function public.guard_signoff() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.stories s where s.id = new.story_id and s.credit = 'author') and new.lang <> 'ar' then
    raise exception 'signoff_blocked';
  end if;
  if not public.story_lang_complete(new.story_id, new.lang) then
    raise exception 'signoff_blocked';
  end if;
  new.fingerprint := public.story_lang_fingerprint(new.story_id, new.lang);
  return new;
end;
$$;
create trigger story_signoffs_guard before insert or update on public.story_signoffs
  for each row execute function public.guard_signoff();

-- Publishing: checked whenever a story becomes published or its published languages change.
create function public.guard_publish() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_langs public.site_lang[];
  v_lang public.site_lang;
begin
  if new.status <> 'published' or (old.status = 'published' and new.published_langs is not distinct from old.published_langs) then
    return new;
  end if;
  if new.credit = 'author' then
    if new.published_langs is not null and new.published_langs <> array['ar']::public.site_lang[] then
      raise exception 'publish_blocked';
    end if;
    v_langs := array['ar']::public.site_lang[];
  else
    v_langs := coalesce(new.published_langs, array['ar', 'he', 'en', 'da']::public.site_lang[]);
  end if;
  if coalesce(array_length(v_langs, 1), 0) = 0
     or not exists (select 1 from public.story_age_groups g where g.story_id = new.id)
     or not exists (select 1 from public.pages p where p.story_id = new.id)
     or exists (select 1 from public.pages p where p.story_id = new.id and p.picture_media_id is null) then
    raise exception 'publish_blocked';
  end if;
  foreach v_lang in array v_langs loop
    if not public.story_lang_complete(new.id, v_lang) or not exists (
      select 1 from public.story_signoffs so
      where so.story_id = new.id and so.lang = v_lang and so.fingerprint = public.story_lang_fingerprint(new.id, v_lang)
    ) then
      raise exception 'publish_blocked';
    end if;
  end loop;
  new.published_at := now();
  return new;
end;
$$;
create trigger stories_publish_guard before update on public.stories
  for each row execute function public.guard_publish();

-- At most three trial stories per age group (plan section 2).
create function public.guard_trial_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_trial and (select count(*) from public.story_age_groups g where g.age_group = new.age_group and g.is_trial) > 3 then
    raise exception 'trial_limit';
  end if;
  return new;
end;
$$;
create trigger story_age_groups_trial_limit after insert or update on public.story_age_groups
  for each row execute function public.guard_trial_limit();

-- ---------------------------------------------------------------------------------------------------------------
-- The owner's area: one story as JSON (the OwnerStory shape in src/features/owner/data/types.ts), saved whole.
-- ---------------------------------------------------------------------------------------------------------------

create function public.owner_story(p_story uuid) returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
  s public.stories;
  v_act uuid;
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  select * into s from public.stories where id = p_story;
  if not found then raise exception 'not_found'; end if;
  select a.id into v_act from public.activities a where a.story_id = s.id;
  return jsonb_build_object(
    'id', s.id, 'slug', s.slug, 'status', s.status, 'credit', s.credit, 'textLocked', s.text_locked,
    'publishLangs', to_jsonb(s.published_langs),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object('group', g.age_group, 'trial', g.is_trial) order by ag.position)
      from public.story_age_groups g join public.age_groups ag on ag.id = g.age_group where g.story_id = s.id), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', coalesce(p.layout ->> 'key', p.page_no::text), 'pictureId', p.picture_media_id,
        'zone', coalesce(p.layout -> 'zone', '{"side":"full","v":"bottom","size":"m"}'::jsonb)) order by p.page_no)
      from public.pages p where p.story_id = s.id), '[]'::jsonb),
    'texts', (
      select jsonb_object_agg(l.lang, jsonb_build_object(
        'title', coalesce((select x.title from public.story_listings x where x.story_id = s.id and x.lang = l.lang), ''),
        'teaser', coalesce((select x.teaser from public.story_listings x where x.story_id = s.id and x.lang = l.lang), ''),
        'pages', coalesce((
          select jsonb_object_agg(coalesce(p.layout ->> 'key', p.page_no::text), jsonb_build_object(
            'text', t.display, 'speech', case when t.speech = t.display then '' else t.speech end))
          from public.pages p join public.story_texts t on t.story_id = p.story_id and t.page_no = p.page_no and t.lang = l.lang
          where p.story_id = s.id), '{}'::jsonb),
        'activity', jsonb_build_object(
          'title', coalesce((select a.texts -> l.lang::text ->> 'title' from public.activities a where a.id = v_act), ''),
          'goal', coalesce((select a.texts -> l.lang::text ->> 'goal' from public.activities a where a.id = v_act), ''),
          'materials', coalesce((select a.texts -> l.lang::text -> 'materials' from public.activities a where a.id = v_act), '[]'::jsonb),
          'safety', coalesce((select a.texts -> l.lang::text ->> 'safety' from public.activities a where a.id = v_act), ''),
          'forAdult', coalesce((select a.texts -> l.lang::text ->> 'forAdult' from public.activities a where a.id = v_act), ''),
          'inClass', coalesce((select a.texts -> l.lang::text ->> 'inClass' from public.activities a where a.id = v_act), ''),
          'steps', coalesce((
            select jsonb_object_agg(st.id, st.captions ->> l.lang::text)
            from public.activity_steps st where st.activity_id = v_act and st.captions ? l.lang::text), '{}'::jsonb))))
      from (select unnest(array['ar', 'he', 'en', 'da']::public.site_lang[]) as lang) l),
    'films', (
      select jsonb_object_agg(l.lang, jsonb_build_object(
        'videoId', (select f.video_media_id from public.films f where f.story_id = s.id and f.lang = l.lang),
        'captionsId', (select f.captions_media_id from public.films f where f.story_id = s.id and f.lang = l.lang)))
      from (select unnest(array['ar', 'he', 'en', 'da']::public.site_lang[]) as lang) l),
    'activity', jsonb_build_object('steps', coalesce((
      select jsonb_agg(jsonb_build_object('key', st.id, 'mediaId', st.media_id,
        'loop', coalesce((select m.kind = 'video' from public.media m where m.id = st.media_id), false)) order by st.position)
      from public.activity_steps st where st.activity_id = v_act), '[]'::jsonb)),
    'signoffs', coalesce((
      select jsonb_object_agg(so.lang, jsonb_build_object(
        'valid', so.fingerprint is not distinct from public.story_lang_fingerprint(s.id, so.lang),
        'at', so.signed_off_at, 'by', so.signed_off_by))
      from public.story_signoffs so where so.story_id = s.id), '{}'::jsonb),
    'createdAt', s.created_at, 'updatedAt', s.updated_at, 'publishedAt', s.published_at
  );
end;
$$;

create function public.owner_story_ids() returns setof uuid
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  return query select id from public.stories order by updated_at desc;
end;
$$;

create function public.owner_create_story() returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  insert into public.stories (id, slug) values (v_id, 'story-' || substr(v_id::text, 1, 8));
  insert into public.pages (story_id, page_no, layout)
  values (v_id, 1, jsonb_build_object('key', gen_random_uuid(), 'zone', '{"side":"full","v":"bottom","size":"m"}'::jsonb));
  return v_id;
end;
$$;

-- Saves the editable parts of a story from the editor's draft (the StoryDraft shape). Only rows that really change
-- are written, so the audit log shows real changes. The author's Arabic words may not change at all.
create function public.owner_save_story(p_story uuid, p_draft jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  s public.stories;
  v_pages jsonb := coalesce(p_draft -> 'pages', '[]'::jsonb);
  v_steps jsonb := coalesce(p_draft -> 'activity' -> 'steps', '[]'::jsonb);
  v_n integer := jsonb_array_length(coalesce(p_draft -> 'pages', '[]'::jsonb));
  v_langs public.site_lang[];
  v_lang public.site_lang;
  v_page jsonb;
  v_key text;
  v_text text;
  v_speech text;
  v_act uuid;
  v_has_activity boolean;
  i integer;
  n integer;
  v_changed integer := 0;
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  select * into s from public.stories where id = p_story for update;
  if not found then raise exception 'not_found'; end if;
  v_langs := case when s.credit = 'author' then array['ar']::public.site_lang[] else array['ar', 'he', 'en', 'da']::public.site_lang[] end;

  if s.text_locked then
    -- Same pages in the same order, same Arabic title, same Arabic words on every page.
    if (select coalesce(string_agg(coalesce(p.layout ->> 'key', p.page_no::text), ',' order by p.page_no), '') from public.pages p where p.story_id = s.id)
       is distinct from (select coalesce(string_agg(x ->> 'key', ',' order by o), '') from jsonb_array_elements(v_pages) with ordinality as e(x, o))
       or coalesce((select title from public.story_listings where story_id = s.id and lang = 'ar'), '') is distinct from coalesce(p_draft -> 'texts' -> 'ar' ->> 'title', '')
       or exists (
         select 1 from public.pages p
         left join public.story_texts t on t.story_id = p.story_id and t.page_no = p.page_no and t.lang = 'ar'
         where p.story_id = s.id
           and (coalesce(t.display, '') is distinct from coalesce(p_draft -> 'texts' -> 'ar' -> 'pages' -> (p.layout ->> 'key') ->> 'text', '')
             or coalesce(nullif(t.speech, t.display), '') is distinct from coalesce(p_draft -> 'texts' -> 'ar' -> 'pages' -> (p.layout ->> 'key') ->> 'speech', ''))
       ) then
      raise exception 'text_locked';
    end if;
  end if;

  -- Age groups and trial marks
  delete from public.story_age_groups g where g.story_id = s.id
    and g.age_group not in (select x ->> 'group' from jsonb_array_elements(coalesce(p_draft -> 'groups', '[]'::jsonb)) x);
  get diagnostics n = row_count; v_changed := v_changed + n;
  insert into public.story_age_groups (story_id, age_group, is_trial, trial_position)
  select s.id, x ->> 'group', coalesce((x ->> 'trial')::boolean, false), 1
  from jsonb_array_elements(coalesce(p_draft -> 'groups', '[]'::jsonb)) x
  on conflict (story_id, age_group) do update set is_trial = excluded.is_trial
    where public.story_age_groups.is_trial is distinct from excluded.is_trial;
  get diagnostics n = row_count; v_changed := v_changed + n;

  -- Pages (pictures and where the words sit)
  delete from public.pages where story_id = s.id and page_no > v_n;
  get diagnostics n = row_count; v_changed := v_changed + n;
  for i in 0 .. v_n - 1 loop
    v_page := v_pages -> i;
    insert into public.pages (story_id, page_no, picture_media_id, layout)
    values (s.id, i + 1, nullif(v_page ->> 'pictureId', '')::uuid, jsonb_build_object('key', v_page ->> 'key', 'zone', v_page -> 'zone'))
    on conflict (story_id, page_no) do update set picture_media_id = excluded.picture_media_id, layout = excluded.layout
      where (public.pages.picture_media_id, public.pages.layout) is distinct from (excluded.picture_media_id, excluded.layout);
    get diagnostics n = row_count; v_changed := v_changed + n;
  end loop;

  -- Words: titles and page texts per language (never touched on a locked story: they were checked equal above)
  if not s.text_locked then
    foreach v_lang in array array['ar', 'he', 'en', 'da']::public.site_lang[] loop
      if v_lang = any (v_langs) and btrim(coalesce(p_draft -> 'texts' -> v_lang::text ->> 'title', '') || coalesce(p_draft -> 'texts' -> v_lang::text ->> 'teaser', '')) <> '' then
        insert into public.story_listings (story_id, lang, title, teaser)
        values (s.id, v_lang, coalesce(p_draft -> 'texts' -> v_lang::text ->> 'title', ''), coalesce(p_draft -> 'texts' -> v_lang::text ->> 'teaser', ''))
        on conflict (story_id, lang) do update set title = excluded.title, teaser = excluded.teaser
          where (public.story_listings.title, public.story_listings.teaser) is distinct from (excluded.title, excluded.teaser);
      else
        delete from public.story_listings where story_id = s.id and lang = v_lang;
      end if;
      get diagnostics n = row_count; v_changed := v_changed + n;
      for i in 0 .. v_n - 1 loop
        v_key := v_pages -> i ->> 'key';
        v_text := coalesce(p_draft -> 'texts' -> v_lang::text -> 'pages' -> v_key ->> 'text', '');
        v_speech := coalesce(p_draft -> 'texts' -> v_lang::text -> 'pages' -> v_key ->> 'speech', '');
        if v_lang = any (v_langs) and btrim(v_text || v_speech) <> '' then
          insert into public.story_texts (story_id, page_no, lang, display, speech)
          values (s.id, i + 1, v_lang, v_text, coalesce(nullif(v_speech, ''), v_text))
          on conflict (story_id, page_no, lang) do update set display = excluded.display, speech = excluded.speech
            where (public.story_texts.display, public.story_texts.speech) is distinct from (excluded.display, excluded.speech);
        else
          delete from public.story_texts where story_id = s.id and page_no = i + 1 and lang = v_lang;
        end if;
        get diagnostics n = row_count; v_changed := v_changed + n;
      end loop;
    end loop;
  end if;

  -- Films, one per language
  foreach v_lang in array array['ar', 'he', 'en', 'da']::public.site_lang[] loop
    if v_lang = any (v_langs) and coalesce(p_draft -> 'films' -> v_lang::text ->> 'videoId', p_draft -> 'films' -> v_lang::text ->> 'captionsId') is not null then
      insert into public.films (story_id, lang, video_media_id, captions_media_id)
      values (s.id, v_lang, (p_draft -> 'films' -> v_lang::text ->> 'videoId')::uuid, (p_draft -> 'films' -> v_lang::text ->> 'captionsId')::uuid)
      on conflict (story_id, lang) do update set video_media_id = excluded.video_media_id, captions_media_id = excluded.captions_media_id
        where (public.films.video_media_id, public.films.captions_media_id) is distinct from (excluded.video_media_id, excluded.captions_media_id);
    else
      delete from public.films where story_id = s.id and lang = v_lang;
    end if;
    get diagnostics n = row_count; v_changed := v_changed + n;
  end loop;

  -- Activity: texts per language, steps with their picture or loop and captions
  v_has_activity := jsonb_array_length(v_steps) > 0 or exists (
    select 1 from unnest(v_langs) l, jsonb_each_text(coalesce(p_draft -> 'texts' -> l::text -> 'activity', '{}'::jsonb) - 'steps' - 'materials') kv
    where btrim(kv.value) <> '')
    or exists (select 1 from unnest(v_langs) l where jsonb_array_length(coalesce(p_draft -> 'texts' -> l::text -> 'activity' -> 'materials', '[]'::jsonb)) > 0);
  if not v_has_activity then
    delete from public.activities where story_id = s.id;
    get diagnostics n = row_count; v_changed := v_changed + n;
  else
    insert into public.activities (story_id, texts)
    values (s.id, (
      select jsonb_object_agg(l, (coalesce(p_draft -> 'texts' -> l::text -> 'activity', '{}'::jsonb) - 'steps'))
      from unnest(v_langs) l))
    on conflict (story_id) do update set texts = excluded.texts where public.activities.texts is distinct from excluded.texts;
    get diagnostics n = row_count; v_changed := v_changed + n;
    select id into v_act from public.activities where story_id = s.id;
    delete from public.activity_steps st where st.activity_id = v_act
      and st.id::text not in (select x ->> 'key' from jsonb_array_elements(v_steps) x);
    get diagnostics n = row_count; v_changed := v_changed + n;
    -- Move every remaining step out of the way first, so a new order never collides with the unique position.
    update public.activity_steps st set position = -st.position where st.activity_id = v_act and st.position > 0
      and exists (select 1 from jsonb_array_elements(v_steps) with ordinality e(x, o) where x ->> 'key' = st.id::text and o <> st.position);
    for i in 0 .. jsonb_array_length(v_steps) - 1 loop
      insert into public.activity_steps (id, activity_id, position, media_id, captions)
      values ((v_steps -> i ->> 'key')::uuid, v_act, i + 1, nullif(v_steps -> i ->> 'mediaId', '')::uuid, (
        select coalesce(jsonb_object_agg(l, p_draft -> 'texts' -> l::text -> 'activity' -> 'steps' ->> (v_steps -> i ->> 'key')), '{}'::jsonb)
        from unnest(v_langs) l
        where btrim(coalesce(p_draft -> 'texts' -> l::text -> 'activity' -> 'steps' ->> (v_steps -> i ->> 'key'), '')) <> ''))
      on conflict (id) do update set position = excluded.position, media_id = excluded.media_id, captions = excluded.captions
        where (public.activity_steps.position, public.activity_steps.media_id, public.activity_steps.captions)
          is distinct from (excluded.position, excluded.media_id, excluded.captions);
      get diagnostics n = row_count; v_changed := v_changed + n;
    end loop;
  end if;

  if v_changed > 0 then
    update public.stories set version = version + 1 where id = s.id;
  end if;
end;
$$;

create function public.owner_sign_off(p_story uuid, p_lang public.site_lang) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  insert into public.story_signoffs (story_id, lang, version, signed_off_by, signed_off_at)
  values (p_story, p_lang, (select version from public.stories where id = p_story), auth.uid(), now())
  on conflict (story_id, lang) do update set version = excluded.version, signed_off_by = excluded.signed_off_by, signed_off_at = now();
end;
$$;

create function public.owner_publish(p_story uuid, p_langs public.site_lang[]) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_credit text;
  v_langs public.site_lang[];
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  select credit into v_credit from public.stories where id = p_story;
  if not found then raise exception 'not_found'; end if;
  -- Kept in a fixed order; all four (StoryTime's own story) is stored as null.
  select array_agg(l order by array_position(array['ar', 'he', 'en', 'da']::public.site_lang[], l)) into v_langs
  from (select distinct unnest(p_langs) as l) x;
  if v_credit = 'author' then
    v_langs := array['ar']::public.site_lang[];
  elsif v_langs is null or v_langs @> array['ar', 'he', 'en', 'da']::public.site_lang[] then
    v_langs := null;
  end if;
  -- guard_publish() checks the rule and raises publish_blocked.
  update public.stories set status = 'published', published_langs = v_langs where id = p_story;
end;
$$;

create function public.owner_unpublish(p_story uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  update public.stories set status = 'draft' where id = p_story;
end;
$$;

-- The owner's dashboard: counts and recent purchases with the buyer's email (never a child's name).
create function public.owner_dashboard() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_owner() then raise exception 'not_owner'; end if;
  return jsonb_build_object(
    'now', now(),
    'signUps', (
      select jsonb_build_object('total', count(*), 'last7Days', count(*) filter (where created_at > now() - interval '7 days'),
        'parents', count(*) filter (where role = 'parent'), 'teachers', count(*) filter (where role = 'teacher'))
      from public.profiles where role <> 'owner'),
    'activeTrials', (
      select jsonb_object_agg(g.id, (select count(*) from public.trials t where t.age_group = g.id and now() >= t.started_at and now() < t.ends_at))
      from public.age_groups g),
    'activePasses', (
      select jsonb_object_agg(g.id, (select count(*) from public.passes p where p.age_group = g.id and p.status = 'active' and now() >= p.starts_at and now() < p.ends_at))
      from public.age_groups g),
    'recentPurchases', coalesce((
      select jsonb_agg(to_jsonb(x) order by x."createdAt" desc)
      from (
        select o.id as "orderId", u.email, o.age_group as "ageGroup", o.months, o.amount_agorot as "amountAgorot",
               o.price_was_placeholder as "priceWasPlaceholder", o.status, o.paid_at as "paidAt", o.created_at as "createdAt"
        from public.orders o left join auth.users u on u.id = o.account_id
        where o.status <> 'pending'
        order by o.created_at desc
        limit 20
      ) x), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Emails
-- ---------------------------------------------------------------------------------------------------------------

-- One row per email. dedupe_key (for example "pass_ends_7d:<pass id>") is claimed before sending, so a reminder
-- is never sent twice, even when two runs overlap.
alter table public.email_log
  add column dedupe_key text unique,
  add column sent_at timestamptz,
  add column error text;
alter table public.email_log drop constraint email_log_status_check;
alter table public.email_log add constraint email_log_status_check
  check (status in ('queued', 'sent', 'bounced', 'complained', 'unsubscribed', 'failed', 'skipped'));

-- Addresses that must get nothing more: a permanent bounce or a spam complaint (from the sending service's webhook).
create table public.email_suppressions (
  email text primary key check (email = lower(email)),
  reason text not null check (reason in ('bounced', 'complained')),
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
grant select on public.email_suppressions to authenticated;
create policy email_suppressions_owner on public.email_suppressions for select to authenticated using ((select public.is_owner()));

-- Unsubscribing from the link in a news email is recorded like any other change of mind.
alter table public.consents drop constraint consents_source_check;
alter table public.consents add constraint consents_source_check check (source in ('sign-up', 'settings', 'checkout', 'email-link'));

-- What the reminder job needs about every account: address, language, the latest news consent, trial, passes and
-- the age groups of its profiles. Service role only (the edge function); children's names are not included.
create function public.email_audience() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'accountId', p.id,
    'email', lower(u.email),
    'lang', p.language,
    'role', p.role,
    'marketing', coalesce((select c.granted from public.consents c where c.account_id = p.id and c.kind = 'marketing' order by c.created_at desc limit 1), false),
    'groups', coalesce((select jsonb_agg(distinct ch.age_group) from public.children ch where ch.account_id = p.id), '[]'::jsonb),
    'trial', (select jsonb_build_object('id', t.id, 'ageGroup', t.age_group, 'startedAt', t.started_at, 'endsAt', t.ends_at) from public.trials t where t.account_id = p.id),
    'passes', coalesce((
      select jsonb_agg(jsonb_build_object('id', ps.id, 'ageGroup', ps.age_group, 'months', ps.months, 'startsAt', ps.starts_at, 'endsAt', ps.ends_at,
        'status', ps.status, 'paidAt', o.paid_at))
      from public.passes ps left join public.orders o on o.id = ps.order_id where ps.account_id = p.id), '[]'::jsonb)
  )), '[]'::jsonb)
  from public.profiles p join auth.users u on u.id = p.id
  where p.role <> 'owner' and u.email is not null
$$;

-- Published stories for the "new story" news email (catalogue facts only).
create function public.email_new_stories(p_since timestamptz) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'publishedAt', s.published_at, 'langs', to_jsonb(coalesce(s.published_langs, array['ar', 'he', 'en', 'da']::public.site_lang[])),
    'groups', (select jsonb_agg(g.age_group) from public.story_age_groups g where g.story_id = s.id),
    'titles', (select jsonb_object_agg(l.lang, l.title) from public.story_listings l where l.story_id = s.id))), '[]'::jsonb)
  from public.stories s
  where s.status = 'published' and s.published_at >= p_since
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------------------------------------------
revoke execute on function public.story_lang_complete(uuid, public.site_lang), public.story_lang_fingerprint(uuid, public.site_lang),
  public.guard_signoff(), public.guard_publish(), public.guard_trial_limit(),
  public.owner_story(uuid), public.owner_story_ids(), public.owner_create_story(), public.owner_save_story(uuid, jsonb),
  public.owner_sign_off(uuid, public.site_lang), public.owner_publish(uuid, public.site_lang[]), public.owner_unpublish(uuid),
  public.owner_dashboard(), public.email_audience(), public.email_new_stories(timestamptz)
  from public, anon;
revoke execute on function public.guard_signoff(), public.guard_publish(), public.guard_trial_limit(),
  public.email_audience(), public.email_new_stories(timestamptz) from authenticated;
grant execute on function public.story_lang_complete(uuid, public.site_lang), public.story_lang_fingerprint(uuid, public.site_lang),
  public.owner_story(uuid), public.owner_story_ids(), public.owner_create_story(), public.owner_save_story(uuid, jsonb),
  public.owner_sign_off(uuid, public.site_lang), public.owner_publish(uuid, public.site_lang[]), public.owner_unpublish(uuid),
  public.owner_dashboard() to authenticated;
grant execute on function public.email_audience(), public.email_new_stories(timestamptz) to service_role;
grant select, insert, update on public.email_log to service_role;
grant select, insert, update, delete on public.email_suppressions to service_role;

-- ---------------------------------------------------------------------------------------------------------------
-- Storage: a private bucket for pictures, films, loops and captions. Only where Supabase storage exists.
-- The owner writes; a family reads a file only when can_read_media() allows its media row. Size limit 500 MB
-- (the film limit in src/features/owner/data/rules.ts); the project's global upload limit must allow it too.
-- ---------------------------------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('content', 'content', false, 524288000, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'text/vtt'])
    on conflict (id) do nothing;
    execute $p$create policy content_owner_write on storage.objects for all to authenticated
      using (bucket_id = 'content' and (select public.is_owner()))
      with check (bucket_id = 'content' and (select public.is_owner()))$p$;
    execute $p$create policy content_read_with_access on storage.objects for select to authenticated
      using (bucket_id = 'content' and exists (
        select 1 from public.media m where m.storage_path = storage.objects.name and public.can_read_media(m.id)))$p$;
  end if;
end;
$$;
