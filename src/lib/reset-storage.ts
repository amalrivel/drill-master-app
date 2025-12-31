"use client";

/**
 * Hapus semua storage milik Drill Master.
 * Kita hapus:
 * - prefix "dm:" (format baru)
 * - beberapa prefix legacy yang mungkin pernah kamu pakai
 * - sessionStorage juga (kadang orang simpan progress di sini)
 */
const DM_PREFIXES = [
  "dm:",                 // format baru (yang kita target)
  "drillmaster:",        // kalau pernah dipakai
  "drill:",              // kalau pernah dipakai
  "stats:",              // legacy
  "stat:",               // legacy
  "drillSession:",       // legacy
  "drill_session:",      // legacy
  "session:",            // legacy
];

function shouldDeleteKey(key: string) {
  // Hapus yang jelas-jelas milik app
  if (DM_PREFIXES.some((p) => key.startsWith(p))) return true;

  // Hapus pola yang mengandung "drill" / "session" / "stat" (legacy liar)
  // supaya format lama ikut kehapus walau prefix-nya beda.
  const k = key.toLowerCase();
  if (k.includes("drill") && (k.includes("session") || k.includes("progress") || k.includes("queue")))
    return true;
  if (k.includes("stat") && (k.includes("question") || k.includes("item") || k.includes("result")))
    return true;

  return false;
}

export function resetAllDrillMasterStorage(): { removed: string[] } {
  const removed: string[] = [];

  // localStorage
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (shouldDeleteKey(k)) {
      localStorage.removeItem(k);
      removed.push(`local:${k}`);
    }
  }

  // sessionStorage (optional tapi membantu)
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i);
    if (!k) continue;
    if (shouldDeleteKey(k)) {
      sessionStorage.removeItem(k);
      removed.push(`session:${k}`);
    }
  }

  return { removed };
}
