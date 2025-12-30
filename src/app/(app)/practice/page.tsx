import Link from "next/link";
import { getQuestions } from "@/lib/questions";
import { normalizeSource, normalizeTopic, sourceLabel, topicLabel } from "@/lib/topic";

type Bucket = {
  sourceKey: string;
  sourceName: string;
  topics: {
    topicKey: string;
    topicName: string;
    setsCount: number;
    itemsCount: number;
  }[];
  setsCount: number;
  itemsCount: number;
};

export default async function PracticePage() {
  const questions = await getQuestions();

  // sourceKey -> topicKey -> counts
  const sourceMap = new Map<
    string,
    {
      sourceName: string;
      topicMap: Map<string, { topicName: string; setsCount: number; itemsCount: number }>;
      setsCount: number;
      itemsCount: number;
    }
  >();

  for (const q of questions) {
    const sKey = normalizeSource(q.source ?? null);
    const sName = sourceLabel(q.source ?? null);

    const tKey = normalizeTopic(q.topic ?? null);
    const tName = topicLabel(q.topic ?? null);

    const itemsCount = q.type === "tf_single" ? 1 : q.items.length;

    let s = sourceMap.get(sKey);
    if (!s) {
      s = { sourceName: sName, topicMap: new Map(), setsCount: 0, itemsCount: 0 };
      sourceMap.set(sKey, s);
    }

    s.setsCount += 1;
    s.itemsCount += itemsCount;

    const curT = s.topicMap.get(tKey);
    if (!curT) {
      s.topicMap.set(tKey, { topicName: tName, setsCount: 1, itemsCount });
    } else {
      curT.setsCount += 1;
      curT.itemsCount += itemsCount;
    }
  }

  const buckets: Bucket[] = Array.from(sourceMap.entries())
    .map(([sourceKey, s]) => {
      const topics = Array.from(s.topicMap.entries())
        .map(([topicKey, t]) => ({
          topicKey,
          topicName: t.topicName,
          setsCount: t.setsCount,
          itemsCount: t.itemsCount,
        }))
        .sort((a, b) => a.topicName.localeCompare(b.topicName));

      return {
        sourceKey,
        sourceName: s.sourceName,
        topics,
        setsCount: s.setsCount,
        itemsCount: s.itemsCount,
      };
    })
    .sort((a, b) => a.sourceName.localeCompare(b.sourceName));

  const totalSets = buckets.reduce((sum, b) => sum + b.setsCount, 0);
  const totalItems = buckets.reduce((sum, b) => sum + b.itemsCount, 0);

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Practice</h1>
        <p className="text-sm text-muted-foreground">
          Pilih source dan (opsional) topic untuk mulai latihan ○/✕.
        </p>
      </header>

      {/* start all */}
      <div className="rounded-2xl border p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">All sources</div>
          <div className="text-sm text-muted-foreground">
            {totalSets} set • {totalItems} pernyataan
          </div>
        </div>
        <Link className="inline-flex items-center rounded-xl border px-4 py-2 hover:bg-muted" href="/drill">
          Start
        </Link>
      </div>

      <div className="space-y-4">
        {buckets.map((b) => (
          <div key={b.sourceKey} className="rounded-2xl border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-lg font-semibold">{b.sourceName}</div>
                <div className="text-sm text-muted-foreground">
                  {b.setsCount} set • {b.itemsCount} pernyataan
                </div>
              </div>

              {/* start all in this source */}
              <Link
                className="shrink-0 inline-flex items-center rounded-xl border px-4 py-2 hover:bg-muted"
                href={`/drill?source=${encodeURIComponent(b.sourceKey)}`}
              >
                Start
              </Link>
            </div>

            {/* topics under source */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {b.topics.map((t) => (
                <Link
                  key={t.topicKey}
                  className="rounded-xl border p-3 hover:bg-muted/40"
                  href={`/drill?source=${encodeURIComponent(b.sourceKey)}&topic=${encodeURIComponent(t.topicKey)}`}
                >
                  <div className="font-medium">{t.topicName}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.setsCount} set • {t.itemsCount} pernyataan
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
