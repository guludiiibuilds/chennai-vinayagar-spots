import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const STATUSES = ["pending", "approved", "rejected"];

export async function GET(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") || "pending";
  if (!STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("spots")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ spots: data });
}

// Admin-added spots skip the review queue entirely — they're created
// already approved, since the whole point is a trusted person adding a
// spot directly instead of going through public submit-then-approve.
export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const lat = Number.isFinite(body.lat) ? body.lat : null;
  const lng = Number.isFinite(body.lng) ? body.lng : null;
  const mapsLink = typeof body.maps_link === "string" ? body.maps_link.trim() : "";
  if (lat == null || lng == null) {
    if (!mapsLink) {
      return Response.json({ error: "Add a location first" }, { status: 400 });
    }
  }

  const { data, error } = await getSupabaseAdmin()
    .from("spots")
    .insert({
      name,
      area: typeof body.area === "string" ? body.area.trim() : "",
      about: typeof body.about === "string" ? body.about.trim() : "",
      submitted_by: "Admin",
      lat,
      lng,
      maps_link: mapsLink || null,
      photo_url: typeof body.photo_url === "string" && body.photo_url ? body.photo_url : null,
      is_popular: !!body.is_popular,
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ spot: data });
}
