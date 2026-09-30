import type { VideoCandidate } from "./finder.types";

export function normalizeQuery(query: string) {
	return query.trim().toLowerCase().replace(/\s+/g, " ");
}

const tokenize = (text: string) => new Set(normalizeQuery(text).split(" ").filter(Boolean));

export function scoreCandidates(query: string, candidates: VideoCandidate[], level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED") {
	const queryTokens = tokenize(query);
	const maxViews = Math.max(...candidates.map((candidate) => candidate.viewCount), 1);

	return candidates.map((candidate) => {
		const ageDays = Math.max(1, (Date.now() - new Date(candidate.publishedAt).getTime()) / 86_400_000);
		const engagement = candidate.likeCount + candidate.commentCount * 2;
		const titleAndDescription = `${candidate.title} ${candidate.description}`;
		const titleTokens = tokenize(titleAndDescription);
		const overlap = [...queryTokens].filter((token) => titleTokens.has(token)).length;
		const educationalTerms = /(tutorial|course|guide|lesson|learn|explained|walkthrough|beginner|complete|masterclass)/i;
		const shortPenalty = /shorts?/i.test(candidate.title) || /#shorts?/i.test(candidate.description) ? -14 : 0;
		const clickbaitPenalty = /(shocking|insane|you won't believe|hack that nobody|overnight)/i.test(candidate.title) ? -8 : 0;
		const durationMinutes = candidate.duration?.startsWith("PT") ? Math.max(1, Number(candidate.duration.replace(/[^0-9]/g, "")) || 0) : 0;
		const durationBonus = durationMinutes >= 5 && durationMinutes <= 45 ? 8 : durationMinutes > 45 ? 3 : 0;
		const levelBonus = level === "BEGINNER" ? (/(beginner|intro|fundamentals|basics|start here)/i.test(titleAndDescription) ? 8 : 0) : level === "INTERMEDIATE" ? (/(intermediate|deep dive|advanced|project)/i.test(titleAndDescription) ? 4 : 0) : level === "ADVANCED" ? (/(advanced|system design|internals|architecture|deep dive)/i.test(titleAndDescription) ? 6 : 0) : 0;
		const score = Math.log10(candidate.viewCount + 1) / Math.log10(maxViews + 1) * 38 + Math.min(20, Math.log10(engagement + 1) * 5) + Math.max(0, 16 - Math.log10(ageDays) * 4) + (candidate.duration && candidate.duration !== "PT0S" ? 8 : 0) + (educationalTerms.test(titleAndDescription) ? 10 : 0) + durationBonus + levelBonus + (overlap * 6) + shortPenalty + clickbaitPenalty;

		return { ...candidate, score: Math.round(score * 100) / 100 };
	}).sort((a, b) => b.score - a.score);
}
