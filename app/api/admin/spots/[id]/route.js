import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const EDITABLE_FIELDS = ["name", "area", "landmark", "about", "maps_link"];
const ACTIONS = {
  approve: { status: "approved", stampApprovedAt: true },
  reject: { status: "rejected" },
  pending: { status: "pending" },
};

export async function PATCH(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const update = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
  }
  if ("lat" in body) update.lat = body.lat === "" || body.lat == null ? null : Number(body.lat);
  if ("lng" in body) update.lng = body.lng === "" || body.lng == null ? null : Number(body.lng);

  if (body.action) {
    const action = ACTIONS[body.action];
    if (!action) return Response.json({ error: "Invalid action" }, { status: 400 });
    update.status = action.status;
    if (action.stampApprovedAt) update.approved_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin().from("spots").update(update).eq("id", id).select().maybeSingle();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Spot not found" }, { status: 404 });
  return Response.json({ spot: data });
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("spots").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
