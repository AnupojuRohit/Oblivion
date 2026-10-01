"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, ExternalLink, PlayCircle, Search, Sparkles } from "lucide-react";

type FinderResult = {
  query: string;
  level?: string;
  best: { videoId: string; title: string; description: string; channelName: string; thumbnailUrl: string; videoUrl: string; score: number };
  alternatives: Array<{ videoId: string; title: string; channelName: string; thumbnailUrl: string; videoUrl: string; score: number }>;
  reasoning: string;
  roadmap: Array<{ step: number; title: string; why: string }>;
  source: string;
  cached: boolean;
};

const examples = ["Docker", "Learn React Hooks", "TypeScript generics", "System design basics"];

export default function FinderClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "Docker");
  const [level, setLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">((searchParams.get("level") as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") ?? "BEGINNER");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinderResult | null>(null);\n  const [saved, setSaved] = useState(false);\n  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function runSearch() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/finder/search?q=${encodeURIComponent(query)}&level=${encodeURIComponent(level)}`, { signal: controller.signal });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json?.error?.message ?? "Finder search failed");
        }

        setResult(json.data as FinderResult);
      } catch (searchError) {
        if ((searchError as Error).name !== "AbortError") {
          setError(searchError instanceof Error ? searchError.message : "Finder search failed");
          setResult(null);
        }
      } finally {
        setLoading(false);
      }
    }

    runSearch();
    return () => controller.abort();
  }, [query, level]);

  const roadmap = useMemo(() => result?.roadmap ?? [], [result]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <section className="overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,rgba(79,70,229,0.1),rgba(14,165,233,0.08),rgba(15,23,42,0.03))] p-8 shadow-sm md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              <Sparkles className="size-3.5 text-[var(--brand)]" />
              AI resource finder
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
              What do you want to <span className="text-[var(--brand)]">learn</span>?
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
              Search real YouTube learning resources, rank them deterministically, and let Gemini refine the best match without ever inventing video IDs.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {examples.map((example) => (
                <button key={example} type="button" onClick={() => setQuery(example)} className="rounded-full border bg-background/80 px-4 py-2 text-sm font-medium transition hover:border-[var(--brand)] hover:text-[var(--brand)]">
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-background/90 p-5 shadow-lg backdrop-blur">
            <form className="space-y-4" onSubmit={submitSearch}>
              <label className="block text-sm font-medium">
                Search
                <div className="mt-2 flex items-center gap-2 rounded-xl border bg-[var(--surface)] px-4 py-3">
                  <Search className="size-4 text-[var(--muted)]" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]" placeholder="Docker, React Hooks, Python basics..." />
                </div>
              </label>

              <label className="block text-sm font-medium">
                Level
                <select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="mt-2 w-full rounded-xl border bg-[var(--surface)] px-4 py-3 text-sm outline-none">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </label>

              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95">
                <PlayCircle className="size-4" />
                Search resources
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { title: "Verified candidates", text: "We only rank real YouTube videos returned by the server." },
          { title: "Deterministic fallback", text: "The result still works if Gemini is unavailable." },
          { title: "Roadmap included", text: "Each search returns a short learning path to keep momentum." },
        ].map((item) => (
          <article key={item.title} className="rounded-2xl border bg-[var(--surface)] p-5">
            <h2 className="text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Best Resource</h2>
              <p className="text-sm text-[var(--muted)]">{loading ? "Searching verified videos..." : result ? `Source: ${result.source}${result.cached ? " · cached" : ""}` : "No result yet"}</p>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</div> : null}

          {!loading && result ? (
            <div className="mt-6 space-y-6">
              <article className="overflow-hidden rounded-2xl border bg-background">
                <Image src={result.best.thumbnailUrl} alt={result.best.title} width={1280} height={720} unoptimized className="h-56 w-full object-cover" />
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    <span>Top pick</span>
                    <span>•</span>
                    <span>{result.best.score.toFixed(2)} score</span>
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight">{result.best.title}</h3>
                  <p className="text-sm leading-6 text-[var(--muted)]">{result.best.description.slice(0, 180)}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                    <span>{result.best.channelName}</span>
                    <span>•</span>
                    <span>{result.best.videoId}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={result.best.videoUrl} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white">
                      <ExternalLink className="size-4" />
                      Open YouTube
                    </Link>
                    <button type="button" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold">
                      <Bookmark className="size-4" />
                      Save
                    </button>
                  </div>
                </div>
              </article>

              <section>
                <h3 className="text-base font-semibold">Why this video</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{result.reasoning}</p>
              </section>
            </div>
          ) : null}

          {!loading && !result && !error ? <div className="mt-6 rounded-xl border border-dashed p-8 text-sm text-[var(--muted)]">No resources found. Try a different query.</div> : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-[var(--surface)] p-6">
            <h2 className="text-lg font-semibold">Alternative Resources</h2>
            <div className="mt-4 space-y-4">
              {result?.alternatives.length ? result.alternatives.map((item) => (
                <article key={item.videoId} className="flex gap-4 rounded-xl border bg-background p-3">
                  <Image src={item.thumbnailUrl} alt={item.title} width={320} height={180} unoptimized className="h-20 w-28 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">{item.channelName}</p>
                    <a href={item.videoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[var(--brand)]">
                      Open YouTube
                    </a>
                  </div>
                </article>
              )) : <p className="text-sm text-[var(--muted)]">Alternatives will appear here after search.</p>}
            </div>
          </section>

          <section className="rounded-2xl border bg-[var(--surface)] p-6">
            <h2 className="text-lg font-semibold">Learning Roadmap</h2>
            <div className="mt-4 space-y-3">
              {roadmap.length ? roadmap.map((step) => (
                <div key={step.step} className="rounded-xl border bg-background p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Step {step.step}</div>
                  <p className="mt-1 text-sm font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{step.why}</p>
                </div>
              )) : <p className="text-sm text-[var(--muted)]">A roadmap will appear here after the first search.</p>}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}