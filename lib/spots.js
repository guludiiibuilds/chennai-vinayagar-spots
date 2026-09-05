import { supabase, PHOTO_BUCKET } from "./supabaseClient";

export async function fetchApprovedSpots() {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSpotById(id) {
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadSpotPhoto(file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function submitSpot(payload) {
  const { data, error } = await supabase
    .from("spots")
    .insert({
      name: payload.name,
      area: payload.area || "Awaiting area check",
      theme: payload.theme || "Unclassified",
      landmark: payload.landmark || "",
      about: payload.about || "",
      submitted_by: payload.submittedBy || "Anon",
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      maps_link: payload.mapsLink || null,
      photo_url: payload.photoUrl || null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
