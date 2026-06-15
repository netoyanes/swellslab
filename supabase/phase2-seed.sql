-- =============================================================
-- Swells Lab — PHASE 2 seed
-- Run AFTER phase2-schema.sql.
-- =============================================================

-- 1. Backfill profiles for any existing auth users (trigger only
--    fires on NEW signups). Defaults everyone to 'client'.
insert into profiles (id, email, role)
select id, email, 'client' from auth.users
on conflict (id) do nothing;

-- 2. Promote the studio owner to admin.
update profiles set role = 'admin', client_id = null
where email = 'neto@swells.mx';

-- 3. Client: EPA
insert into clients (id, slug, name, onboarded_at)
values ('a1000000-0000-0000-0000-000000000001','epa','EPA — Erick Perez Arquitectos','2025-05-01')
on conflict (id) do nothing;

-- 4. Link Erick's account to EPA (only affects him if he exists).
--    Adjust the email to Erick's real address.
update profiles set role = 'client', client_id = 'a1000000-0000-0000-0000-000000000001'
where email = 'erick@epa.mx';

-- 5. Project
insert into projects (id, client_id, title, slug)
values ('d4000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Casa Cielo','casa-cielo')
on conflict (id) do nothing;

-- 6. Gallery: Casa Cielo
insert into galleries (id, client_id, project_id, title, slug, shoot_date, location, lens, description, published, display_order)
values (
  'b2000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'd4000000-0000-0000-0000-000000000001',
  'Casa Cielo','casa-cielo','2026-06-13','Mazatlán, Sinaloa','50mm',
  'Una residencia que dialoga con el horizonte del Pacífico. Espacios de doble altura, materiales naturales y luz cenital que cambia a lo largo del día.',
  true, 1
) on conflict (id) do nothing;

-- 7. Placeholder assets (replace storage_path with real uploads from
--    the studio uploader, which sets width/height automatically).
insert into assets (gallery_id, client_id, type, bucket, storage_path, width, height, display_order)
values
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/001.jpg',4000,6000,1),
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/002.jpg',6000,4000,2),
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/003.jpg',4000,5000,3),
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/004.jpg',6000,4000,4),
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/005.jpg',4000,6000,5),
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/006.jpg',5000,4000,6),
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/007.jpg',4000,4000,7),
  ('b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','image','images','epa/casa-cielo/008.jpg',6000,4000,8);

-- 8. Sample invoice
insert into invoices (client_id, project_id, title, amount, currency, status, due_date)
values (
  'a1000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000001',
  'Fotografía arquitectónica — Mes 2', 18500.00, 'MXN', 'sent', '2026-06-30'
);
