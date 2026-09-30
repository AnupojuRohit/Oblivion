export const USER_ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type PublicUser = { id: string; name: string; email: string; role: UserRole; avatarUrl?: string };
