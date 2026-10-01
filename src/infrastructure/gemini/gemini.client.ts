import { GoogleGenAI } from "@google/genai";
import { requireFinderEnv } from "@/lib/env";
import { geminiSelectionSchema } from "@/modules/finder/finder.schema";
import type { VideoCandidate } from "@/modules/finder/finder.types";

export async function selectWithGemini(
  query: string,
  candidates: VideoCandidate[],
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
) {
  const config = requireFinderEnv();
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

  const compact = candidates.map(
    ({ videoId, title, channelName, description, publishedAt, viewCount, likeCount, commentCount, duration, score }) => ({
      videoId,
      title,
      channelName,
      description: description.slice(0, 700),
      publishedAt,
      viewCount,
      likeCount,
      commentCount,
      duration,
      score,
    }),
  );

  const prompt =
    "You are the recommendation engine for an educational platform.\n" +
    "User query: \"" + query + "\"\n" +
    "Requested level: \"" + (level ?? "ANY") + "\"\n\n" +
    "Select the most useful REAL YouTube learning resources from the candidates. " +
    "Prioritize topic relevance, actual teaching value, level fit, specificity, completeness, and practical usefulness. " +
    "Avoid Shorts, clickbait, reaction content, news, entertainment, and videos that merely mention the topic. " +
    "Prefer strong engagement and recency only after educational fit. " +
    "NEVER invent a video ID; only return IDs present in candidates.\n\n" +
    "Return JSON: { selectedVideoId, alternativeVideoIds, reasoning, roadmap } where roadmap contains 2-6 {step,title,why}.\n\n" +
    "Candidates:\n" + JSON.stringify(compact);

  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parsed = geminiSelectionSchema.parse(JSON.parse(response.text ?? "{}"));
  const knownIds = new Set(candidates.map((candidate) => candidate.videoId));

  if (!knownIds.has(parsed.selectedVideoId) || parsed.alternativeVideoIds.some((id) => !knownIds.has(id))) {
    throw new Error("Gemini returned an unverified video ID");
  }

  return parsed;
}
