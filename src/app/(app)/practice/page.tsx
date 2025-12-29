import Link from "next/link";
import { getQuestions } from "@/lib/questions";
import { normalizeTopic, topicLabel } from "@/lib/topic";

type TopicInfo = {
  topicKey: string;   // hasil normalizeTopic
  label: string;      // teks tampil
  setsCount: number;  // jumlah set (row)
  itemsCount: number; // jumlah pernyataan
};

export default async function PracticePage() {
  const questions = await getQuestions();

  const map = new Map<string, TopicInfo>();

  for (const q of questions) {
    // topicKey dipakai untuk grouping & compare
    const key = normalizeTopic(q.topic ?? null);
    const label = topicLabel(q.topic ?? null);

    const itemsCount = q.type === "tf_single" ? 1 : q.items.length;

    const cur = map.get(key);
    if (!cur) {
      map.set(key, { topicKey: key, label, setsCount: 1, itemsCount });
    } else {
      cur.setsCount += 1;
      cur.itemsCount += itemsCount;
    }
  }

  const topics = Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  const totalSets = topics.reduce((s, t) => s + t.setsCount, 0);
  const totalItems = topics.reduce((s, t) => s + t.itemsCount, 0);

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Practice</h1>
        <p className="text-sm text-muted-foreground">
          Pilih topik untuk mulai latihan ○/×.
        </p>
      </header>

      <div className="rounded-2xl border p-4 flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">All topics</div>
          <div className="text-sm text-muted-foreground">
            {totalSets} set • {totalItems} pernyataan
          </div>
        </div>
        <Link
          className="inline-flex items-center rounded-xl border px-4 py-2 hover:bg-muted"
          href="/drill"
        >
          Start
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((t) => (
          <div key={t.topicKey} className="rounded-2xl border p-4 space-y-3">
            <div className="space-y-1">
              <div className="font-medium">{t.label}</div>
              <div className="text-sm text-muted-foreground">
                {t.setsCount} set • {t.itemsCount} pernyataan
              </div>
            </div>

            {/* PENTING: encodeURIComponent sudah benar, walau URL akan tampak %20.
                Itu NORMAL dan bukan masalah. Yang penting drill page decode & normalize. */}
            <Link
              className="inline-flex items-center rounded-xl border px-4 py-2 hover:bg-muted"
              href={`/drill?topic=${encodeURIComponent(t.topicKey)}`}
            >
              Start
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
