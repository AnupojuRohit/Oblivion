import Link from "next/link";
import { BookOpen, IndianRupee, Star, Users } from "lucide-react";
import { isInstructorRole, requireUserPage } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";

const metric = (label: string, value: string | number, Icon: typeof BookOpen) => (
  <div className="rounded-xl border bg-[var(--surface)] p-5">
    <Icon className="size-5 text-indigo-600" />
    <p className="mt-4 text-2xl font-bold">{value}</p>
    <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
  </div>
);

export default async function DashboardPage() {
  const user = await requireUserPage();

  if (!isInstructorRole(user.role)) {
    let enrollments: Awaited<ReturnType<typeof enrollmentService.getForUser>> = [];
    try {
      enrollments = await enrollmentService.getForUser(user.id);
    } catch {
      /* database unavailable */
    }

    return (
      <section className="p-6 md:p-10">
        <p className="font-semibold text-indigo-600">LEARNING HUB</p>
        <h1 className="mt-2 text-3xl font-bold">Welcome, {user.name}</h1>
        <p className="mt-1 text-[var(--muted)]">Pick up where you left off or discover something new.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/courses" className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white">Browse courses</Link>
          <Link href="/finder" className="rounded-lg border px-4 py-2.5 font-medium">Open AI Finder</Link>
        </div>
        <div className="mt-9 rounded-xl border bg-[var(--surface)] p-6">
          <h2 className="text-lg font-bold">My enrollments</h2>
          {enrollments.length ? (
            <div className="mt-4 divide-y">
              {enrollments.map((enrollment) => {
                const course = enrollment.courseId as { _id?: { toString(): string }; title?: string; slug?: string } | null;
                const slug = course?.slug;
                const title = course?.title ?? "Course";
                return slug ? (
                  <Link key={String(enrollment._id)} href={"/courses/" + slug} className="block py-3 text-sm font-medium">{title}</Link>
                ) : (
                  <p key={String(enrollment._id)} className="py-3 text-sm">{title}</p>
                );
              })}
            </div>
          ) : <p className="mt-4 text-sm text-[var(--muted)]">You are not enrolled in any courses yet.</p>}
        </div>
      </section>
    );
  }

  let analytics: Awaited<ReturnType<typeof courseService.instructorAnalytics>> | null = null;
  try {
    analytics = await courseService.instructorAnalytics(user);
  } catch {
    /* database unavailable */
  }

  if (!analytics) {
    return (
      <section className="p-6 md:p-10">
        <h1 className="text-3xl font-bold">Instructor dashboard</h1>
        <p className="mt-4 rounded-lg border p-5 text-[var(--muted)]">
          Your dashboard needs a MongoDB connection before it can load course data.
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
        <Link href="/dashboard/courses/new" className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white">Create course</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metric("Courses", analytics.courseCount, BookOpen)}
        {metric("Learners", analytics.enrollments, Users)}
        {metric("Average rating", analytics.averageRating.toFixed(1), Star)}
        {metric("Estimated gross", new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(analytics.estimatedGross), IndianRupee)}
      </div>
      <div className="mt-9 rounded-xl border bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent courses</h2>
          <Link href="/dashboard/courses" className="text-sm font-medium text-indigo-600">View all</Link>
        </div>
        {analytics.courses.length ? (
          <div className="mt-4 divide-y">
            {analytics.courses.slice(0, 5).map((course) => (
              <Link href={"/dashboard/courses/" + course.id + "/edit"} key={course.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium">{course.title}</span>
                <span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-700 dark:text-indigo-300">{course.status}</span>
              </Link>
            ))}
          </div>
        ) : <p className="mt-4 text-sm text-[var(--muted)]">Create your first course to begin building your catalogue.</p>}
      </div>
    </section>
  );
}
