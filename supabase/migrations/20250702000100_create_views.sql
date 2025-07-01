-- Create init_state view
create or replace view public.init_state
with (security_invoker=off)
as
select count(id) as is_initialized
from (
  select id 
  from public.sales
  limit 1
) as sub;

-- Create companies_summary view
create or replace view public.companies_summary
with (security_invoker=on)
as
select 
    c.*,
    count(distinct d.id) as nb_deals,
    count(distinct co.id) as nb_contacts
from 
    public.companies c
left join 
    public.deals d on c.id = d.company_id
left join 
    public.contacts co on c.id = co.company_id
group by 
    c.id;

-- Create contacts_summary view
create or replace view public.contacts_summary
with (security_invoker=on)
as
select 
    co.*,
    c.name as company_name,
    count(distinct t.id) as nb_tasks
from
    public.contacts co
left join
    public.tasks t on co.id = t.contact_id
left join
    public.companies c on co.company_id = c.id
group by
    co.id, c.name; 