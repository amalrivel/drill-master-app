// src/app/(app)/api/questions/refresh/route.ts
import { NextResponse } from "next/server";
import { requireAuthedEmail } from "@/lib/auth";
import { invalidateSheetCache, fetchSheetRows } from "@/lib/gsheet-api";

export async function POST() {
  try {
    await requireAuthedEmail();

    // clear cache local instance
    invalidateSheetCache();

    // force fetch now (so next page render pasti terbaru)
    const { rows } = await fetchSheetRows({ force: true });

    return NextResponse.json({
      ok: true,
      rowsCount: rows.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    const msg = e?.message ?? "Unknown error";
    if (msg.includes("NEXT_REDIRECT")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
