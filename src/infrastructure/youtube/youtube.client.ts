import { requireFinderEnv } from "@/lib/env";
import type { VideoCandidate } from "@/modules/finder/finder.types";

type SearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
  };
};

type VideoItem = {
  id?: string;
  snippet?: SearchItem["snippet"];
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  contentDetails?: { duration?: string };
};

const SEARCH_QUERIES = (query: string, level?: string) => {
  const levelHint =
    level === "BEGINNER"
      ? "beginner fundamentals tutorial course"
      : level === "INTERMEDIATE"
        ? "intermediate tutorial deep dive project"
        : level === "ADVANCED"
          ? "advanced deep dive internals architecture"
          : "tutorial course guide";
  return [query, query + " " + levelHint, query + " explained"];
};

const FETCH_TIMEOUT_MS = 8_000;

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
};

export async function searchYoutube(query: string, level?: string): Promise<VideoCandidate[]> {
  const key = requireFinderEnv().youtubeApiKey;
  const searchResults = new Map<string, SearchItem["snippet"]>();

  const queries = SEARCH_QUERIES(query, level);

  await Promise.all(queries.map(async (q) => {
    const search = new URL("https://www.googleapis.com/youtube/v3/search");
    search.search = new URLSearchParams({
      key,
      part: "snippet",
      q,
      type: "video",
      maxResults: "25",
      relevanceLanguage: "en",
      safeSearch: "strict",
      videoEmbeddable: "true",
    }).toString();

    const response = await fetchWithTimeout(search, { cache: "no-store" });
    if (!response.ok) throw new Error("YouTube search request failed");

    const json = (await response.json()) as { items?: SearchItem[] };
    for (const item of json.items ?? []) {
      const id = item.id?.videoId;
      if (id && item.snippet) searchResults.set(id, item.snippet);
    }
  }));

  const ids = [...searchResults.keys()].slice(0, 50);
  if (!ids.length) return [];

  const videos: VideoCandidate[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videosUrl.search = new URLSearchParams({
      key,
      part: "snippet,statistics,contentDetails",
      id: batch.join(","),
    }).toString();

    const response = await fetchWithTimeout(videosUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("YouTube video statistics request failed");

    const json = (await response.json()) as { items?: VideoItem[] };
    for (const item of json.items ?? []) {
      if (!item.id || !item.snippet) continue;
      videos.push({
        videoId: item.id,
        title: item.snippet.title ?? "Untitled video",
        description: item.snippet.description ?? "",
        channelName: item.snippet.channelTitle ?? "Unknown channel",
        channelId: item.snippet.channelId ?? "",
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ??
          item.snippet.thumbnails?.medium?.url ??
          "",
        publishedAt: item.snippet.publishedAt ?? new Date().toISOString(),
        viewCount: Number(item.statistics?.viewCount ?? 0),
        likeCount: Number(item.statistics?.likeCount ?? 0),
        commentCount: Number(item.statistics?.commentCount ?? 0),
        duration: item.contentDetails?.duration,
        score: 0,
        videoUrl: "https://www.youtube.com/watch?v=" + item.id,
      });
    }
  }

  return videos;
}
