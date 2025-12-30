"use client";

import * as React from "react";
import type { TFQuestion, TFItem } from "@/lib/questions";
import { JPTokenText } from "@/components/jp-token-text";
import { QuestionImage } from "@/components/question-image";
import { normalizeSource, normalizeTopic, sourceLabel, topicLabel } from "@/lib/topic";

type Props = {
  questions: TFQuestion[];
};

function getSection(q: TFQuestion) {
  return (q as any).section as string | undefined;
}

function getTestNo(q: TFQuestion) {
  return (q as any).testNo as number | undefined;
}

type FilterState = {
  sourceKey: string; // "__all__" or normalized
  topicKey: string;  // "__all__" or normalized
  section: string;   // "__all__" or raw section
  testNo: string;    // "__all__" or number string
};

const ALL = "__all__";

function MetaRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}

function TFItemBlock({
  it,
  showFurigana,
}: {
  it: TFItem;
  showFurigana: boolean;
}) {
  return (
    <div className="rounded-xl border p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">Item ID: {it.id}</div>
        <div className="text-sm font-semibold">{it.correct ? "〇" : "✕"}</div>
      </div>

      <JPTokenText tokens={it.statement} showFurigana={showFurigana} className="text-lg md:text-xl leading-relaxed" />

      {(it.explanation || it.ref) ? (
        <div className="rounded-lg border p-2 space-y-1">
          <MetaRow label="Ref" value={it.ref ?? ""} />
          {it.explanation ? (
            <JPTokenText tokens={it.explanation} showFurigana={showFurigana} className="text-base md:text-lg leading-relaxed" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function QuestionCard({
  q,
  showFurigana,
}: {
  q: TFQuestion;
  showFurigana: boolean;
}) {
  const sec = getSection(q) ?? "";
  const tn = getTestNo(q);

  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold">{q.id}</div>
          <div className="text-xs text-muted-foreground">
            {q.type}
            {q.source ? ` • src:${q.source}` : ""}
            {q.topic ? ` • topic:${q.topic}` : " • topic:(empty)"}
            {sec ? ` • sec:${sec}` : ""}
            {typeof tn === "number" ? ` • test:${tn}` : ""}
          </div>
        </div>

        <div className="grid gap-1 text-right">
          <div className="text-xs text-muted-foreground">
            {q.type === "tf_single" ? "1 item" : `${q.items.length} items`}
          </div>
        </div>
      </div>

      {"prompt" in q && q.prompt ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Prompt</div>
          <JPTokenText tokens={q.prompt} showFurigana={showFurigana} className="text-lg md:text-xl leading-relaxed" />
        </div>
      ) : null}

      {"imageUrl" in q && q.imageUrl ? <QuestionImage imageUrl={q.imageUrl} /> : null}

      {q.type === "tf_single" ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Statement</div>
          <TFItemBlock it={q.item} showFurigana={showFurigana} />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm font-medium">Items</div>
          <div className="space-y-3">
            {q.items.map((it) => (
              <TFItemBlock key={it.id} it={it} showFurigana={showFurigana} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DevPreviewClient({ questions }: Props) {
  const [showFurigana, setShowFurigana] = React.useState(true);

  const [filters, setFilters] = React.useState<FilterState>({
    sourceKey: ALL,
    topicKey: ALL,
    section: ALL,
    testNo: ALL,
  });

  const [limit, setLimit] = React.useState(20);
  const [renderDetails, setRenderDetails] = React.useState(true);

  const allSources = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const q of questions) {
      const key = normalizeSource(q.source ?? null);
      m.set(key, sourceLabel(q.source ?? null));
    }
    return Array.from(m.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [questions]);

  const allSections = React.useMemo(() => {
    const s = new Set<string>();
    for (const q of questions) {
      const sec = (getSection(q) ?? "").trim();
      if (sec) s.add(sec);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const allTestNos = React.useMemo(() => {
    const s = new Set<number>();
    for (const q of questions) {
      const n = getTestNo(q);
      if (typeof n === "number" && Number.isFinite(n)) s.add(n);
    }
    return Array.from(s).sort((a, b) => a - b);
  }, [questions]);

  const topicOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions) {
      const sKey = normalizeSource(q.source ?? null);
      if (filters.sourceKey !== ALL && sKey !== filters.sourceKey) continue;
      const tKey = normalizeTopic(q.topic ?? null);
      map.set(tKey, topicLabel(q.topic ?? null));
    }
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [questions, filters.sourceKey]);

  const filtered = React.useMemo(() => {
    return questions.filter((q) => {
      if (filters.sourceKey !== ALL) {
        const sKey = normalizeSource(q.source ?? null);
        if (sKey !== filters.sourceKey) return false;
      }
      if (filters.topicKey !== ALL) {
        const tKey = normalizeTopic(q.topic ?? null);
        if (tKey !== filters.topicKey) return false;
      }
      if (filters.section !== ALL) {
        if ((getSection(q) ?? "") !== filters.section) return false;
      }
      if (filters.testNo !== ALL) {
        const n = getTestNo(q);
        if (String(n ?? "") !== filters.testNo) return false;
      }
      return true;
    });
  }, [questions, filters]);

  React.useEffect(() => {
    // reset pagination on filter changes
    setLimit(20);
  }, [filters]);

  const visible = filtered.slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Total loaded: <span className="font-medium">{questions.length}</span> set
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-xl border px-3 py-2 hover:bg-muted"
              onClick={() => setRenderDetails((v) => !v)}
            >
              {renderDetails ? "List only" : "Render detail"}
            </button>
            <button
              className="rounded-xl border px-3 py-2 hover:bg-muted"
              onClick={() => setShowFurigana((v) => !v)}
            >
              {showFurigana ? "Hide" : "Show"} furigana
            </button>
          </div>
        </div>

        {/* filters */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <div className="text-xs text-muted-foreground">Source</div>
            <select
              className="w-full rounded-xl border px-3 py-2 bg-transparent"
              value={filters.sourceKey}
              onChange={(e) => {
                const nextSource = e.target.value;
                setFilters((f) => ({ ...f, sourceKey: nextSource, topicKey: ALL }));
              }}
            >
              <option value={ALL}>All</option>
              {allSources.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-xs text-muted-foreground">Topic</div>
            <select
              className="w-full rounded-xl border px-3 py-2 bg-transparent"
              value={filters.topicKey}
              onChange={(e) => setFilters((f) => ({ ...f, topicKey: e.target.value }))}
            >
              <option value={ALL}>All</option>
              {topicOptions.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-xs text-muted-foreground">Section</div>
            <select
              className="w-full rounded-xl border px-3 py-2 bg-transparent"
              value={filters.section}
              onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))}
            >
              <option value={ALL}>All</option>
              {allSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-xs text-muted-foreground">Test No</div>
            <select
              className="w-full rounded-xl border px-3 py-2 bg-transparent"
              value={filters.testNo}
              onChange={(e) => setFilters((f) => ({ ...f, testNo: e.target.value }))}
            >
              <option value={ALL}>All</option>
              {allTestNos.map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Matched: <span className="font-medium">{filtered.length}</span> set • Showing{" "}
            <span className="font-medium">{visible.length}</span>
          </div>
          <button
            className="rounded-xl border px-3 py-2 hover:bg-muted"
            onClick={() => {
              setFilters({ sourceKey: ALL, topicKey: ALL, section: ALL, testNo: ALL });
              setLimit(20);
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* output */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
          Tidak ada soal untuk filter ini.
        </div>
      ) : renderDetails ? (
        <div className="space-y-4">
          {visible.map((q) => (
            <QuestionCard key={q.id} q={q} showFurigana={showFurigana} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border p-4 space-y-2">
          {visible.map((q) => (
            <div key={q.id} className="rounded-xl border p-3">
              <div className="font-semibold">{q.id}</div>
              <div className="text-xs text-muted-foreground">
                {q.type}
                {q.source ? ` • src:${q.source}` : ""}
                {q.topic ? ` • topic:${q.topic}` : " • topic:(empty)"}
                {getSection(q) ? ` • sec:${getSection(q)}` : ""}
                {typeof getTestNo(q) === "number" ? ` • test:${getTestNo(q)}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {visible.length < filtered.length ? (
        <button
          className="w-full rounded-xl border px-4 py-3 hover:bg-muted"
          onClick={() => setLimit((n) => n + 20)}
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}
