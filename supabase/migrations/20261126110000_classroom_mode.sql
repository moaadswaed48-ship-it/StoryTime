-- Teachers: classroom mode (26 Nov 2026). A teacher's account remembers whether its screens are in classroom mode
-- (big words, big controls at the edges, no account details on screen), so it follows the account to the classroom
-- computer. The only change: profiles.prefs accepts one more key, `classroom`, a boolean. Every other rule of the
-- check from 20261125130000_family_prefs_favourites.sql stays as it was: unknown keys and wrong types are refused.
-- Any role may store the key (the screens use it only for the teacher role), so a role change never breaks a row.

alter table public.profiles drop constraint profiles_prefs_check;
alter table public.profiles add constraint profiles_prefs_check check (
  jsonb_typeof(prefs) = 'object'
  and prefs - array['autoFlip', 'captions', 'textScale', 'view', 'hintSeen', 'classroom'] = '{}'::jsonb
  and (not prefs ? 'autoFlip' or jsonb_typeof(prefs -> 'autoFlip') = 'boolean')
  and (not prefs ? 'captions' or jsonb_typeof(prefs -> 'captions') = 'boolean')
  and (not prefs ? 'hintSeen' or jsonb_typeof(prefs -> 'hintSeen') = 'boolean')
  and (not prefs ? 'classroom' or jsonb_typeof(prefs -> 'classroom') = 'boolean')
  and (not prefs ? 'textScale' or (jsonb_typeof(prefs -> 'textScale') = 'number' and (prefs ->> 'textScale')::numeric between 0 and 3))
  and (not prefs ? 'view' or prefs -> 'view' in ('"shelf"'::jsonb, '"list"'::jsonb, 'null'::jsonb))
);
