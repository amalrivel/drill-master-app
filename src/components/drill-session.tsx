"use client";

import * as React from "react";
import type { TFQuestion, TFItem } from "@/lib/questions";
import { JPTokenText } from "@/components/jp-token-text";
import { QuestionImage } from "@/components/question-image";
import { loadStats, saveStats, bumpItemStat, type StatsStore } from "@/lib/stats";
import { loadSession, saveSession, clearSession, newSessionSnapshot } from "@/lib/session";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

function totalItemsCount(questions: TFQuestion[]) {
  return questions.reduce((sum, q) => sum + (q.type === "tf_single" ? 1 : q.items.length), 0);
}

function firstUnansweredIndex(deck: TFQuestion[], answered: Set<string>, startIdx: number): number {
  let i = Math.max(0, startIdx);
  while (i < deck.length && answered.has(deck[i].id)) i++;
  return i; // bisa == deck.length (selesai)
}

type Props = {
  topicKey: string;     // session key (boleh gabungan source/topic)
  topicLabel: string;   // label tampilan
  questions: TFQuestion[];
};

export function DrillSession({ topicKey, topicLabel, questions }: Props) {
  const [ready, setReady] = React.useState(false);

  const baseQuestions = React.useMemo(() => uniqueById(questions), [questions]);

  // session state
  const [deck, setDeck] = React.useState<TFQuestion[]>(baseQuestions);
  const [idx, setIdx] = React.useState(0);
  const [answeredSetIds, setAnsweredSetIds] = React.useState<Set<string>>(() => new Set());

  // UI
  const [showFurigana, setShowFurigana] = React.useState(true);

  // score
  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongItemIds, setWrongItemIds] = React.useState<string[]>([]);

  // local stats cache
  const statsRef = React.useRef<StatsStore>({});

  // per-step UI state
  const [singleAnswered, setSingleAnswered] = React.useState<{
    picked?: boolean;
    isCorrect?: boolean;
    user?: boolean;
  }>({});

  const [groupAnswers, setGroupAnswers] = React.useState<Record<string, boolean | undefined>>({});
  const [groupSubmitted, setGroupSubmitted] = React.useState(false);

  const totalSets = deck.length;
  const totalItems = totalItemsCount(deck);
  const isFinished = idx >= deck.length;
  const current = deck[idx];

  const persist = React.useCallback(
    (override?: Partial<{
      deck: TFQuestion[];
      idx: number;
      answeredSetIds: Set<string>;
      correctCount: number;
      wrongItemIds: string[];
      showFurigana: boolean;
    }>) => {
      const deckNow = override?.deck ?? deck;
      const idxNow = override?.idx ?? idx;
      const answeredNow = override?.answeredSetIds ?? answeredSetIds;
      const correctNow = override?.correctCount ?? correctCount;
      const wrongNow = override?.wrongItemIds ?? wrongItemIds;
      const furiganaNow = override?.showFurigana ?? showFurigana;

      saveSession({
        v: 1,
        topicKey,
        createdAt: Date.now(),
        deckIds: deckNow.map((q) => q.id),
        idx: idxNow,
        answeredSetIds: Array.from(answeredNow),
        correctCount: correctNow,
        wrongItemIds: wrongNow,
        showFurigana: furiganaNow,
      });
    },
    [topicKey, deck, idx, answeredSetIds, correctCount, wrongItemIds, showFurigana]
  );

  const next = () => {
    // reset per-step UI state
    setSingleAnswered({});
    setGroupAnswers({});
    setGroupSubmitted(false);

    setIdx((curIdx) => {
      const nextIdx = firstUnansweredIndex(deck, answeredSetIds, curIdx + 1);
      persist({ idx: nextIdx });
      return nextIdx;
    });
  };

  // init: restore session or create new
  React.useEffect(() => {
    statsRef.current = loadStats();

    const snap = loadSession(topicKey);
    const byId = new Map(baseQuestions.map((q) => [q.id, q] as const));

    if (snap && snap.deckIds?.length) {
      const restoredDeck = snap.deckIds.map((id) => byId.get(id)).filter(Boolean) as TFQuestion[];
      if (restoredDeck.length) {
        const restoredAnswered = new Set<string>(snap.answeredSetIds ?? []);
        const restoredIdxRaw = Math.max(0, Math.min(snap.idx ?? 0, restoredDeck.length));
        const restoredIdx = firstUnansweredIndex(restoredDeck, restoredAnswered, restoredIdxRaw);

        setDeck(restoredDeck);
        setAnsweredSetIds(restoredAnswered);
        setIdx(restoredIdx);

        setCorrectCount(snap.correctCount ?? 0);
        setWrongItemIds(snap.wrongItemIds ?? []);
        setShowFurigana(snap.showFurigana ?? true);

        setSingleAnswered({});
        setGroupAnswers({});
        setGroupSubmitted(false);

        // persist corrected idx (kalau idx jatuh ke answered)
        saveSession({
          v: 1,
          topicKey,
          createdAt: Date.now(),
          deckIds: restoredDeck.map((q) => q.id),
          idx: restoredIdx,
          answeredSetIds: Array.from(restoredAnswered),
          correctCount: snap.correctCount ?? 0,
          wrongItemIds: snap.wrongItemIds ?? [],
          showFurigana: snap.showFurigana ?? true,
        });

        setReady(true);
        return;
      }
    }

    // no session -> create new
    const newDeck = shuffle(baseQuestions);
    const answered = new Set<string>();

    setDeck(newDeck);
    setAnsweredSetIds(answered);
    setIdx(0);

    setCorrectCount(0);
    setWrongItemIds([]);
    setShowFurigana(true);

    setSingleAnswered({});
    setGroupAnswers({});
    setGroupSubmitted(false);

    saveSession(
      newSessionSnapshot({
        topicKey,
        deckIds: newDeck.map((q) => q.id),
        idx: 0,
        answeredSetIds: [],
        correctCount: 0,
        wrongItemIds: [],
        showFurigana: true,
      })
    );

    setReady(true);
  }, [topicKey, baseQuestions]);

  // persist furigana toggle
  React.useEffect(() => {
    if (!ready) return;
    persist({ showFurigana });
  }, [showFurigana, ready]);

  // clear session at finish (optional)
  React.useEffect(() => {
    if (!ready) return;
    if (isFinished) clearSession(topicKey);
  }, [ready, isFinished, topicKey]);

  const answerSingle = (user: boolean, item: TFItem) => {
    if (!current) return;
    if (answeredSetIds.has(current.id)) return;
    if (singleAnswered.picked) return;

    const ok = user === item.correct;

    setSingleAnswered({ picked: true, isCorrect: ok, user });

    const nextCorrect = correctCount + (ok ? 1 : 0);
    const nextWrongList = ok ? wrongItemIds : [...wrongItemIds, item.id];

    setCorrectCount(nextCorrect);
    setWrongItemIds(nextWrongList);

    // stats per item
    const updatedStats = bumpItemStat(statsRef.current, item.id, ok);
    statsRef.current = updatedStats;
    saveStats(updatedStats);

    // mark set answered
    const nextAnswered = new Set(answeredSetIds);
    nextAnswered.add(current.id);
    setAnsweredSetIds(nextAnswered);

    persist({
      correctCount: nextCorrect,
      wrongItemIds: nextWrongList,
      answeredSetIds: nextAnswered,
    });
  };

  const submitGroup = (items: TFItem[]) => {
    if (!current) return;
    if (answeredSetIds.has(current.id)) return;
    if (groupSubmitted) return;

    const allAnswered = items.every((it) => groupAnswers[it.id] !== undefined);
    if (!allAnswered) return;

    let addCorrect = 0;
    const wrongs: string[] = [];
    let st = statsRef.current;

    for (const it of items) {
      const user = groupAnswers[it.id]!;
      const ok = user === it.correct;
      if (ok) addCorrect += 1;
      else wrongs.push(it.id);
      st = bumpItemStat(st, it.id, ok);
    }

    statsRef.current = st;
    saveStats(st);

    const nextCorrect = correctCount + addCorrect;
    const nextWrongList = wrongs.length ? [...wrongItemIds, ...wrongs] : wrongItemIds;

    setCorrectCount(nextCorrect);
    setWrongItemIds(nextWrongList);

    setGroupSubmitted(true);

    const nextAnswered = new Set(answeredSetIds);
    nextAnswered.add(current.id);
    setAnsweredSetIds(nextAnswered);

    persist({
      correctCount: nextCorrect,
      wrongItemIds: nextWrongList,
      answeredSetIds: nextAnswered,
    });
  };

  const restart = (mode: "all" | "wrong") => {
    const base = baseQuestions;

    let newDeck: TFQuestion[];
    if (mode === "all") {
      newDeck = shuffle(base);
    } else {
      const wrongSetIds = new Set<string>();
      for (const wid of wrongItemIds) {
        const parts = wid.split("-");
        if (parts.length >= 2) wrongSetIds.add(parts.slice(0, -1).join("-"));
      }
      const wrongSets = base.filter((q) => wrongSetIds.has(q.id));
      newDeck = shuffle(wrongSets.length ? wrongSets : base);
    }

    const answered = new Set<string>();

    setDeck(newDeck);
    setAnsweredSetIds(answered);
    setIdx(0);

    setCorrectCount(0);
    setWrongItemIds([]);

    setSingleAnswered({});
    setGroupAnswers({});
    setGroupSubmitted(false);

    persist({
      deck: newDeck,
      idx: 0,
      answeredSetIds: answered,
      correctCount: 0,
      wrongItemIds: [],
    });
  };

  const renderTFButtons = (onPick: (val: boolean) => void, disabled?: boolean) => (
    <div className="flex gap-2">
      <button
        className="flex-1 rounded-xl border px-4 py-3 hover:bg-muted disabled:opacity-50"
        onClick={() => onPick(true)}
        disabled={disabled}
      >
        〇
      </button>
      <button
        className="flex-1 rounded-xl border px-4 py-3 hover:bg-muted disabled:opacity-50"
        onClick={() => onPick(false)}
        disabled={disabled}
      >
        ✕
      </button>
    </div>
  );

  if (!ready) {
    return (
      <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
        Loading session...
      </div>
    );
  }

  if (!questions.length) {
    return <div className="rounded-2xl border p-4">Tidak ada soal untuk filter ini.</div>;
  }

  if (isFinished) {
    return (
      <div className="rounded-2xl border p-5 space-y-4">
        <div className="space-y-1">
          <div className="text-xl font-semibold">Selesai</div>
          <div className="text-sm text-muted-foreground">
            Topic: <span className="font-medium">{topicLabel}</span>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Skor</div>
          <div className="text-3xl font-semibold">
            {correctCount} / {totalItems}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Salah: {wrongItemIds.length}</div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 rounded-xl border px-4 py-3 hover:bg-muted" onClick={() => restart("all")}>
            Ulangi semua
          </button>
          <button
            className="flex-1 rounded-xl border px-4 py-3 hover:bg-muted disabled:opacity-50"
            onClick={() => restart("wrong")}
            disabled={wrongItemIds.length === 0}
          >
            Ulangi yang salah
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const alreadyAnsweredThisSet = answeredSetIds.has(current.id);
  const stepLabel = `${Math.min(idx + 1, totalSets)} / ${totalSets}`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Progress</div>
          <div className="font-medium">
            Set {stepLabel} • Skor {correctCount}/{totalItems}
          </div>
        </div>

        <button className="rounded-xl border px-3 py-2 hover:bg-muted" onClick={() => setShowFurigana((v) => !v)}>
          {showFurigana ? "Hide" : "Show"} furigana
        </button>
      </div>

      <div className="rounded-2xl border p-5 space-y-4">
        {"prompt" in current && current.prompt ? (
          <JPTokenText tokens={current.prompt} showFurigana={showFurigana} className="text-lg md:text-xl leading-relaxed" />
        ) : null}

        {current.imageUrl ? <QuestionImage imageUrl={current.imageUrl} /> : null}

        {alreadyAnsweredThisSet ? (
          <div className="rounded-xl border p-3 text-sm text-muted-foreground">
            Set ini sudah dijawab. Tekan <span className="font-medium">Next</span> untuk lanjut.
          </div>
        ) : null}

        {current.type === "tf_single" ? (
          <div className="space-y-4">
            <JPTokenText tokens={current.item.statement} showFurigana={showFurigana} className="text-lg md:text-xl leading-relaxed" />

            {renderTFButtons((val) => answerSingle(val, current.item), !!singleAnswered.picked || alreadyAnsweredThisSet)}

            {singleAnswered.picked ? (
              <div className="space-y-3">
                <div
                  className={[
                    "rounded-xl border p-3 text-sm",
                    singleAnswered.isCorrect ? "border-green-600/40" : "border-red-600/40",
                  ].join(" ")}
                >
                  {singleAnswered.isCorrect ? "Benar ✅" : "Salah ❌"} — Jawaban:{" "}
                  <span className="font-medium">{current.item.correct ? "〇" : "✕"}</span>
                </div>

                {(current.item.explanation || current.item.ref) ? (
                  <div className="rounded-xl border p-3 space-y-2">
                    {current.item.ref ? <div className="text-xs text-muted-foreground">Ref: {current.item.ref}</div> : null}
                    {current.item.explanation ? (
                      <JPTokenText tokens={current.item.explanation} showFurigana={showFurigana} className="text-base md:text-lg leading-relaxed" />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              className="w-full rounded-xl border px-4 py-3 hover:bg-muted disabled:opacity-50"
              onClick={next}
              disabled={!singleAnswered.picked && !alreadyAnsweredThisSet}
            >
              Next
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ol className="space-y-3">
              {current.items.map((it, i) => {
                const user = groupAnswers[it.id];
                const isAnswered = user !== undefined;
                const isCorrect = groupSubmitted ? user === it.correct : undefined;

                return (
                  <li key={it.id} className="rounded-xl border p-3 space-y-3">
                    <div className="text-sm text-muted-foreground">({i + 1})</div>

                    <JPTokenText tokens={it.statement} showFurigana={showFurigana} className="text-lg md:text-xl leading-relaxed" />

                    <div className="flex gap-2">
                      <button
                        className={["flex-1 rounded-xl border px-4 py-3 hover:bg-muted", user === true ? "bg-muted" : ""].join(" ")}
                        onClick={() => setGroupAnswers((m) => ({ ...m, [it.id]: true }))}
                        disabled={groupSubmitted || alreadyAnsweredThisSet}
                      >
                        〇
                      </button>
                      <button
                        className={["flex-1 rounded-xl border px-4 py-3 hover:bg-muted", user === false ? "bg-muted" : ""].join(" ")}
                        onClick={() => setGroupAnswers((m) => ({ ...m, [it.id]: false }))}
                        disabled={groupSubmitted || alreadyAnsweredThisSet}
                      >
                        ✕
                      </button>
                    </div>

                    {groupSubmitted ? (
                      <div className="space-y-2">
                        <div
                          className={["rounded-lg border p-2 text-sm", isCorrect ? "border-green-600/40" : "border-red-600/40"].join(" ")}
                        >
                          {isCorrect ? "Benar ✅" : "Salah ❌"} — Jawaban:{" "}
                          <span className="font-medium">{it.correct ? "〇" : "✕"}</span>
                        </div>

                        {/* ✅ explanation/ref per item */}
                        {(it.explanation || it.ref) ? (
                          <div className="rounded-lg border p-2 space-y-1">
                            {it.ref ? <div className="text-xs text-muted-foreground">Ref: {it.ref}</div> : null}
                            {it.explanation ? (
                              <JPTokenText tokens={it.explanation} showFurigana={showFurigana} className="text-base md:text-lg leading-relaxed" />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">{isAnswered ? "Dipilih" : "Belum dijawab"}</div>
                    )}
                  </li>
                );
              })}
            </ol>

            {!groupSubmitted ? (
              <button
                className="w-full rounded-xl border px-4 py-3 hover:bg-muted disabled:opacity-50"
                onClick={() => submitGroup(current.items)}
                disabled={alreadyAnsweredThisSet || !current.items.every((it) => groupAnswers[it.id] !== undefined)}
              >
                Submit
              </button>
            ) : (
              <button className="w-full rounded-xl border px-4 py-3 hover:bg-muted" onClick={next}>
                Next
              </button>
            )}

            {/* extra safety: kalau restore sudah answered tapi groupSubmitted=false */}
            {alreadyAnsweredThisSet && !groupSubmitted ? (
              <button className="w-full rounded-xl border px-4 py-3 hover:bg-muted" onClick={next}>
                Next
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
