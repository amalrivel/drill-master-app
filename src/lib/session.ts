import { getJson, setJson, removeKey } from "@/lib/storage";

export type SessionSnapshot = {
  v: 1;
  topicKey: string;           // "__all__" atau normalized topic
  createdAt: number;          // epoch ms
  deckIds: string[];          // array TFQuestion.id (set id)
  idx: number;                // current index in deck
  answeredSetIds: string[];   // set yang sudah selesai dijawab
  correctCount: number;
  wrongItemIds: string[];     // item ids yang salah
  showFurigana: boolean;
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

function keyFor(topicKey: string) {
  // aman untuk string Jepang
  return `drillmaster:session:v1:${encodeURIComponent(topicKey)}`;
}

export function loadSession(topicKey: string): SessionSnapshot | null {
  const snap = getJson<SessionSnapshot>(keyFor(topicKey));
  if (!snap) return null;
  if (snap.v !== 1) return null;

  const now = Date.now();
  if (!snap.createdAt || now - snap.createdAt > SESSION_TTL_MS) {
    // expired
    removeKey(keyFor(topicKey));
    return null;
  }
  return snap;
}

export function saveSession(snap: SessionSnapshot): void {
  setJson(keyFor(snap.topicKey), snap);
}

export function clearSession(topicKey: string): void {
  removeKey(keyFor(topicKey));
}

export function newSessionSnapshot(params: Omit<SessionSnapshot, "v" | "createdAt">): SessionSnapshot {
  return {
    v: 1,
    createdAt: Date.now(),
    ...params,
  };
}
