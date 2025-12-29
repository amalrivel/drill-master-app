import Link from "next/link";
import { getQuestions } from "@/lib/questions";
import { normalizeTopic, topicLabel } from "@/lib/topic";
import { DrillSession } from "@/components/drill-session";

export default async function DrillPage({
  searchParams,
}: {
  // ✅ Next.js kamu menganggap searchParams bisa Promise
  searchParams?: Promise<{ topic?: string }>;
}) {
  const questions = await getQuestions();

  // ✅ unwrap searchParams promise
  const sp = searchParams ? await searchParams : undefined;

  // raw dari URL bisa berupa:
  // - "1.%20信号(しんごう)"
  // - "1. 信号(しんごう)"
  // - "1.+信号(しんごう)"
  const rawTopicParam = sp?.topic ?? null;

  const isAll = rawTopicParam == null || String(rawTopicParam).trim() === "";
  const topicKey = isAll ? null : normalizeTopic(rawTopicParam);

  const filtered = isAll
    ? questions
    : questions.filter((q) => normalizeTopic(q.topic ?? null) === topicKey);

  const label = isAll ? "All" : topicLabel(topicKey);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Drill</h1>
          <p className="text-sm text-muted-foreground">
            Topic: <span className="font-medium">{label}</span> •{" "}
            {filtered.length} set
          </p>
        </div>

        <Link
          className="inline-flex items-center rounded-xl border px-4 py-2 hover:bg-muted"
          href="/practice"
        >
          Back
        </Link>
      </div>

      {/* Kalau kamu mau: kirim null saat All */}
      <DrillSession topic={isAll ? null : label} questions={filtered} />
    </div>
  );
}
