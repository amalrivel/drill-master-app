export type WebAppResponse = {
  updatedAt?: string;
  rows: Record<string, any>[];
};

export async function fetchSheetRows(): Promise<WebAppResponse> {
  const url = process.env.GSHEET_WEBAPP_URL;
  if (!url) throw new Error("GSHEET_WEBAPP_URL is not set in env");

  const res = await fetch(url, {
    next: { revalidate: 60 }, // cache server 60 detik
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WebApp fetch failed: ${res.status} ${res.statusText} ${text}`);
  }

  return (await res.json()) as WebAppResponse;
}
