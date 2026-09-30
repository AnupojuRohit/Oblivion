import { describe, expect, it } from "vitest";
import { registrationSchema } from "./auth.schema";
describe("registrationSchema", () => { it("accepts a password with letters and numbers", () => expect(registrationSchema.safeParse({ name: "Ada Lovelace", email: "ada@example.com", password: "Password123" }).success).toBe(true)); it("rejects a password without a number", () => expect(registrationSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "passwordonly" }).success).toBe(false)); });
