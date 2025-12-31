"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function SyncQuestionsButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const onSync = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/questions/refresh", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "sync_failed");
      }

      setMsg(`Synced (${data.rowsCount} rows)`);
      // penting: refresh server components agar ambil data terbaru
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Sync failed");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 2500);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-xl border px-3 py-2 hover:bg-muted disabled:opacity-50"
        onClick={onSync}
        disabled={loading}
        type="button"
      >
        {loading ? "Syncing…" : "Sync"}
      </button>
      {msg ? <span className="text-xs text-muted-foreground">{msg}</span> : null}
    </div>
  );
}
