"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { clearDrillSession } from "@/lib/drill-session-storage";

type Props = {
  topicKey: string;               // string topic yang dipakai drill
  onAfterReset?: () => void;      // optional: reset state di DrillSession langsung
};

export function ResetDrillButton({ topicKey, onAfterReset }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const onReset = async () => {
    const ok = window.confirm(
      "Reset progress drill ini?\n\nProgress sesi akan dihapus dan kamu akan mulai dari soal pertama.\nStatistik per soal (history benar/salah) tidak dihapus."
    );
    if (!ok) return;

    setLoading(true);
    try {
      clearDrillSession(topicKey);

      // Kalau DrillSession punya state internal, biar langsung reset tanpa reload:
      onAfterReset?.();

      // Pastikan UI “fresh”
      // router.refresh() kadang tidak mereset state client component,
      // jadi kita pakai replace current url agar betul-betul restart.
      router.replace(window.location.pathname + window.location.search);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onReset}
      disabled={loading}
      className="rounded-xl border px-3 py-2 hover:bg-muted disabled:opacity-50"
      title="Reset progress sesi drill"
    >
      {loading ? "Resetting…" : "Reset"}
    </button>
  );
}
