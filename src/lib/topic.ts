export function normalizeKey(raw?: string | null, fallback = "__untagged__"): string {
  if (raw == null) return fallback;

  let s = String(raw).trim();
  if (!s) return fallback;

  // '+' kadang mewakili spasi dalam query
  s = s.replace(/\+/g, " ");

  // decode kalau masih ada %xx
  try {
    if (/%[0-9A-Fa-f]{2}/.test(s)) s = decodeURIComponent(s);
  } catch {
    // ignore
  }

  // rapikan whitespace termasuk full-width space \u3000 dan NBSP \u00A0
  s = s.replace(/[\s\u00A0\u3000]+/g, " ").trim();

  return s || fallback;
}

export function normalizeTopic(raw?: string | null): string {
  return normalizeKey(raw, "__untagged_topic__");
}

export function normalizeSource(raw?: string | null): string {
  return normalizeKey(raw, "__untagged_source__");
}

export function topicLabel(raw?: string | null): string {
  const t = normalizeTopic(raw);
  return t === "__untagged_topic__" ? "No topic" : t;
}

export function sourceLabel(raw?: string | null): string {
  const s = normalizeSource(raw);
  return s === "__untagged_source__" ? "Unknown source" : s;
}
