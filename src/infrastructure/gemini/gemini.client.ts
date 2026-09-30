import { GoogleGenAI } from "@google/genai";
import { requireFinderEnv } from "@/lib/env";
import { geminiSelectionSchema } from "@/modules/finder/finder.schema";
import type { VideoCandidate } from "@/modules/finder/finder.types";

export async function selectWithGemini(query: string, candidates: VideoCandidate[]) {
	const config = requireFinderEnv();
	const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
	const compact = candidates.map(({ videoId, title, channelName, description, score }) => ({ videoId, title, channelName, description: description.slice(0, 300), deterministicScore: score }));

	const response = await ai.models.generateContent({ model: config.geminiModel, contents: `Choose the best learning video for the query "${query}" only from these verified YouTube candidates. Return JSON with selectedVideoId, alternativeVideoIds (up to 3), reasoning, and roadmap as objects with step, title, and why. Never create an ID. Candidates: ${JSON.stringify(compact)}`, config: { responseMimeType: "application/json" } });

	const parsed = geminiSelectionSchema.parse(JSON.parse(response.text ?? "{}"));
	const knownIds = new Set(candidates.map((candidate) => candidate.videoId));

	if (!knownIds.has(parsed.selectedVideoId) || parsed.alternativeVideoIds.some((id) => !knownIds.has(id))) throw new Error("Gemini returned an unverified video ID");

	return parsed;
}
