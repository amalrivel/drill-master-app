"use client";

/**
 * Session = progress drill yang sedang berjalan.
 * Ini berbeda dari "stats per item" yang kamu simpan untuk tracking performa.
 *
 * Kita kunci version agar gampang migrate.
 */
const VERSION = 1;

export function drillSessionKey(topicKey: string) {
  // topicKey bisa panjang / ada spasi / kana, jadi encode
  return `dm:drill:session:v${VERSION}:${encodeURIComponent(topicKey)}`;
}

export function clearDrillSession(topicKey: string) {
  try {
    localStorage.removeItem(drillSessionKey(topicKey));
  } catch {
    // ignore
  }
}
