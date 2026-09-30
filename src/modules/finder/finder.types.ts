export type VideoCandidate = { videoId: string; title: string; description: string; channelName: string; channelId: string; thumbnailUrl: string; publishedAt: string; viewCount: number; likeCount: number; commentCount: number; duration?: string; score: number; videoUrl: string };

export type FinderRoadmapStep = { step: number; title: string; why: string };

export type FinderResult = { query: string; level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"; best: VideoCandidate; alternatives: VideoCandidate[]; reasoning: string; roadmap: FinderRoadmapStep[]; source: "gemini" | "deterministic"; cached: boolean };
