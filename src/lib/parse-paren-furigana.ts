import type { JPToken } from "@/components/jp-token-text";

// Hiragana + Katakana + "ー"
const KANA_RE = /^[\u3040-\u309F\u30A0-\u30FFー]+$/;

// Match: sesuatu sebelum "(" + (reading)
const FURI_RE = /([^\(\)]+?)([\s\u3000]*)\(([^\(\)]+?)\)/g;

// Separator untuk memotong "kata terakhir"
const SEPARATORS_RE =
  /[\s\u3000、。．，・！!？?「」『』【】［］〔〕（）\(\)｛｝{}〈〉《》“”"':：；;…‥]/;

export function parseParenFurigana(input: string): JPToken[] {
  const s = String(input ?? "");
  const tokens: JPToken[] = [];
  let lastIndex = 0;

  for (const m of s.matchAll(FURI_RE)) {
    const full = m[0];
    const baseRaw = m[1];      // bisa "では、車"
    const spaces = m[2] ?? ""; // spasi sebelum "("
    const rt = m[3];           // reading
    const start = m.index ?? 0;

    // kalau reading bukan kana -> anggap bukan furigana
    if (!KANA_RE.test(rt)) continue;

    // text sebelum match
    if (start > lastIndex) {
      tokens.push({ t: "text", v: s.slice(lastIndex, start) });
    }

    // Ambil kata terakhir dari baseRaw sebagai base; sisanya prefix text
    const { prefix, base } = splitTrailingWord(baseRaw);

    if (prefix) tokens.push({ t: "text", v: prefix });
    tokens.push({ t: "ruby", base, rt });

    // pertahankan spasi sebelum "(" (kalau ada)
    if (spaces) tokens.push({ t: "text", v: spaces });

    lastIndex = start + full.length;
  }

  // sisa text
  if (lastIndex < s.length) {
    tokens.push({ t: "text", v: s.slice(lastIndex) });
  }

  return mergeTextTokens(tokens);
}

function splitTrailingWord(baseRaw: string): { prefix: string; base: string } {
  let i = baseRaw.length - 1;

  // skip separators di ujung
  while (i >= 0 && SEPARATORS_RE.test(baseRaw[i])) i--;

  // ambil kata terakhir (run karakter non-separator)
  const end = i;
  while (i >= 0 && !SEPARATORS_RE.test(baseRaw[i])) i--;

  const prefix = baseRaw.slice(0, i + 1);
  const base = baseRaw.slice(i + 1, end + 1);

  return { prefix, base };
}

function mergeTextTokens(tokens: JPToken[]): JPToken[] {
  const out: JPToken[] = [];
  for (const t of tokens) {
    const prev = out[out.length - 1];
    if (t.t === "text" && prev?.t === "text") prev.v += t.v;
    else out.push({ ...t });
  }
  return out;
}
