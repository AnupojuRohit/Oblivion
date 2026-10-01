import Link from "next/link";
import { ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    return (
      <section className="p-6 md:p-10">
        <p className="font-semibold text-indigo-600">STUDENT DASHBOARD</p>
        <div className="mt-2">
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="mt-2 text-[var(--muted)]">
            Continue learning, discover resources, and explore courses.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/courses" className="group rounded-2xl border bg-[var(--surface)] p-6 transition hover:border-indigo-500/40 hover:shadow-sm">
            <BookOpen className="size-5 text-indigo-600" />
            <h2 className="mt-4 font-semibold">My Courses</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Browse and continue your learning.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium">Open <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>

          <Link href="/finder" className="group rounded-2xl border bg-[var(--surface)] p-6 transition hover:border-indigo-500/40 hover:shadow-sm">
            <Sparkles className="size-5 text-indigo-600" />
            <h2 className="mt-4 font-semibold">AI Finder</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Find learning resources for any topic.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium">Open <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>

          <Link href="/courses" className="group rounded-2xl border bg-[var(--surface)] p-6 transition hover:border-indigo-500/40 hover:shadow-sm">
            <Search className="size-5 text-indigo-600" />
            <h2 className="mt-4 font-semibold">Explore Courses</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Search the course catalogue.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium">Browse <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </Link>
        </div>
      </section>
    );
  }

  let analytics: Awaited<ReturnType<typeof courseService.instructorAnalytics>> | null = null;
  try {
    analytics = await courseService.instructorAnalytics(user);
  } catch {
    analytics = null;
  }

  if (!analytics) {
    return (
      <section className="p-6 md:p-10">
        <p className="font-semibold text-indigo-600">INSTRUCTOR WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome back, {user.name}</h1>
        <p className="mt-4 rounded-lg border p-5 text-[var(--muted)]">
          Course analytics are unavailable until MongoDB is connected.
        </p>
      </section>
    );
  }

  return (
    <section className="p-6 md:p-10">
      <p className="font-semibold text-indigo-600">INSTRUCTOR WORKSPACE</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="mt-1 text-[var(--muted)]">A snapshot of your teaching activity.</p>
        </div>
        <Link href="/dashboard/courses/new" className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white">
          Create course
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Courses", analytics.courseCount],
          ["Learners", analytics.enrollments],
          ["Average rating", analytics.averageRating.toFixed(1)],
          ["Estimated gross", new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(analytics.estimatedGross)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border bg-[var(--surface)] p-5">
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-9 rounded-xl border bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent courses</h2>
          <Link href="/dashboard/courses" className="text-sm font-medium text-indigo-600">View all</Link>
        </div>
        {analytics.courses.length ? (
          <div className="mt-4 divide-y">
            {analytics.courses.slice(0, 5).map((course) => (
              <Link href={`/dashboard/courses/${course.id}/edit`} key={course.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium">{course.title}</span>
                <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-700 dark:text-indigo-300">{course.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">Create your first course to begin building your catalogue.</p>
        )}
      </div>
    </section>
  );
}
