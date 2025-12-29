import type { JPToken } from "@/components/jp-token-text";
import { parseParenFurigana } from "@/lib/parse-paren-furigana";
import { fetchSheetRows } from "@/lib/gsheet-api";

export type TFItem = {
  id: string;
  statement: JPToken[];
  correct: boolean; // 〇=true, ✕=false
};

export type TFQuestion =
  | {
      type: "tf_single";
      id: string;
      topic?: string;
      prompt?: JPToken[];
      imageUrl?: string | null;
      item: TFItem;

      explanation?: JPToken[]; // ✅ baru
      ref?: string;           // ✅ baru

      active: boolean;
    }
  | {
      type: "tf_illustration";
      id: string;
      topic?: string;
      prompt: JPToken[];
      imageUrl?: string | null;
      items: TFItem[];

      explanation?: JPToken[]; // ✅ baru
      ref?: string;            // ✅ baru

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

// ✅ support variasi maru/batsu Jepang
function toBoolMaruBatsu(v: any): boolean {
  const raw = String(v ?? "").trim();

  // Maru: ○, 〇, ◯, O
  if (raw === "○" || raw === "〇" || raw === "◯" || raw.toLowerCase() === "o") {
    return true;
  }

  // Batsu: ×, ✕, ✖, X
  if (raw === "×" || raw === "✕" || raw === "✖" || raw.toLowerCase() === "x") {
    return false;
  }

  // fallback boolean-ish
  const s = raw.toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;

  return false;
}

function pickItems(row: Record<string, any>, baseId: string): TFItem[] {
  const items: TFItem[] = [];
  for (let i = 1; i <= 5; i++) {
    const raw = cleanStr(row[`s${i}_raw`]);
    if (!raw) continue;

    items.push({
      id: `${baseId}-${i}`,
      statement: parseParenFurigana(raw),
      correct: toBoolMaruBatsu(row[`s${i}_correct`]),
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

    // dari sheet: type = tf_single / tf_illustration
    // fallback: kind (kalau masih ada sisa)
    const typeRaw = cleanStr(row.type || row.kind);
    const type = (typeRaw || "tf_single") as "tf_single" | "tf_illustration";

    const topic = cleanStr(row.topic) || undefined;
    const promptRaw = cleanStr(row.prompt_raw);
    const imageUrl = cleanStr(row.image_url) || null;

    // ✅ baru
    const explanationRaw = cleanStr(row.explanation);
    const explanation = explanationRaw ? parseParenFurigana(explanationRaw) : undefined;

    const ref = cleanStr(row.ref) || undefined;

    const items = pickItems(row, id);
    if (items.length === 0) continue;

    if (type === "tf_illustration") {
      if (!promptRaw) continue;

      out.push({
        type: "tf_illustration",
        id,
        topic,
        prompt: parseParenFurigana(promptRaw),
        imageUrl,
        items,
        explanation,
        ref,
        active: true,
      });
    } else {
      out.push({
        type: "tf_single",
        id,
        topic,
        prompt: promptRaw ? parseParenFurigana(promptRaw) : undefined,
        imageUrl,
        item: items[0],
        explanation,
        ref,
        active: true,
      });
    }
  }

  return out;
}
