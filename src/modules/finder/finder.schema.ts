import { z } from "zod";

export const finderQuerySchema = z.object({
	query: z.string().trim().min(2, "Enter at least 2 characters").max(120),
	level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
});

export const geminiSelectionSchema = z.object({
	selectedVideoId: z.string().min(1),
	alternativeVideoIds: z.array(z.string()).max(3).default([]),
	reasoning: z.string().trim().min(1).max(600),
	roadmap: z.array(z.object({ step: z.number().int().positive().optional(), title: z.string().trim().min(1).max(180), why: z.string().trim().min(1).max(240) })).min(2).max(6),
});
