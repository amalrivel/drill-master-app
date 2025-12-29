"use client";

import * as React from "react";
import { driveImageCandidates } from "@/lib/drive-image";

export function QuestionImage({
  imageUrl,
  alt = "Ilustrasi soal",
}: {
  imageUrl?: string | null;
  alt?: string;
}) {
  const candidates = React.useMemo(
    () => (imageUrl ? driveImageCandidates(imageUrl) : []),
    [imageUrl]
  );

  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    setIdx(0);
  }, [imageUrl]);

  if (!imageUrl) return null;

  const src = candidates[idx];

  if (!src) {
    return (
      <div className="w-full rounded-xl border p-3 text-sm text-muted-foreground">
        Gambar gagal dimuat. Pastikan file Google Drive dibagikan ke “Anyone with the link (Viewer)”.
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border bg-white">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setIdx((v) => v + 1)}
      />
    </div>
  );
}
