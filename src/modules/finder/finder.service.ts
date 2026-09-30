import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { selectWithGemini } from "@/infrastructure/gemini/gemini.client";
import { searchYoutube } from "@/infrastructure/youtube/youtube.client";
import { ResourceRecommendation } from "./recommendation.model";
import { normalizeQuery, scoreCandidates } from "./ranking";
import type { FinderResult } from "./finder.types";

const ROADMAP: FinderResult["roadmap"] = [
    { step: 1, title: "Understand the core idea", why: "Start with the terminology and mental model." },
    { step: 2, title: "Watch the selected video", why: "Use the highest quality verified candidate first." },
    { step: 3, title: "Practice with a small example", why: "Applying the concept makes the resource stick." },
];

const fallback = (query: string, level: FinderResult["level"], candidates: FinderResult["alternatives"][number][]): FinderResult => ({ query, level, best: candidates[0], alternatives: candidates.slice(1, 4), reasoning: "Ranked using verified YouTube engagement, recency, and completeness signals.", roadmap: ROADMAP, source: "deterministic", cached: false });

const getCacheKey = (query: string, level?: FinderResult["level"]) => `${query}::${level ?? "ANY"}`;

export const finderService = {
    async search(query: string, level?: FinderResult["level"]): Promise<FinderResult> {
        await connectToDatabase();
        const normalized = normalizeQuery(query);
        const cacheKey = getCacheKey(normalized, level);
        const cached = await ResourceRecommendation.findOne({ query: cacheKey }).lean();

        if (cached) return { ...(cached.result as FinderResult), cached: true };

        const candidates = scoreCandidates(normalized, await searchYoutube(normalized), level).slice(0, 8);

        if (!candidates.length) throw new AppError("RESOURCE_NOT_FOUND", "No YouTube learning resources were found for this query", 404);

        let result: FinderResult;

        try {
            const selection = await selectWithGemini(normalized, candidates);
            const byId = new Map(candidates.map((candidate) => [candidate.videoId, candidate]));
            const best = byId.get(selection.selectedVideoId);

            if (!best) throw new Error("Selected candidate missing");

            result = {
                query: normalized,
                level,
                best,
                alternatives: selection.alternativeVideoIds.filter((id) => id !== best.videoId).map((id) => byId.get(id)).filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate)).slice(0, 3),
                reasoning: selection.reasoning,
                roadmap: selection.roadmap.map((item, index) => ({ step: item.step ?? index + 1, title: item.title, why: item.why })),
                source: "gemini",
                cached: false,
            };
        } catch {
            result = fallback(normalized, level, candidates);
        }

        await ResourceRecommendation.findOneAndUpdate({ query: cacheKey }, { result, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, { upsert: true, new: true, setDefaultsOnInsert: true });
        return result;
    },
};
