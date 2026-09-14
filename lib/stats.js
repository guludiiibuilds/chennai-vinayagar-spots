import { supabase } from "./supabaseClient";

// Fire-and-forget: a failed insert (offline, RLS misconfigured, table not
// yet migrated) should never affect the page itself, so errors are
// swallowed rather than surfaced anywhere.
export function logPageView() {
  supabase
    .from("page_views")
    .insert({})
    .then(() => {})
    .catch(() => {});
}
