-- Publishes the terms version of the first full draft of the legal pages (src/data/terms.ts TERMS_VERSION).
-- The older version 'draft-2026-11-22' stays, so consents recorded under it keep pointing at a known version
-- (what it contained is recorded in src/data/terms.ts TERMS_HISTORY).
insert into private.terms_versions (version) values ('draft-2026-11-25') on conflict (version) do nothing;
