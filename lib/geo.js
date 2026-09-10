// Haversine distance in kilometres between two lat/lng points.
export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
    return null;
  }
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function formatDistance(km) {
  if (km == null) return null;
  return km < 10 ? km.toFixed(1) : Math.round(km).toString();
}

// Two pandals can legitimately sit within a few dozen metres of each other
// on the same street, so callers should only ever warn on this — never
// block a submission outright.
export const DUPLICATE_RADIUS_KM = 0.1;

// Finds the closest of `spots` to `point`, annotated with its distance —
// used to flag a likely-duplicate submission before it's sent for review.
export function findNearestSpot(point, spots) {
  if (!point) return null;
  let nearest = null;
  for (const s of spots) {
    if (s.lat == null || s.lng == null) continue;
    const distKm = distanceKm(point, { lat: s.lat, lng: s.lng });
    if (distKm != null && (!nearest || distKm < nearest.distKm)) nearest = { ...s, distKm };
  }
  return nearest;
}

// Best-effort extraction of a lat/lng pair from a pasted Google Maps link,
// e.g. ".../@13.0335,80.2698,17z" or "?q=13.0335,80.2698". Shortened
// maps.app.goo.gl links can't be resolved client-side, so this returns
// null for those — the maps_link itself still works for "Open in Maps".
export function extractLatLngFromMapsLink(link) {
  if (!link) return null;
  const at = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
  const q = link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
  return null;
}

// Free reverse geocoding via OpenStreetMap's Nominatim service — the same
// data source the map tiles already come from, no API key needed. Used to
// prefill the submit form's Area field from captured coordinates so
// submitters (and reviewers) don't have to type the neighbourhood by hand.
// Returns null on any failure — callers should treat that as "couldn't
// determine it," not an error worth surfacing.
export async function reverseGeocodeArea(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    return a.suburb || a.neighbourhood || a.quarter || a.city_district || a.town || a.village || a.locality || null;
  } catch {
    return null;
  }
}

export function googleMapsUrl(spot) {
  if (spot.lat != null && spot.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
  }
  return spot.maps_link || "https://maps.google.com";
}
