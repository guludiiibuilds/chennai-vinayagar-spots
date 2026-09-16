import { requireAdmin } from "@/lib/adminAuth";
import { isShortGoogleMapsLink } from "@/lib/googleMapsLink";

// maps.app.goo.gl / goo.gl/maps links redirect server-side (like any link
// shortener) to the full maps.google.com URL that actually encodes
// coordinates — a browser can't follow that cross-origin redirect itself
// (CORS), so this route does it on the server and hands back where it
// landed for the client to parse.
export async function POST(request) {
  if (!(await requireAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!isShortGoogleMapsLink(url)) {
    return Response.json({ error: "Not a Google Maps share link" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { redirect: "follow" });
    return Response.json({ resolvedUrl: res.url });
  } catch {
    return Response.json({ error: "Couldn't reach that link" }, { status: 502 });
  }
}
