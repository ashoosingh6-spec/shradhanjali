-- 1) Create an Admin user in Supabase Dashboard > Authentication > Users.
-- 2) Copy that user's UUID and replace YOUR_ADMIN_AUTH_USER_UUID below.
create table if not exists public.memorial_card (
  id integer primary key check (id = 1),
  content jsonb not null,
  custom_css text not null default '',
  admin_user_id uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.memorial_card enable row level security;

drop policy if exists "Public can read memorial card" on public.memorial_card;
create policy "Public can read memorial card"
on public.memorial_card for select
to anon, authenticated
using (true);

drop policy if exists "Only designated admin can update memorial card" on public.memorial_card;
create policy "Only designated admin can update memorial card"
on public.memorial_card for update
to authenticated
using (auth.uid() = admin_user_id)
with check (auth.uid() = admin_user_id);

insert into public.memorial_card (id, content, custom_css, admin_user_id)
values (
  1,
  '{
    "omText":"॥ ॐ शांति ॥",
    "title":"शोक-संदेश",
    "shloka":"न चैनं क्लेदयन्त्यापो न शोषयति मारुतः ॥\\nनैनं दहति पावकः न चैनं क्लेदयन्ति शस्त्राणि ॥",
    "recipientPlaceholder":"श्रीमान / श्रीमती ........................................",
    "salutation":"मान्यवर,",
    "intro":"अत्यन्त दुःख के साथ सूचित करना पड़ रहा है कि मेरे बड़े भैया",
    "deceasedName":"श्री राम निहोरी सिंह",
    "deathDate":"20/05/2025",
    "deathDay":"मंगलवार",
    "afterDeath":"का स्वर्गवास दिनांक",
    "invitation":"अतः दिवंगत आत्मा की शांति हेतु आयोजित निम्नलिखित श्राद्ध-कार्यक्रम में उपस्थित होकर हमें कृतार्थ करें।",
    "scheduleTitle":"श्राद्ध-कार्यक्रम",
    "events":[
      {"date":"30/05/2025","day":"शुक्रवार","title":"दशाकर्म"},
      {"date":"31/05/2025","day":"शनिवार","title":"एकादशा"},
      {"date":"01/06/2025","day":"रविवार","title":"ब्रह्मभोज एवं पुष्पांजलि"},
      {"date":"02/06/2025","day":"सोमवार","title":"बरसती, पीपल में पानी"}
    ],
    "familyTitle":"शोकाकुल",
    "familyLines":["संजय कु० (शिक्षक),","कारू सिंह, अजय कु०, आशुतोष, अनुपम,","अभिराम, गोपाल जी, अनुराग, कृष्ण,","विवकी, संस्कार एवं समस्त वत्स परिवार।"],
    "regardsTitle":"विनीत",
    "representative":"मधेश्वर सिंह",
    "address":"ग्राम : पथरोरा, वजीरगंज (गया जी)",
    "phones":"9939341216, 9708084906",
    "footer":"॥ दिवंगत आत्मा को विनम्र श्रद्धांजलि ॥",
    "portraitUrl":""
  }'::jsonb,
  '',
  'YOUR_ADMIN_AUTH_USER_UUID'
)
on conflict (id) do nothing;

-- 3) Photo uploads: public-read bucket, only the designated admin can write.
insert into storage.buckets (id, name, public) values ('portraits', 'portraits', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view portraits" on storage.objects;
create policy "Public can view portraits" on storage.objects for select to anon, authenticated
using (bucket_id = 'portraits');

drop policy if exists "Admin can upload portraits" on storage.objects;
create policy "Admin can upload portraits" on storage.objects for insert to authenticated
with check (bucket_id = 'portraits' and exists (select 1 from public.memorial_card m where m.id = 1 and m.admin_user_id = auth.uid()));

drop policy if exists "Admin can update portraits" on storage.objects;
create policy "Admin can update portraits" on storage.objects for update to authenticated
using (bucket_id = 'portraits' and exists (select 1 from public.memorial_card m where m.id = 1 and m.admin_user_id = auth.uid()));

drop policy if exists "Admin can delete portraits" on storage.objects;
create policy "Admin can delete portraits" on storage.objects for delete to authenticated
using (bucket_id = 'portraits' and exists (select 1 from public.memorial_card m where m.id = 1 and m.admin_user_id = auth.uid()));

-- Do not expose service_role key in the browser.
-- No public INSERT/DELETE policies are intentionally created.
