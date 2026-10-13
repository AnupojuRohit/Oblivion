import { requireUserPage } from "@/lib/auth/helpers";
import type { UserRole } from "@/modules/auth/auth.types";

function roleLabel(role: UserRole) {
  if (role === "INSTRUCTOR") return "Instructor";
  if (role === "ADMIN") return "Admin";
  return "Student";
}

export default async function ProfilePage() {
  const user = await requireUserPage();

  return (
    <section className="p-6 md:p-10">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="mt-8 max-w-xl rounded-xl border bg-[var(--surface)] p-6">
        <dl className="space-y-5">
          <div>
            <dt className="text-sm text-[var(--muted)]">Name</dt>
            <dd className="mt-1 font-medium">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--muted)]">Email</dt>
            <dd className="mt-1 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--muted)]">Role</dt>
            <dd className="mt-1 font-medium">{roleLabel(user.role)}</dd>
          </div>
        </dl>
        <div className="mt-6 rounded-lg bg-indigo-500/10 p-4 border border-indigo-500/20">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            Open Creator & Learner Access
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            You can browse, enroll, and watch courses, as well as upload and publish your own courses directly.
          </p>
        </div>
      </div>
    </section>
  );
}
