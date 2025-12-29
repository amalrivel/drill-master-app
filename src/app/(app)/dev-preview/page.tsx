import { getQuestions } from "@/lib/questions";
import { JPTokenText } from "@/components/jp-token-text";
import { QuestionImage } from "@/components/question-image";

export default async function Page() {
  const questions = await getQuestions();

  return (
    <div className="p-6 space-y-6">
      {questions.slice(0, 10).map((q) => (
        <div key={q.id} className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm opacity-70">
            {q.kind} — {q.id}
          </div>

          {"prompt" in q && q.prompt ? (
            <JPTokenText tokens={q.prompt} className="text-lg leading-relaxed" />
          ) : null}

          {q.imageUrl ? <QuestionImage imageUrl={q.imageUrl} /> : null}

          {q.kind === "tf_single" ? (
            <JPTokenText tokens={q.item.statement} className="text-base leading-relaxed" />
          ) : (
            <ol className="list-decimal pl-5 space-y-2">
              {q.items.map((it) => (
                <li key={it.id}>
                  <JPTokenText tokens={it.statement} as="span" className="text-base leading-relaxed" />
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}
