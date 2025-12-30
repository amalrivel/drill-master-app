export function extractDriveFileId(url: string): string | null {
  try {
    const u = new URL(String(url).trim());

    // https://drive.google.com/file/d/<id>/view
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m?.[1]) return m[1];

    // https://drive.google.com/open?id=<id>
    const id = u.searchParams.get("id");
    if (id) return id;

    // https://drive.google.com/uc?export=view&id=<id>
    const id2 = u.searchParams.get("id");
    if (id2) return id2;

    return null;
  } catch {
    return null;
  }
}

/**
 * Kandidat src untuk <img>. Kita coba berurutan sampai ada yang berhasil.
 * Paling sering berhasil: thumbnail
 */
export function driveImageCandidates(inputUrl: string): string[] {
  const raw = String(inputUrl ?? "").trim();
  const id = extractDriveFileId(raw);
  if (!id) return [raw];

  return [
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    `https://lh3.googleusercontent.com/d/${id}=s0`,
  ];
}
