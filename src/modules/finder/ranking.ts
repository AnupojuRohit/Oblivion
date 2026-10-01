import type { VideoCandidate } from "./finder.types";

export function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, " ");
}

const tokenize = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\-\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1),
  );

const parseDurationMinutes = (duration?: string) => {
  if (!duration?.startsWith("PT")) return 0;
  const hours = Number(duration.match(/(\d+)H/)?.[1] ?? 0);
  const minutes = Number(duration.match(/(\d+)M/)?.[1] ?? 0);
  const seconds = Number(duration.match(/(\d+)S/)?.[1] ?? 0);
  return hours * 60 + minutes + seconds / 60;
};

export function scoreCandidates(
  query: string,
  candidates: VideoCandidate[],
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
) {
  const queryTokens = tokenize(query);
  const maxViews = Math.max(...candidates.map((candidate) => candidate.viewCount), 1);

  return candidates
    .map((candidate) => {
      const title = candidate.title.toLowerCase();
      const description = candidate.description.toLowerCase();
      const text = title + " " + description;
      const titleTokens = tokenize(candidate.title);
      const descriptionTokens = tokenize(candidate.description);

      const titleOverlap = [...queryTokens].filter((token) => titleTokens.has(token)).length;
      const bodyOverlap = [...queryTokens].filter((token) => descriptionTokens.has(token)).length;
      const exactPhrase = text.includes(query.toLowerCase()) ? 18 : 0;

      const educational = /(tutorial|course|guide|lesson|learn|explained|walkthrough|beginner|complete|masterclass|crash course|bootcamp|project)/i.test(text) ? 10 : 0;
      const shortPenalty = /\bshorts?\b/i.test(candidate.title) || /#shorts?/i.test(candidate.description) ? -30 : 0;
      const clickbaitPenalty = /(shocking|insane|you won't believe|hack that nobody|overnight|destroyed|crazy trick)/i.test(candidate.title) ? -12 : 0;

      const durationMinutes = parseDurationMinutes(candidate.duration);
      const durationScore =
        durationMinutes >= 8 && durationMinutes <= 90 ? 10 :
        durationMinutes > 90 ? 4 :
        durationMinutes > 0 ? -4 : 0;

      const levelScore =
        level === "BEGINNER"
          ? (/(beginner|intro|fundamentals|basics|start here|from scratch|zero to)/i.test(text) ? 12 : 0)
          : level === "INTERMEDIATE"
            ? (/(intermediate|deep dive|project|production|real world)/i.test(text) ? 10 : 0)
            : level === "ADVANCED"
              ? (/(advanced|system design|internals|architecture|scalability|performance|deep dive)/i.test(text) ? 12 : 0)
              : 0;

      const ageDays = Math.max(1, (Date.now() - new Date(candidate.publishedAt).getTime()) / 86_400_000);
      const recency = Math.max(0, 10 - Math.log10(ageDays) * 2.5);
      const engagement = candidate.likeCount + candidate.commentCount * 2;
      const popularity = (Math.log10(candidate.viewCount + 1) / Math.log10(maxViews + 1)) * 28;
      const engagementScore = Math.min(16, Math.log10(engagement + 1) * 4);
      const relevance = Math.min(30, exactPhrase + titleOverlap * 8 + bodyOverlap * 3);

      const score = popularity + engagementScore + recency + educational + durationScore + levelScore + relevance + shortPenalty + clickbaitPenalty;
      return { ...candidate, score: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score);
}
