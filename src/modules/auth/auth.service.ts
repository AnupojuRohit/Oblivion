import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/infrastructure/mongodb/connection";
import { AppError } from "@/lib/errors/app-error";
import { authRepository } from "./auth.repository";
import { createSessionToken, hashSessionToken, sessionExpiry } from "./session";
import type { PublicUser } from "./auth.types";

type SessionContext = {
  userAgent?: string;
  ipAddress?: string;
};

type UserForPublicProfile = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: PublicUser["role"];
  avatarUrl?: string;
};

/**
 * Never return persistence-only fields (such as passwordHash) to API callers.
 * This mapper makes the public shape explicit and consistent across auth flows.
 */
function toPublicUser(user: UserForPublicProfile): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
  };
}

export const authService = {
  async register(
    input: { name: string; email: string; password: string },
    context: SessionContext,
  ) {
    await connectToDatabase();

    const email = input.email.toLowerCase();
    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new AppError(
        "USER_ALREADY_EXISTS",
        "An account with this email already exists",
        409,
      );
    }

    // Hash passwords before persistence; the original password is never stored.
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await authRepository.createUser({
      name: input.name,
      email,
      passwordHash,
    });

    // The browser receives the raw token; the database stores only its hash.
    const token = createSessionToken();
    await authRepository.createSession({
      userId: user._id.toString(),
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiry(),
      ...context,
    });

    return { user: toPublicUser(user), token };
  },

  async login(
    input: { email: string; password: string },
    context: SessionContext,
  ) {
    await connectToDatabase();

    const user = await authRepository.findUserByEmail(
      input.email.toLowerCase(),
    );

    // Use one generic error for an unknown email and a wrong password.
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const token = createSessionToken();
    await authRepository.createSession({
      userId: user._id.toString(),
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiry(),
      ...context,
    });

    return { user: toPublicUser(user), token };
  },

  async getUserByToken(token: string): Promise<PublicUser | null> {
    await connectToDatabase();

    // Hash the cookie token before looking it up; raw session secrets are not
    // persisted in the sessions collection.
    const session = await authRepository.findSession(hashSessionToken(token));
    if (!session) return null;

    const user = await authRepository.findUserById(session.userId.toString());
    if (!user) return null;

    // Session activity is best-effort and should not block authentication.
    void authRepository.touchSession(session._id.toString());

    return toPublicUser(user);
  },

  async logout(token: string): Promise<void> {
    await connectToDatabase();
    await authRepository.deleteSession(hashSessionToken(token));
  },

  async logoutAll(userId: string): Promise<void> {
    await connectToDatabase();
    await authRepository.deleteUserSessions(userId);
  },
};
