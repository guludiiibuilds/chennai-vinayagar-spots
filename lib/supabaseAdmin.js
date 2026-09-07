import { createClient } from "@supabase/supabase-js";

// Server-only. This uses the Supabase service-role key, which bypasses row
// level security entirely — never import this from a "use client" component
// or send its key to the browser. Only route handlers under app/api/admin
// should touch this file.

// Built lazily (not at module load) so a build/deploy without
// SUPABASE_SERVICE_ROLE_KEY set doesn't fail collecting route data for
// every admin API route — createClient throws immediately on an empty key.
let client;

export function getSupabaseAdmin() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin env vars are missing — set SUPABASE_SERVICE_ROLE_KEY (server-only, no NEXT_PUBLIC_ prefix) in your deployment environment"
    );
  }
  client = createClient(url, serviceKey, { auth: { persistSession: false } });
  return client;
}
