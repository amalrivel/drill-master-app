import type { JPToken } from "@/components/jp-token-text";

/**
 * Safe furigana parser:
 * - Prefer Kanji-run immediately before '(' to attach reading.
 * - Fallback to Japanese-letter run if no Kanji-run found.
 * - Uses indices slicing (no buffer cutting) so Kanji won't "disappear".
 * - Outputs JPToken ruby shape: { t:"ruby", base, rt }
 */
export function parseParenFurigana(input: string): JPToken[] {
  const s = String(input ?? "");
  const out: JPToken[] = [];

  const isKanji = (ch: string) => {
    const cp = ch.codePointAt(0) ?? 0;
    return (
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      ch === "々"
    );
  };

  const isKana = (ch: string) => {
    const cp = ch.codePointAt(0) ?? 0;
    return (
      (cp >= 0x3040 && cp <= 0x309f) ||
      (cp >= 0x30a0 && cp <= 0x30ff) ||
      ch === "ー"
    );
  };

  const isJapaneseLetter = (ch: string) => isKanji(ch) || isKana(ch);

  const looksLikeReading = (reading: string) => {
    const r = reading.trim();
    if (!r) return false;

    let ok = 0;
    let bad = 0;
    for (const ch of r) {
      if (isKana(ch)) ok++;
      else bad++;
    }
    return ok > 0 && bad <= Math.max(1, Math.floor(ok * 0.2));
  };

  const findKanjiRunStart = (end: number) => {
    let j = end - 1;
    if (j < 0) return null;
    if (!isKanji(s[j])) return null;
    while (j >= 0 && isKanji(s[j])) j--;
    return j + 1;
  };

  const findJapaneseRunStart = (end: number) => {
    let j = end - 1;
    if (j < 0) return null;
    if (!isJapaneseLetter(s[j])) return null;
    while (j >= 0 && isJapaneseLetter(s[j])) j--;
    return j + 1;
  };

  let cursor = 0;
  let lastEmit = 0;

  while (cursor < s.length) {
    const openParen = s.indexOf("(", cursor);
    const openFull = s.indexOf("（", cursor);

    let openIdx = -1;
    let openChar: "(" | "（" | null = null;

    if (openParen === -1) {
      openIdx = openFull;
      openChar = openFull === -1 ? null : "（";
    } else if (openFull === -1) {
      openIdx = openParen;
      openChar = "(";
    } else {
      if (openParen < openFull) {
        openIdx = openParen;
        openChar = "(";
      } else {
        openIdx = openFull;
        openChar = "（";
      }
    }

    if (openIdx === -1 || openChar == null) break;

    const closeChar = openChar === "(" ? ")" : "）";
    const closeIdx = s.indexOf(closeChar, openIdx + 1);
    if (closeIdx === -1) break;

    const readingRaw = s.slice(openIdx + 1, closeIdx);
    if (!looksLikeReading(readingRaw)) {
      cursor = openIdx + 1;
      continue;
    }

    const kanjiStart = findKanjiRunStart(openIdx);
    const runStart = kanjiStart ?? findJapaneseRunStart(openIdx);

    if (runStart == null || runStart < lastEmit) {
      cursor = closeIdx + 1;
      continue;
    }

    const base = s.slice(runStart, openIdx);
    if (!base) {
      cursor = closeIdx + 1;
      continue;
    }

    const plain = s.slice(lastEmit, runStart);
    if (plain) out.push({ t: "text", v: plain });

    out.push({
      t: "ruby",
      base,
      rt: readingRaw.trim(),
    });

    lastEmit = closeIdx + 1;
    cursor = closeIdx + 1;
  }

  const tail = s.slice(lastEmit);
  if (tail) out.push({ t: "text", v: tail });

  return out;
}
