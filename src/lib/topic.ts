/**
 * Normalisasi string topic agar:
 * - aman untuk dibandingkan (whitespace konsisten)
 * - tidak bermasalah kalau query masih berisi %20 atau '+'.
 * - full-width spaces (\u3000) disamakan jadi spasi normal.
 */
export function normalizeTopic(raw?: string | null): string {
  if (raw == null) return "__untagged__";

  let s = String(raw).trim();
  if (!s) return "__untagged__";

  // Kadang query param bisa berisi "+" untuk spasi
  s = s.replace(/\+/g, " ");

  // Kadang masih berisi %xx (mis. %20)
  // Jika sudah decoded, decodeURIComponent tidak merusak (kita try/catch)
  try {
    // hanya decode kalau memang ada pattern %xx agar tidak bikin error aneh
    if (/%[0-9A-Fa-f]{2}/.test(s)) {
      s = decodeURIComponent(s);
    }
  } catch {
    // ignore
  }

  // Rapikan whitespace: spasi biasa + full-width space jadi satu spasi
  s = s.replace(/[\s\u00A0\u3000]+/g, " ").trim();

  return s || "__untagged__";
}

/**
 * Label untuk ditampilkan ke user.
 * Saat ini sama dengan normalizeTopic, tapi dipisah supaya
 * kalau nanti kamu mau tampilkan versi asli, gampang.
 */
export function topicLabel(raw?: string | null): string {
  const t = normalizeTopic(raw);
  return t === "__untagged__" ? "Uncategorized" : t;
}
