-- Adds admin-controlled "Popular" flagging, shown as a badge on map pins.
-- Run this once in the Supabase SQL editor (same place schema.sql was run).

alter table public.spots
  add column if not exists is_popular boolean not null default false;
