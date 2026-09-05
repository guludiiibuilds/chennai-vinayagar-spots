-- Chennai Vinayagar Spots — schema for Supabase
-- Run this once in the Supabase SQL editor (or `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text not null default '',
  theme text not null default '',
  landmark text not null default '',
  about text not null default '',
  submitted_by text not null default 'Anon',
  lat double precision,
  lng double precision,
  maps_link text,
  photo_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint spots_has_location check (
    (lat is not null and lng is not null) or maps_link is not null
  )
);

create index if not exists spots_status_idx on public.spots (status);
create index if not exists spots_created_at_idx on public.spots (created_at desc);

alter table public.spots enable row level security;

-- Anyone (including anonymous visitors) can read approved spots.
create policy "Public can read approved spots"
  on public.spots for select
  to anon, authenticated
  using (status = 'approved');

-- Anyone can submit a new spot, but it always lands as "pending" —
-- the insert is rejected if the caller tries to sneak in another status.
create policy "Public can submit pending spots"
  on public.spots for insert
  to anon, authenticated
  with check (status = 'pending' and approved_at is null);

-- No public update/delete policy is defined, so anon/authenticated
-- roles cannot approve, reject, or edit spots — that's left for a
-- service-role-backed admin tool to add later.

-- Storage bucket for community-submitted photos.
insert into storage.buckets (id, name, public)
values ('spot-photos', 'spot-photos', true)
on conflict (id) do nothing;

create policy "Public can view spot photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'spot-photos');

create policy "Public can upload spot photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'spot-photos');

-- Seed data matching the prototype, so the map isn't empty on first run.
insert into public.spots (name, area, theme, landmark, about, submitted_by, lat, lng, status, approved_at)
values
  ('Kapaleeshwarar Street Pandal', 'Mylapore', 'Temple gopuram', 'Opposite tank east gate', 'A 14-foot idol set inside a gopuram-shaped pandal built by the street association. Evening aarti draws the whole neighbourhood; the lane is closed to traffic after 6pm.', 'Ravi S.', 13.0335, 80.2698, 'approved', now()),
  ('Big Vinayagar, Ranganathan St', 'T. Nagar', 'Tallest idol', 'Near Panagal Park end', 'The tallest idol in the area at 22 feet, visible from the main road. Best seen early morning before the market crowd builds up.', 'Deepa K.', 13.0418, 80.2341, 'approved', now()),
  ('Marina Sands Pandal', 'Triplicane', 'Beachside', 'Behind the lighthouse gate', 'Set up on the sand with a sea-facing entrance. Immersion procession starts here on the final day.', 'Anand M.', 13.0605, 80.2790, 'approved', now()),
  ('Elliot''s Beach Vinayagar', 'Besant Nagar', 'Eco-friendly clay', 'Next to Karl Schmidt memorial', 'Unpainted clay idol by a local collective, made without plaster. They hand out seed packets instead of plastic decorations.', 'Meera R.', 13.0002, 80.2668, 'approved', now()),
  ('Tower Park Pandal', 'Anna Nagar', 'Light installation', 'Park west entrance', 'Known for its lighting: thousands of oil-lamp-style bulbs arranged as a canopy over the idol.', 'Suresh V.', 13.0876, 80.2101, 'approved', now()),
  ('Velachery Lake Pandal', 'Velachery', 'Community kitchen', 'Lake road, near bus depot', 'Free prasadam counter runs all day. Modest idol, very warm crowd, easy parking on the service road.', 'Priya N.', 12.9750, 80.2210, 'approved', now()),
  ('Big Street Vinayagar', 'Purasawalkam', 'Traditional', 'Beside the old bazaar arch', 'One of the oldest pandals in the city, run by the same family since the 1960s. Nadaswaram plays each evening.', 'Karthik B.', 13.0855, 80.2500, 'approved', now()),
  ('Bazaar Road Pandal', 'George Town', 'Street art', 'Corner of Mint Street', 'The pandal walls are painted each year by art students. This year''s panels tell the story of the harvest.', 'Fathima A.', 13.0930, 80.2870, 'approved', now()),
  ('Adyar Signal Vinayagar', 'Adyar', 'Kids'' zone', 'Near the bridge signal', 'Compact roadside setup with a small play area and story-telling sessions for children at 7pm.', 'Vignesh T.', 13.0067, 80.2570, 'approved', now()),
  ('Power House Pandal', 'Kodambakkam', 'Music nights', 'Behind the railway gate', 'Live devotional music every night from 8pm. The idol sits on a rotating platform built by local technicians.', 'Latha G.', 13.0510, 80.2270, 'approved', now())
on conflict do nothing;
