import { Session } from "./session.model";
import { User } from "./user.model";
export const authRepository = {
  findUserByEmail: (email: string) => User.findOne({ email }).select("+passwordHash").exec(),
  findUserById: (id: string) => User.findById(id).exec(),
  createUser: (data: { name: string; email: string; passwordHash: string }) => User.create(data),
  createSession: (data: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ipAddress?: string }) => Session.create(data),
  findSession: (tokenHash: string) => Session.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).exec(),
  deleteSession: (tokenHash: string) => Session.deleteOne({ tokenHash }).exec(),
  deleteUserSessions: (userId: string) => Session.deleteMany({ userId }).exec(),
  touchSession: (id: string) => Session.updateOne({ _id: id }, { lastUsedAt: new Date() }).exec(),
};
