import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { selectWithGemini } from "@/infrastructure/gemini/gemini.client";
import { searchYoutube } from "@/infrastructure/youtube/youtube.client";
import { ResourceRecommendation } from "./recommendation.model";
import { normalizeQuery, scoreCandidates } from "./ranking";
import type { FinderResult } from "./finder.types";

const fallback = (
  query: string,
  level: FinderResult["level"],
  candidates: FinderResult["alternatives"][number][],
): FinderResult => ({
  query,
  level,
  best: candidates[0],
  alternatives: candidates.slice(1, 5),
  reasoning: "Gemini selection was unavailable, so results were ranked using query relevance, educational signals, engagement, recency, duration, and level fit.",
  roadmap: [
    { step: 1, title: "Build a mental model of " + query, why: "Learn the terminology, core concepts, and prerequisites first." },
    { step: 2, title: "Follow a practical " + query + " tutorial", why: "Use the selected resource to build or practice something real." },
    { step: 3, title: "Solve a small problem", why: "Apply the concept without copying the tutorial." },
  ],
  source: "deterministic",
  cached: false,
});

const getCacheKey = (query: string, level?: FinderResult["level"]) =>
  query.toLowerCase() + "::" + (level ?? "ANY");

export const finderService = {
  async search(query: string, level?: FinderResult["level"]): Promise<FinderResult> {
    await connectToDatabase();
    const normalized = normalizeQuery(query);
    const cacheKey = getCacheKey(normalized, level);

    const cached = await ResourceRecommendation.findOne({ query: cacheKey }).lean();
    if (cached?.result) return { ...(cached.result as FinderResult), cached: true };

    const rawCandidates = await searchYoutube(normalized, level);
    const candidates = scoreCandidates(normalized, rawCandidates, level).slice(0, 16);

    if (!candidates.length) {
      throw new AppError(
        "RESOURCE_NOT_FOUND",
        "No learning resources were found for \"" + normalized + "\". Try a broader topic or different wording.",
        404,
      );
    }

    let result: FinderResult;

    try {
      const selection = await selectWithGemini(normalized, candidates, level);
      const byId = new Map(candidates.map((candidate) => [candidate.videoId, candidate]));
      const best = byId.get(selection.selectedVideoId);

      if (!best) throw new Error("Selected candidate missing");

      const alternatives = selection.alternativeVideoIds
        .filter((id) => id !== best.videoId)
        .map((id) => byId.get(id))
        .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
        .slice(0, 4);

      result = {
        query: normalized,
        level,
        best,
        alternatives,
        reasoning: selection.reasoning,
        roadmap: selection.roadmap.map((item, index) => ({
          step: item.step ?? index + 1,
          title: item.title,
          why: item.why,
        })),
        source: "gemini",
        cached: false,
      };
    } catch {
      result = fallback(normalized, level, candidates);
    }

    await ResourceRecommendation.findOneAndUpdate(
      { query: cacheKey },
      { result, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return result;
  },
};
