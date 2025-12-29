import { getJson, setJson } from "@/lib/storage";

export type ItemStat = {
  correct: number;
  wrong: number;
  lastAt: number; // epoch ms
};

export type StatsStore = Record<string, ItemStat>;

const STATS_KEY = "drillmaster:stats:v1";

export function loadStats(): StatsStore {
  return getJson<StatsStore>(STATS_KEY) ?? {};
}

export function saveStats(stats: StatsStore): void {
  setJson(STATS_KEY, stats);
}

export function bumpItemStat(stats: StatsStore, itemId: string, ok: boolean, now = Date.now()): StatsStore {
  const prev = stats[itemId] ?? { correct: 0, wrong: 0, lastAt: 0 };
  const next: ItemStat = {
    correct: prev.correct + (ok ? 1 : 0),
    wrong: prev.wrong + (ok ? 0 : 1),
    lastAt: now,
  };
  return { ...stats, [itemId]: next };
}
