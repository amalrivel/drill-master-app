// src/lib/gsheet-api.ts
import "server-only";

type SheetResponse = { ok?: boolean; rows?: any[]; error?: string };

const SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN!;

let cache: { at: number; rows: any[] } | null = null;
const TTL_MS = 10 * 60 * 1000; // 10 menit

export function invalidateSheetCache() {
  cache = null;
}

export async function fetchSheetRows(opts?: { force?: boolean }): Promise<{ rows: any[] }> {
  const force = Boolean(opts?.force);

  if (!SCRIPT_URL) throw new Error("Missing APPS_SCRIPT_URL");
  if (!SCRIPT_TOKEN) throw new Error("Missing APPS_SCRIPT_TOKEN");

  const now = Date.now();
  if (!force && cache && now - cache.at < TTL_MS) {
    return { rows: cache.rows };
  }

  const url = new URL(SCRIPT_URL);
  url.searchParams.set("token", SCRIPT_TOKEN);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Apps Script HTTP ${res.status}`);

  const data = (await res.json()) as SheetResponse;
  if (data?.ok === false) {
    throw new Error(`Apps Script rejected request: ${data.error ?? "unknown"}`);
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  cache = { at: now, rows };

  return { rows };
}
