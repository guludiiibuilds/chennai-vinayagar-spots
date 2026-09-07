import { cookies } from "next/headers";
import { checkPassword, sessionToken, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/adminAuth";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (!checkPassword(body.password || "")) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return Response.json({ ok: true });
}
