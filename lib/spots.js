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
  // Deliberately no .select() here: the public insert policy only allows
  // status:"pending" rows, and the public select policy only allows
  // status:"approved" rows. Asking Postgres to return the just-inserted
  // row runs it through the select policy too, which the new pending row
  // never passes — Supabase reports that as "new row violates row-level
  // security policy" even though the insert itself succeeded. We already
  // know what we submitted, so there's nothing to read back.
  const { error } = await supabase.from("spots").insert({
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
  });
  if (error) throw error;
  return { name: payload.name };
}
