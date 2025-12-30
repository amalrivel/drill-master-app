import Link from "next/link";
import { getQuestions } from "@/lib/questions";
import { normalizeSource, normalizeTopic, sourceLabel, topicLabel } from "@/lib/topic";
import { DrillSession } from "@/components/drill-session";

export default async function DrillPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; topic?: string }>;
}) {
  const questions = await getQuestions();
  const sp = searchParams ? await searchParams : undefined;

  const rawSource = sp?.source ?? null;
  const rawTopic = sp?.topic ?? null;

  const hasSource = rawSource != null && String(rawSource).trim() !== "";
  const hasTopic = rawTopic != null && String(rawTopic).trim() !== "";

  const sourceKey = hasSource ? normalizeSource(rawSource) : "__all_sources__";
  const topicKey = hasTopic ? normalizeTopic(rawTopic) : "__all_topics__";

  const filtered = questions.filter((q) => {
    const qSourceKey = normalizeSource(q.source ?? null);
    const qTopicKey = normalizeTopic(q.topic ?? null);

    if (hasSource && qSourceKey !== sourceKey) return false;
    if (hasTopic && qTopicKey !== topicKey) return false;
    return true;
  });

  const labelSource = hasSource ? sourceLabel(sourceKey) : "All sources";
  const labelTopic = hasTopic ? topicLabel(topicKey) : "All topics";

  // penting: session key harus unik berdasarkan kombinasi filter
  const sessionKey = `${sourceKey}__${topicKey}`;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Drill</h1>
          <p className="text-sm text-muted-foreground">
            Source: <span className="font-medium">{labelSource}</span> • Topic:{" "}
            <span className="font-medium">{labelTopic}</span> • {filtered.length} set
          </p>
        </div>

        <Link className="inline-flex items-center rounded-xl border px-4 py-2 hover:bg-muted" href="/practice">
          Back
        </Link>
      </div>

      <DrillSession
        topicKey={sessionKey}
        topicLabel={`${labelSource} / ${labelTopic}`}
        questions={filtered}
      />
    </div>
  );
}
