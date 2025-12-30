import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";

const COOKIE_NAME = "dm_session";

export async function getAuthedEmail(): Promise<string | null> {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return decoded.email ?? null;
  } catch {
    return null;
  }
}

export async function requireAuthedEmail(): Promise<string> {
  const email = await getAuthedEmail();
  const allowed = process.env.ALLOWED_EMAIL ?? "";
  if (!email || (allowed && email !== allowed)) {
    redirect("/login"); // Next redirect server-side :contentReference[oaicite:3]{index=3}
  }
  return email;
}
