// Google Maps encodes a pinned location a few different ways depending on
// how the link was generated. A "place" link's data= blob carries the
// exact pinned point as !3d<lat>!4d<lng>, which is more accurate than the
// @lat,lng in the URL path — that one is just wherever the map was
// centered when the link was made, which can be off by a street or two.
const PLACE_PATTERN = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
const AT_PATTERN = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
const QUERY_PATTERN = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
const PLAIN_PATTERN = /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/;

export function extractLatLng(text) {
  if (!text) return null;
  const plain = PLAIN_PATTERN.exec(text);
  if (plain) return { lat: Number(plain[1]), lng: Number(plain[2]) };
  const place = PLACE_PATTERN.exec(text);
  if (place) return { lat: Number(place[1]), lng: Number(place[2]) };
  const at = AT_PATTERN.exec(text);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const query = QUERY_PATTERN.exec(text);
  if (query) return { lat: Number(query[1]), lng: Number(query[2]) };
  return null;
}

// The Maps app's "Share" button produces one of these short links instead
// of a full URL — they redirect (server-side, like any link shortener) to
// the full maps.google.com URL that actually encodes the coordinates, so
// they can't be parsed directly and need a request to resolve first.
export function isShortGoogleMapsLink(text) {
  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test((text || "").trim());
}

export function looksLikeGoogleMapsLink(text) {
  return /^https?:\/\//i.test((text || "").trim());
}
