-- Create attachments storage bucket if not exists
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Drop policies if they exist to avoid duplication
drop policy if exists "Attachments select" on storage.objects;
drop policy if exists "Attachments insert" on storage.objects;
drop policy if exists "Attachments delete" on storage.objects;

-- Allow authenticated users to select, insert, and delete from the attachments bucket
create policy "Attachments select" on storage.objects for select to authenticated using (bucket_id = 'attachments');
create policy "Attachments insert" on storage.objects for insert to authenticated with check (bucket_id = 'attachments');
create policy "Attachments delete" on storage.objects for delete to authenticated using (bucket_id = 'attachments'); 