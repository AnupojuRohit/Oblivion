import { z } from "zod";

export const reviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "Comment is required").max(2000),
});

export const reviewUpdateSchema = reviewInputSchema;