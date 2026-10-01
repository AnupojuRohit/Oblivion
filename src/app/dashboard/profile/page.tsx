import { requireUser } from "@/lib/auth/helpers";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <section className="p-6 md:p-10">
      <p className="font-semibold text-indigo-600">PROFILE</p>
      <h1 className="mt-2 text-3xl font-bold">Your profile</h1>
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
            <dd className="mt-1 font-medium">{user.role}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
