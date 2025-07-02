-- Drop old summary views first
DROP VIEW IF EXISTS public.contacts_summary CASCADE;
DROP VIEW IF EXISTS public.companies_summary CASCADE;

-- Fix companies_summary view
create or replace view public.companies_summary as
select 
    c.id,
    c.name,
    c.logo,
    c.sector,
    c.size,
    c.linkedin_url,
    c.website,
    c.phone_number,
    c.address,
    c.zipcode,
    c.city,
    c.stateAbbr,
    c.sales_id,
    c.created_at,
    c.description,
    c.revenue,
    c.tax_identifier,
    c.country,
    count(distinct d.id) as nb_deals,
    count(distinct co.id) as nb_contacts
from 
    public.companies c
left join 
    public.deals d on c.id = d.company_id
left join 
    public.contacts co on c.id = co.company_id
group by 
    c.id, c.name, c.logo, c.sector, c.size, c.linkedin_url, c.website, c.phone_number, c.address, c.zipcode, c.city, c.stateAbbr, c.sales_id, c.created_at, c.description, c.revenue, c.tax_identifier, c.country;

-- Fix contacts_summary view
create or replace view public.contacts_summary as
select 
    co.id,
    co.first_name,
    co.last_name,
    co.title,
    co.company_id,
    co.linkedin_url,
    co.first_seen,
    co.last_seen,
    co.has_newsletter,
    co.gender,
    co.sales_id,
    co.status,
    co.background,
    co.created_at,
    c.name as company_name,
    count(distinct t.id) as nb_tasks
from
    public.contacts co
left join
    public.tasks t on co.id = t.contact_id
left join
    public.companies c on co.company_id = c.id
group by
    co.id, co.first_name, co.last_name, co.title, co.company_id, co.linkedin_url, co.first_seen, co.last_seen, co.has_newsletter, co.gender, co.sales_id, co.status, co.background, co.created_at, c.name; 