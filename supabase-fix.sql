-- supabase-fix.sql : run ONCE in Supabase SQL Editor on your existing project.
-- Step 1: replace the email below with the email you use to log in at /admin.
do $$
declare uid uuid;
begin
  select id into uid from auth.users where email = 'YOUR_ADMIN_EMAIL';
  if uid is null then raise exception 'No auth user found with that email - check the spelling.'; end if;
  -- Make that user the card admin (this is what allows saving from the admin panel).
  update public.memorial_card set admin_user_id = uid where id = 1;
end $$;

-- Step 2: photo-upload storage (same as in supabase-setup.sql)
insert into storage.buckets (id, name, public) values ('portraits', 'portraits', true)
on conflict (id) do update set public = true;
drop policy if exists "Public can view portraits" on storage.objects;
create policy "Public can view portraits" on storage.objects for select to anon, authenticated using (bucket_id = 'portraits');
drop policy if exists "Admin can upload portraits" on storage.objects;
create policy "Admin can upload portraits" on storage.objects for insert to authenticated
with check (bucket_id = 'portraits' and exists (select 1 from public.memorial_card m where m.id = 1 and m.admin_user_id = auth.uid()));
drop policy if exists "Admin can update portraits" on storage.objects;
create policy "Admin can update portraits" on storage.objects for update to authenticated
using (bucket_id = 'portraits' and exists (select 1 from public.memorial_card m where m.id = 1 and m.admin_user_id = auth.uid()));
drop policy if exists "Admin can delete portraits" on storage.objects;
create policy "Admin can delete portraits" on storage.objects for delete to authenticated
using (bucket_id = 'portraits' and exists (select 1 from public.memorial_card m where m.id = 1 and m.admin_user_id = auth.uid()));

-- Step 3 (optional): reset the card text to the new defaults and clear any old photo URL.
-- update public.memorial_card set content = content || '{"portraitUrl":""}'::jsonb where id = 1;
