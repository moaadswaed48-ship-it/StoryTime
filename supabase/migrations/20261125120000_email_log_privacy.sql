-- Stage 4, part C: no email address stays in the email log after an account is deleted (lawyer question 10,
-- docs/legal/LAWYER-PACK.md; privacy page "How long we keep it").
--
-- Before: delete_my_account() kept every email_log row with its address (account_id was only set to null), and
-- the queued account-deleted email kept the address for good.
-- Now:
--   * The address in a log row can be replaced by a salted SHA-256 of the normalised address (lower case, trimmed),
--     the same salt and formula as private.trial_ledger. What the log is kept for stays: which email (template),
--     language, status, times, the sending service's message id and the dedupe key, for audit and tax questions.
--   * delete_my_account() replaces the address in every earlier row of that account at once.
--   * The account-deleted email keeps its address only while it is waiting to be sent: when the row leaves
--     'queued'/'sending' (sent, skipped, failed for good, bounced) a trigger replaces the address with the hash.
--   * Rows already left by accounts deleted before this migration (account_id null) are hashed now, except an
--     account-deleted email that is still waiting.

alter table public.email_log alter column to_email drop not null;
alter table public.email_log add column to_email_hash text;
alter table public.email_log add constraint email_log_recipient_check check (to_email is not null or to_email_hash is not null);

-- The one formula for an email's hash. private: no client role can call it (the salt must not leak).
create function private.email_hash(p_email text) returns text
language sql stable security definer set search_path = '' as $$
  select encode(sha256(convert_to(s.ledger_salt || ':' || lower(btrim(p_email)), 'UTF8')), 'hex')
  from private.settings s
$$;
revoke all on function private.email_hash(text) from public, anon, authenticated;

-- An account-deleted email that is no longer waiting to be sent keeps no address.
create function public.email_log_forget_deleted() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.template = 'account_deleted' and new.account_id is null and new.to_email is not null
     and new.status not in ('queued', 'sending') then
    new.to_email_hash := private.email_hash(new.to_email);
    new.to_email := null;
  end if;
  return new;
end;
$$;
revoke execute on function public.email_log_forget_deleted() from public, anon, authenticated;
create trigger email_log_forget_deleted before insert or update on public.email_log
  for each row execute function public.email_log_forget_deleted();

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
  -- Every earlier email to this account or this address: the address goes, the record of the email stays.
  update public.email_log
     set to_email_hash = private.email_hash(to_email), to_email = null
   where to_email is not null and (account_id = v_uid or (v_email is not null and lower(btrim(to_email)) = v_email));
  if v_email is not null then
    -- account_id stays empty: the account is about to go. The address is kept only until this email has gone out
    -- (trigger email_log_forget_deleted).
    insert into public.email_log (account_id, to_email, template, lang, status, dedupe_key)
    values (null, v_email, 'account_deleted', coalesce(v_lang, 'ar'), 'queued', 'account_deleted:' || v_req);
  end if;
  delete from auth.users where id = v_uid;
  update public.deletion_requests set completed_at = now() where id = v_req;
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Rows left behind by accounts deleted before this migration.
update public.email_log
   set to_email_hash = private.email_hash(to_email), to_email = null
 where account_id is null and to_email is not null
   and not (template = 'account_deleted' and status in ('queued', 'sending'));
