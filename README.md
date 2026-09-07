# Chennai Vinayaka Spots

A mobile-first web app for discovering and contributing Vinayaka Chaturthi idol locations across Chennai. No login required to browse or submit. Built with Next.js (App Router), Supabase (data + photo storage), and Leaflet/OpenStreetMap for the map.

Implements the design in `../Chennai Vinayagar Spots.dc.html` (see `../README.md` and `../chats/chat1.md` for the original design brief).

## Stack

- **Next.js 16** (App Router, JS)
- **Supabase** — Postgres table for spots + Storage bucket for photos, accessed client-side with the publishable/anon key
- **Leaflet + OpenStreetMap** — free, open-source map tiles, no API key

## Setup

1. **Apply the database schema.** Open the SQL editor for your Supabase project and run `supabase/schema.sql`. It creates the `spots` table, row-level security policies (public can read approved spots and submit pending ones; nothing can approve/reject without a service-role key), a public `spot-photos` storage bucket, and seeds the 10 spots from the original prototype as `approved` so the map isn't empty on first run.

2. **Environment variables.** `.env.local` is already populated with the project URL and publishable key that were provided. If you're pointing at a different Supabase project, copy `.env.example` to `.env.local` and fill in your own values. To use the admin review panel (see below), also set `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` — both server-only, never prefix them with `NEXT_PUBLIC_`.

3. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

4. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

## What's implemented

- **Home** (`/`) — map/list toggle, search by name/area, live geolocation ("me" marker + distance), carousel of spots over the map, "Spot a Vinayaka" FAB.
- **Spot detail** (bottom sheet on `/`) — photo, approved badge, description, landmark/submitter, mini map, share, "Open in Google Maps" (deep-links with the spot's coordinates).
- **Submit** (`/submit`) — optional photo upload (to Supabase Storage), name, location via GPS or a pasted Google Maps link (best-effort coordinate extraction), Area auto-filled from that location via free OpenStreetMap reverse geocoding (editable), optional description with a bold/italic/bullet-list toolbar. New spots are inserted as `pending`.
- **Menu sheet** — about text, how-it-works, share app, report an issue.
- **Admin review queue** (`/admin`) — password-gated, not linked from anywhere in the public app or listed in `robots.txt`. Lists submitted spots by status (Pending/Approved/Rejected), lets a moderator fill in/correct area and landmark, then Approve, Reject, move back to Pending, or permanently Delete. See below for how auth works.

## Admin review queue

Visit `/admin` and sign in with `ADMIN_PASSWORD`. There is deliberately no link to it anywhere in the app's UI — visitors can't stumble into it, and it's excluded from `robots.txt` — so bookmark the URL for whoever moderates.

**How auth works:** `POST /api/admin/login` checks the submitted password against `ADMIN_PASSWORD` (server-side only) and, on success, sets an `httpOnly` cookie containing an HMAC of a fixed string keyed by that password — never the password itself, so the cookie can't be used to recover it. Every `/api/admin/*` route re-derives and compares that HMAC before touching data. All reads/writes in the admin API use `lib/supabaseAdmin.js`, a Supabase client built with the **service-role key**, which bypasses RLS entirely — that key must stay server-only (`SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_` prefix) and is never sent to the browser.

This is one shared password for all moderators, which is simple to set up but means everyone shares one login and there's no per-person audit trail. If that stops being good enough, swap it for real Supabase Auth accounts with an admin-email allowlist — `requireAdmin()` in `lib/adminAuth.js` is the one place that decision is centralized.

## Deliberately out of scope (per the source chat)

The prototype's admin approve/reject queue was explicitly made unreachable from the visitor app in the original design session — it existed only as a reference screen with no entry point. The `/admin` panel above now implements it for real, but keeps that same spirit: no nav link, no `robots.txt` entry, password-gated.

## Notes on fidelity to the prototype

- The prototype's map was a hand-drawn SVG schematic sized to a fixed 390×620 preview frame. This build swaps it for a real Leaflet map over Chennai (OpenStreetMap tiles), keeping the same pin/marker styling and "me" pulse dot.
- The prototype's rich-text description field used `contentEditable` + `document.execCommand`, storing raw HTML. Since submissions are unauthenticated and public, this build uses a lightweight markdown-lite format instead (`**bold**`, `*italic*`, `- bullets`) parsed into React elements — same toolbar, same look, no HTML injection risk from user submissions.
- The outer "phone frame" from the design canvas (fixed 390×844 px shadow box) was the design tool's preview chrome, not part of the app — this build is a normal responsive mobile-first page (full-bleed on phones, a centered card on wider screens).
