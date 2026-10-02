import { beforeEach, describe, expect, it, vi } from "vitest";
import { finderService } from "./finder.service";

vi.mock("@/infrastructure/mongodb/connection", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/infrastructure/youtube/youtube.client", () => ({ searchYoutube: vi.fn() }));
vi.mock("@/infrastructure/gemini/gemini.client", () => ({ selectWithGemini: vi.fn() }));
vi.mock("./recommendation.model", () => ({ ResourceRecommendation: { findOne: vi.fn(), findOneAndUpdate: vi.fn() } }));

import { searchYoutube } from "@/infrastructure/youtube/youtube.client";
import { selectWithGemini } from "@/infrastructure/gemini/gemini.client";
import { ResourceRecommendation } from "./recommendation.model";

const youtubeMock = vi.mocked(searchYoutube);
const geminiMock = vi.mocked(selectWithGemini);
const recommendationMock = vi.mocked(ResourceRecommendation);

const candidates = [
  { videoId: "a1", title: "Docker for Beginners", description: "Full tutorial", channelName: "Dev Channel", channelId: "c1", thumbnailUrl: "https://example.com/a.jpg", publishedAt: "2025-01-01T00:00:00.000Z", viewCount: 1000, likeCount: 100, commentCount: 10, duration: "PT20M", score: 10, videoUrl: "https://www.youtube.com/watch?v=a1" },
  { videoId: "b2", title: "Docker Crash Course", description: "Course project", channelName: "Dev Channel", channelId: "c2", thumbnailUrl: "https://example.com/b.jpg", publishedAt: "2025-02-01T00:00:00.000Z", viewCount: 800, likeCount: 90, commentCount: 8, duration: "PT35M", score: 9, videoUrl: "https://www.youtube.com/watch?v=b2" },
];

beforeEach(() => {
  vi.clearAllMocks();
  recommendationMock.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as never);
  recommendationMock.findOneAndUpdate.mockResolvedValue(undefined as never);
});

describe("finderService", () => {
  it("falls back to deterministic ranking when Gemini fails", async () => {
    youtubeMock.mockResolvedValue(candidates as never);
    geminiMock.mockRejectedValue(new Error("down"));

    const result = await finderService.search("Docker", "BEGINNER");

    expect(result.source).toBe("deterministic");
    expect(result.best.videoId).toBe("a1");
    expect(result.roadmap.length).toBeGreaterThanOrEqual(3);
    expect(result.level).toBe("BEGINNER");
  });

  it("caches results with the normalized query and level", async () => {
    youtubeMock.mockResolvedValue(candidates as never);
    geminiMock.mockRejectedValue(new Error("down"));

    await finderService.search("  Docker  ", "BEGINNER");

    expect(recommendationMock.findOneAndUpdate).toHaveBeenCalledWith(
      { query: "docker::BEGINNER" },
      expect.objectContaining({ expiresAt: expect.any(Date), result: expect.objectContaining({ query: "Docker", level: "BEGINNER" }) }),
      expect.objectContaining({ upsert: true }),
    );
  });
});