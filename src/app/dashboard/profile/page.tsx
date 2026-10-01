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
        {user.role === "STUDENT" ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            Instructor accounts are upgraded by an admin after you apply through Become Instructor.
          </p>
        ) : null}
      </div>
    </section>
  );
}
