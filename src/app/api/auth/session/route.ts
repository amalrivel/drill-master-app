import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const COOKIE_NAME = "dm_session";
const EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export async function POST(req: Request) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ ok: false, error: "missing_idToken" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email ?? "";
    const allowed = process.env.ALLOWED_EMAIL ?? "";

    if (!allowed) {
      return NextResponse.json({ ok: false, error: "missing_ALLOWED_EMAIL" }, { status: 500 });
    }
    if (email !== allowed) {
      return NextResponse.json({ ok: false, error: "not_allowed" }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(EXPIRES_IN_MS / 1000),
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}
