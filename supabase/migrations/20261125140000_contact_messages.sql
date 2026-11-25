-- Site review (25 Nov 2026, second pass): the public contact form (/:lang/contact/).
--   * contact_messages: what a visitor wrote, for the owner to read. Nobody else can read or change it.
--   * send_contact_message(): the only way in, for signed-out and signed-in visitors alike. At most 3 messages an
--     hour for one email address, as the public "Cancel a purchase" form (request_cancellation).
-- Nothing is emailed yet: the owner's inbox and the reply email are not built (see docs/HANDOFF.md).

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text check (name is null or char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 320),
  lang public.site_lang not null,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from public, anon, authenticated;
grant select on public.contact_messages to authenticated;
grant update (handled_at) on public.contact_messages to authenticated;
create policy contact_messages_owner_read on public.contact_messages for select to authenticated using ((select public.is_owner()));
create policy contact_messages_owner_update on public.contact_messages for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));

create function public.send_contact_message(p_name text, p_email text, p_message text, p_lang public.site_lang) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if btrim(coalesce(p_email, '')) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  if (select count(*) from public.contact_messages
      where lower(email) = lower(btrim(p_email)) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'rate_limited';
  end if;
  insert into public.contact_messages (name, email, lang, message)
  values (nullif(left(btrim(coalesce(p_name, '')), 100), ''), btrim(p_email), p_lang, btrim(p_message));
end;
$$;
revoke execute on function public.send_contact_message(text, text, text, public.site_lang) from public;
grant execute on function public.send_contact_message(text, text, text, public.site_lang) to anon, authenticated;
