import { getQuestions } from "@/lib/questions";
import { DevPreviewClient } from "@/components/dev-preview-client";

export default async function DevPreviewPage() {
  const questions = await getQuestions();

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Dev Preview</h1>
        <p className="text-sm text-muted-foreground">
          Search soal berdasarkan <span className="font-medium">id</span> (contoh:{" "}
          <span className="font-medium">Q-0227</span>,{" "}
          <span className="font-medium">SET-0001</span>, atau item seperti{" "}
          <span className="font-medium">SET-0001-2</span>).
        </p>
      </div>

      <DevPreviewClient questions={questions} />
    </div>
  );
}
