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

export function googleMapsUrl(spot) {
  if (spot.lat != null && spot.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
  }
  return spot.maps_link || "https://maps.google.com";
}
