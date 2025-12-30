import "server-only";

import type { JPToken } from "@/components/jp-token-text";
import { parseParenFurigana } from "@/lib/parse-paren-furigana";
import { fetchSheetRows } from "@/lib/gsheet-api";

export type TFItem = {
  id: string;
  statement: JPToken[];
  correct: boolean; // 〇=true, ✕=false

  explanation?: JPToken[]; // ✅ sekarang per item
  ref?: string;           // ✅ sekarang per item
};

export type TFQuestion =
  | {
      type: "tf_single";
      id: string;

      source?: string;
      topic?: string;
      section?: string;
      testNo?: number;

      prompt?: JPToken[];
      imageUrl?: string | null;

      item: TFItem;
      active: boolean;
    }
  | {
      type: "tf_illustration";
      id: string;

      source?: string;
      topic?: string;
      section?: string;
      testNo?: number;

      prompt: JPToken[];
      imageUrl?: string | null;

      items: TFItem[];
      active: boolean;
    };

function cleanStr(v: any): string {
  return String(v ?? "").trim();
}

function toActive(v: any): boolean {
  if (typeof v === "boolean") return v;
  const s = cleanStr(v).toLowerCase();
  if (!s) return true;
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return true;
}

function toNumberOrUndef(v: any): number | undefined {
  const s = cleanStr(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

// ✅ support variasi maru/batsu Jepang
function toBoolMaruBatsu(v: any): boolean {
  const raw = String(v ?? "").trim();

  // Maru: ○, 〇, ◯, O
  if (raw === "○" || raw === "〇" || raw === "◯" || raw.toLowerCase() === "o") return true;

  // Batsu: ×, ✕, ✖, X
  if (raw === "×" || raw === "✕" || raw === "✖" || raw.toLowerCase() === "x") return false;

  // fallback boolean-ish
  const s = raw.toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;

  return false;
}

function parseMaybeFurigana(raw: string): JPToken[] | undefined {
  const s = cleanStr(raw);
  if (!s) return undefined;
  return parseParenFurigana(s);
}

function pickItems(row: Record<string, any>, baseId: string): TFItem[] {
  const items: TFItem[] = [];

  // fallback lama (kalau kamu masih punya field explanation/ref global)
  const legacyExplanation = cleanStr(row.explanation);
  const legacyRef = cleanStr(row.ref) || undefined;

  for (let i = 1; i <= 5; i++) {
    const sRaw = cleanStr(row[`s${i}_raw`]);
    if (!sRaw) continue;

    const correct = toBoolMaruBatsu(row[`s${i}_correct`]);

    const sExpRaw = cleanStr(row[`s${i}_explanation`]);
    const sRefRaw = cleanStr(row[`s${i}_ref`]);

    const explanation =
      parseMaybeFurigana(sExpRaw) ||
      (i === 1 ? parseMaybeFurigana(legacyExplanation) : undefined);

    const ref =
      (sRefRaw || undefined) ||
      (i === 1 ? legacyRef : undefined);

    items.push({
      id: `${baseId}-${i}`,
      statement: parseParenFurigana(sRaw),
      correct,
      explanation,
      ref,
    });
  }

  return items;
}

export async function getQuestions(): Promise<TFQuestion[]> {
  const { rows } = await fetchSheetRows();
  const out: TFQuestion[] = [];

  for (const row of rows ?? []) {
    const id = cleanStr(row.id);
    if (!id) continue;

    const active = toActive(row.active);
    if (!active) continue;

    const typeRaw = cleanStr(row.type || row.kind);
    const type = (typeRaw || "tf_single") as "tf_single" | "tf_illustration";

    const source = cleanStr(row.source) || undefined;
    const topic = cleanStr(row.topic) || undefined; // boleh kosong
    const section = cleanStr(row.section) || undefined;
    const testNo = toNumberOrUndef(row.test_no);

    const promptRaw = cleanStr(row.prompt_raw);
    const imageUrl = cleanStr(row.image_url) || null;

    const items = pickItems(row, id);
    if (items.length === 0) continue;

    if (type === "tf_illustration") {
      if (!promptRaw) continue;

      out.push({
        type: "tf_illustration",
        id,
        source,
        topic,
        section,
        testNo,
        prompt: parseParenFurigana(promptRaw),
        imageUrl,
        items,
        active: true,
      });
    } else {
      out.push({
        type: "tf_single",
        id,
        source,
        topic,
        section,
        testNo,
        prompt: promptRaw ? parseParenFurigana(promptRaw) : undefined,
        imageUrl,
        item: items[0],
        active: true,
      });
    }
  }

  return out;
}
