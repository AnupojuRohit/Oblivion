import { z } from "zod";
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be 72 characters or fewer").regex(/[A-Za-z]/, "Password must contain a letter").regex(/\d/, "Password must contain a number");
export const registrationSchema = z.object({ name: z.string().trim().min(2, "Name must be at least 2 characters").max(80), email: z.string().trim().email().max(254), password: passwordSchema });
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });
