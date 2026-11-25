import type { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshDb, rows, user } from './harness'

/**
 * Review finding R4: nothing in the public schema is open by accident. Every public table must have row-level
 * security and a policy; signed-out visitors may touch only the listed tables; every function anyone outside the
 * server may call is on the reviewed list below. A new table or function fails here until it is reviewed: add it
 * to the list only after checking its grants, its policies and (for SECURITY DEFINER) its own guard.
 */

/** Functions signed-out visitors (anon) may call. */
const ANON_FUNCTIONS = [
  'has_access_to_story(p_story uuid)',
  'request_cancellation(p_email text, p_order_ref text, p_message text)',
  'send_contact_message(p_name text, p_email text, p_message text, p_lang site_lang)',
]

/** Functions signed-in users (authenticated) may call. Owner-only ones check is_owner() themselves or run under RLS. */
const AUTHENTICATED_FUNCTIONS = [
  'can_read_media(p_media uuid)',
  'cancel_purchase(p_pass uuid)',
  'create_order(p_age_group text, p_months integer, p_provider text, p_terms_version text)',
  'delete_my_account()',
  'export_my_data()',
  'has_access_to_activity(p_activity uuid)',
  'has_access_to_story(p_story uuid)',
  'has_pass_access(p_story uuid)',
  'has_trial_access(p_story uuid)',
  'is_owner()',
  'learner_kind_for_me()',
  'owner_create_story()',
  'owner_dashboard()',
  'owner_publish(p_story uuid, p_langs site_lang[])',
  'owner_save_story(p_story uuid, p_draft jsonb)',
  'owner_sign_off(p_story uuid, p_lang site_lang)',
  'owner_story(p_story uuid)',
  'owner_story_ids()',
  'owner_unpublish(p_story uuid)',
  'request_cancellation(p_email text, p_order_ref text, p_message text)',
  'send_contact_message(p_name text, p_email text, p_message text, p_lang site_lang)',
  'set_my_role(p_role account_role)',
  'start_trial(p_age_group text)',
  'story_is_published(p_story uuid)',
  'story_lang_complete(p_story uuid, p_lang site_lang)',
  'story_lang_fingerprint(p_story uuid, p_lang site_lang)',
  'story_lang_visible(p_story uuid, p_lang site_lang)',
]

/** Tables signed-out visitors may read. */
const ANON_TABLES = ['age_groups', 'pass_prices']

let db: PGlite
beforeAll(async () => {
  db = await freshDb({ preview: false })
}, 60_000)

const callable = async (role: 'anon' | 'authenticated') =>
  (await db.query<{ sig: string }>(
    `select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as sig
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege($1, p.oid, 'execute') order by 1`,
    [role],
  )).rows.map((r) => r.sig)

describe('catalogue of the public schema (R4)', () => {
  it('every public table has row-level security and at least one policy', async () => {
    const bad = await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p')
         and (not c.relrowsecurity or not exists (select 1 from pg_policy where polrelid = c.oid))`,
    )
    expect(bad.rows.map((r) => r.relname)).toEqual([])
  })

  it('signed-out visitors hold privileges on the listed tables only', async () => {
    const open = await db.query<{ relname: string }>(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
         and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('anon', c.oid, 'insert')
              or has_table_privilege('anon', c.oid, 'update') or has_table_privilege('anon', c.oid, 'delete'))
       order by 1`,
    )
    expect(open.rows.map((r) => r.relname)).toEqual(ANON_TABLES)
  })

  it('only the reviewed functions can be called by signed-out and signed-in users', async () => {
    expect(await callable('anon')).toEqual(ANON_FUNCTIONS)
    expect(await callable('authenticated')).toEqual(AUTHENTICATED_FUNCTIONS)
  })

  it('a table or function created after the migrations is closed to anon and authenticated by default', async () => {
    await db.exec(`
      create table public.forgot_rls (id int primary key, secret text);
      insert into public.forgot_rls values (1, 'x');
      create function public.forgot_revoke() returns int language sql security definer set search_path = '' as 'select 1';
      create sequence public.forgot_seq;`)
    const priv = (await db.query<Record<string, boolean>>(
      `select has_table_privilege('anon', 'public.forgot_rls', 'select') as anon_t,
              has_table_privilege('authenticated', 'public.forgot_rls', 'select') as auth_t,
              has_function_privilege('anon', 'public.forgot_revoke()', 'execute') as anon_f,
              has_function_privilege('authenticated', 'public.forgot_revoke()', 'execute') as auth_f,
              has_sequence_privilege('anon', 'public.forgot_seq', 'usage') as anon_s,
              has_function_privilege('service_role', 'public.forgot_revoke()', 'execute') as service_f`,
    )).rows[0]
    expect(priv).toEqual({ anon_t: false, auth_t: false, anon_f: false, auth_f: false, anon_s: false, service_f: true })
    await expect(rows(db, user('00000000-0000-0000-0000-000000000001'), 'select * from forgot_rls')).rejects.toThrow(/permission denied/)
    await db.exec(`drop table public.forgot_rls; drop function public.forgot_revoke(); drop sequence public.forgot_seq;`)
  })

  it('the private schema (settings, terms versions, trial record) is out of reach of every API role', async () => {
    for (const role of ['anon', 'authenticated'] as const) {
      const r = (await db.query<{ u: boolean }>(`select has_schema_privilege($1, 'private', 'usage') as u`, [role])).rows[0]!
      expect(r.u, role).toBe(false)
    }
    await expect(rows(db, user('00000000-0000-0000-0000-000000000001'), 'select * from private.trial_ledger')).rejects.toThrow(/permission denied/)
  })
})
