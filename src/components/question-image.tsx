"use client";

import * as React from "react";
import { driveImageCandidates } from "@/lib/drive-image";

type Props = {
  imageUrl: string;
  alt?: string;
  className?: string;
};

export function QuestionImage({ imageUrl, alt = "question image", className }: Props) {
  const candidates = React.useMemo(() => driveImageCandidates(imageUrl), [imageUrl]);

  const [idx, setIdx] = React.useState(0);
  const [failedAll, setFailedAll] = React.useState(false);

  const src = candidates[idx] ?? "";

  React.useEffect(() => {
    // kalau imageUrl berubah, reset state
    setIdx(0);
    setFailedAll(false);
  }, [imageUrl]);

  const onError = () => {
    // coba kandidat berikutnya
    if (idx + 1 < candidates.length) {
      setIdx(idx + 1);
      return;
    }
    setFailedAll(true);
  };

  if (!imageUrl?.trim()) return null;

  return (
    <figure
      className={[
        "w-full mx-auto max-w-[720px]", // ✅ aman desktop
        "rounded-2xl border bg-muted/30 overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      <div className="w-full max-h-[420px] md:max-h-[520px] flex items-center justify-center">
        {!failedAll ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={[
              "block",
              "w-auto h-auto",
              "max-w-full",
              "max-h-[420px] md:max-h-[520px]",
              "object-contain",
              "select-none",
            ].join(" ")}
            onError={onError}
          />
        ) : (
          <div className="w-full p-4 text-sm text-muted-foreground">
            Gambar gagal dimuat.
            <div className="mt-2 text-xs space-y-1">
              <div className="font-medium">Candidates:</div>
              <ul className="list-disc pl-5 break-all">
                {candidates.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
