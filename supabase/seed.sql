-- =============================================================
-- Swells Lab — Seed: EPA (Erick Perez Arquitectos)
-- =============================================================
-- Run after schema.sql. Replace placeholder UUIDs and storage
-- paths once real photos are uploaded to the 'photos' bucket.
-- =============================================================

-- 1. Client
insert into clients (id, slug, name, onboarded_at)
values (
  'a1000000-0000-0000-0000-000000000001',
  'epa',
  'EPA — Erick Perez Arquitectos',
  '2025-05-01'
);

-- 2. Map EPA's Supabase Auth user to the client
--    Replace <EPA_USER_UUID> with the UUID from auth.users after the user
--    signs in for the first time (or after you invite them via magic link).
--
-- insert into client_users (client_id, user_id)
-- values (
--   'a1000000-0000-0000-0000-000000000001',
--   '<EPA_USER_UUID>'
-- );

-- 3. Gallery: Casa Cielo — Mazatlán
insert into galleries (
  id, client_id, title, slug, shoot_date, location, lens,
  description, published, display_order
)
values (
  'b2000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Casa Cielo',
  'casa-cielo',
  '2026-06-13',
  'Mazatlán, Sinaloa',
  '50mm',
  'Una residencia que dialoga con el horizonte del Pacífico. Espacios de doble altura, materiales naturales y luz cenital que cambia a lo largo del día.',
  true,
  1
);

-- 4. Photos
-- storage_path is relative to the 'photos' bucket root, e.g. "epa/casa-cielo/001.jpg"
-- width/height must match the real image dimensions — used for aspect-ratio layout.
-- Upload 50 photos to Supabase Storage and update these rows accordingly.
-- Below is a representative set of 12 placeholder entries.

insert into photos (
  id, gallery_id, client_id, storage_path, width, height, display_order
)
values
  ('c3000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/001.jpg', 4000, 6000, 1),
  ('c3000000-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/002.jpg', 6000, 4000, 2),
  ('c3000000-0000-0000-0000-000000000003','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/003.jpg', 4000, 5000, 3),
  ('c3000000-0000-0000-0000-000000000004','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/004.jpg', 6000, 4000, 4),
  ('c3000000-0000-0000-0000-000000000005','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/005.jpg', 4000, 6000, 5),
  ('c3000000-0000-0000-0000-000000000006','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/006.jpg', 5000, 4000, 6),
  ('c3000000-0000-0000-0000-000000000007','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/007.jpg', 4000, 4000, 7),
  ('c3000000-0000-0000-0000-000000000008','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/008.jpg', 6000, 4000, 8),
  ('c3000000-0000-0000-0000-000000000009','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/009.jpg', 4000, 6000, 9),
  ('c3000000-0000-0000-0000-000000000010','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/010.jpg', 5000, 3334, 10),
  ('c3000000-0000-0000-0000-000000000011','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/011.jpg', 4000, 5000, 11),
  ('c3000000-0000-0000-0000-000000000012','b2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001', 'epa/casa-cielo/012.jpg', 6000, 4000, 12);

-- 5. Set cover photo
update galleries
set cover_photo_id = 'c3000000-0000-0000-0000-000000000001'
where id = 'b2000000-0000-0000-0000-000000000001';

-- 6. Sample invoice (Month 2)
insert into invoices (
  client_id, title, amount, currency, status, due_date
)
values (
  'a1000000-0000-0000-0000-000000000001',
  'Fotografía arquitectónica — Mes 2',
  18500.00,
  'MXN',
  'sent',
  '2026-06-30'
);
