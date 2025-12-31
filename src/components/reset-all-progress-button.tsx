"use client";

import * as React from "react";
import { resetAllDrillMasterStorage } from "@/lib/reset-storage";

export function ResetAllProgressButton() {
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const onReset = async () => {
    const ok = window.confirm(
      "Reset SEMUA progress?\n\nIni akan menghapus:\n- progress drill (semua topic/source/section/test)\n- statistik per soal\n- data latihan tersimpan lainnya\n\nData di Google Sheet tidak berubah."
    );
    if (!ok) return;

    setLoading(true);
    setMsg(null);

    try {
      const { removed } = resetAllDrillMasterStorage();
      setMsg(`Reset done (${removed.length} keys)`);

      // HARD reload agar state client benar-benar fresh
      window.location.href = "/practice?reset=" + Date.now();
    } catch (e: any) {
      setMsg(e?.message ?? "Reset failed");
      setLoading(false);
      setTimeout(() => setMsg(null), 3000);
      return;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onReset}
        disabled={loading}
        className="rounded-xl border px-3 py-2 hover:bg-muted disabled:opacity-50"
      >
        {loading ? "Resetting…" : "Reset Semua"}
      </button>
      {msg ? <span className="text-xs text-muted-foreground">{msg}</span> : null}
    </div>
  );
}
