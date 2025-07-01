-- Contacts table migration
alter table contacts add column if not exists external_id text;
alter table contacts add column if not exists phone_1_number text;
alter table contacts add column if not exists phone_1_type text;
alter table contacts add column if not exists phone_2_number text;
alter table contacts add column if not exists phone_2_type text;
alter table contacts add column if not exists linkedin_url text;
alter table contacts add column if not exists background text;

-- Companies table migration
alter table companies add column if not exists external_id text;
alter table companies add column if not exists website text;
alter table companies add column if not exists phone_number text;
alter table companies add column if not exists linkedin_url text;
alter table companies add column if not exists revenue text;
alter table companies add column if not exists size text;
alter table companies add column if not exists founded_year integer;
alter table companies add column if not exists sector text;
alter table companies add column if not exists context_links jsonb;
alter table companies add column if not exists description text;

-- Indexes for efficient lookups by external_id
create unique index if not exists contacts_external_id_idx on contacts (external_id);
create unique index if not exists companies_external_id_idx on companies (external_id); 