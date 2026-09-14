import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // head:true skips returning rows entirely — Postgres still has to count
  // them, but nothing gets serialized back over the wire for a number we
  // only need the total of.
  const { count, error } = await getSupabaseAdmin()
    .from("page_views")
    .select("*", { count: "exact", head: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ pageViews: count ?? 0 });
}
