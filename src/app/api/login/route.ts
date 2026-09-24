import { cookies } from "next/headers";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.APP_PASSWORD;
  if (!expected) return Response.json({ ok: true });
  if (password !== expected) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return Response.json({ error: "Onjuist wachtwoord" }, { status: 401 });
  }
  (await cookies()).set(AUTH_COOKIE, await authToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return Response.json({ ok: true });
}
