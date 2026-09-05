# Chennai Vinayagar Spots

A mobile-first web app for discovering and contributing Vinayagar Chaturthi pandal locations across Chennai. No login required to browse or submit. Built with Next.js (App Router), Supabase (data + photo storage), and Leaflet/OpenStreetMap for the map.

Implements the design in `../Chennai Vinayagar Spots.dc.html` (see `../README.md` and `../chats/chat1.md` for the original design brief).

## Stack

- **Next.js 16** (App Router, JS)
- **Supabase** — Postgres table for spots + Storage bucket for photos, accessed client-side with the publishable/anon key
- **Leaflet + OpenStreetMap** — free, open-source map tiles, no API key

## Setup

1. **Apply the database schema.** Open the SQL editor for your Supabase project and run `supabase/schema.sql`. It creates the `spots` table, row-level security policies (public can read approved spots and submit pending ones; nothing can approve/reject without a service-role key), a public `spot-photos` storage bucket, and seeds the 10 spots from the original prototype as `approved` so the map isn't empty on first run.

2. **Environment variables.** `.env.local` is already populated with the project URL and publishable key that were provided. If you're pointing at a different Supabase project, copy `.env.example` to `.env.local` and fill in your own values.

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

- **Home** (`/`) — map/list toggle, search by name/area/theme, live geolocation ("me" marker + distance), carousel of spots over the map, "Spot a Vinayagar" FAB.
- **Spot detail** (`/spot/[id]`) — photo, theme/approved badges, description, landmark/submitter, mini map, share, "Open in Google Maps" (deep-links with the spot's coordinates).
- **Submit** (`/submit`) — photo upload (to Supabase Storage), name, location via GPS or a pasted Google Maps link (best-effort coordinate extraction), optional description with a bold/italic/bullet-list toolbar, submit disabled until photo + name + location are present. New spots are inserted as `pending`.
- **Menu sheet** — about text, how-it-works, share app, report an issue.

## Deliberately out of scope (per the source chat)

The prototype's admin approve/reject queue was explicitly made unreachable from the visitor app in the original design session — it exists only as a reference screen with no entry point. This build carries that forward: **there is no admin UI**. Submitted spots land in the `spots` table with `status = 'pending'` and need to be flipped to `'approved'` directly in Supabase (SQL editor or table view) until a moderation tool is built. The RLS policies only allow public insert of pending rows and public read of approved ones — nothing else — so this is safe to leave as-is.

## Notes on fidelity to the prototype

- The prototype's map was a hand-drawn SVG schematic sized to a fixed 390×620 preview frame. This build swaps it for a real Leaflet map over Chennai (OpenStreetMap tiles), keeping the same pin/marker styling and "me" pulse dot.
- The prototype's rich-text description field used `contentEditable` + `document.execCommand`, storing raw HTML. Since submissions are unauthenticated and public, this build uses a lightweight markdown-lite format instead (`**bold**`, `*italic*`, `- bullets`) parsed into React elements — same toolbar, same look, no HTML injection risk from user submissions.
- The outer "phone frame" from the design canvas (fixed 390×844 px shadow box) was the design tool's preview chrome, not part of the app — this build is a normal responsive mobile-first page (full-bleed on phones, a centered card on wider screens).
