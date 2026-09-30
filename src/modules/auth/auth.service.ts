import bcrypt from "bcryptjs";
import { AppError } from "@/lib/errors/app-error";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { authRepository } from "./auth.repository";
import { createSessionToken, hashSessionToken, sessionExpiry } from "./session";
import type { PublicUser } from "./auth.types";
const publicUser = (user: { _id: { toString(): string }; name: string; email: string; role: PublicUser["role"]; avatarUrl?: string }): PublicUser => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}) });
type SessionContext = { userAgent?: string; ipAddress?: string };
export const authService = {
  async register(input: { name: string; email: string; password: string }, context: SessionContext) { await connectToDatabase(); const email = input.email.toLowerCase(); if (await authRepository.findUserByEmail(email)) throw new AppError("USER_ALREADY_EXISTS", "An account with this email already exists", 409); const user = await authRepository.createUser({ name: input.name, email, passwordHash: await bcrypt.hash(input.password, 12) }); const token = createSessionToken(); await authRepository.createSession({ userId: user._id.toString(), tokenHash: hashSessionToken(token), expiresAt: sessionExpiry(), ...context }); return { user: publicUser(user), token }; },
  async login(input: { email: string; password: string }, context: SessionContext) { await connectToDatabase(); const user = await authRepository.findUserByEmail(input.email.toLowerCase()); if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401); const token = createSessionToken(); await authRepository.createSession({ userId: user._id.toString(), tokenHash: hashSessionToken(token), expiresAt: sessionExpiry(), ...context }); return { user: publicUser(user), token }; },
  async getUserByToken(token: string) { await connectToDatabase(); const session = await authRepository.findSession(hashSessionToken(token)); if (!session) return null; const user = await authRepository.findUserById(session.userId.toString()); if (!user) return null; void authRepository.touchSession(session._id.toString()); return publicUser(user); },
  async logout(token: string) { await connectToDatabase(); await authRepository.deleteSession(hashSessionToken(token)); },
  async logoutAll(userId: string) { await connectToDatabase(); await authRepository.deleteUserSessions(userId); },
};
