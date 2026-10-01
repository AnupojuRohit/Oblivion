import Link from "next/link";
import { requireUser } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";

export default async function DashboardCoursesPage() {
  const user = await requireUser();

  if (user.role === "STUDENT") {
    const enrollments = await enrollmentService.getForUser(user.id);
    return (
      <section className="p-6 md:p-10">
        <div><p className="font-semibold text-indigo-600">MY COURSES</p><h1 className="mt-2 text-3xl font-bold">Your learning</h1><p className="mt-1 text-[var(--muted)]">Courses you have enrolled in.</p></div>
        {enrollments.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {enrollments.map((enrollment) => {
              const course = enrollment.courseId as unknown as { _id: { toString(): string }; title: string; slug: string; level: string; language: string };
              if (!course?._id) return null;
              const id = course._id.toString();
              return <Link key={id} href={`/learn/${id}`} className="rounded-xl border bg-[var(--surface)] p-6 transition hover:border-indigo-500/40 hover:shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{course.level} · {course.language}</p><h2 className="mt-2 text-xl font-bold">{course.title}</h2><p className="mt-2 text-sm text-[var(--muted)]">Open the learning player to continue.</p><span className="mt-5 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Continue learning</span></Link>;
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border bg-[var(--surface)] p-6"><p className="text-[var(--muted)]">You have not enrolled in any courses yet.</p><Link href="/courses" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Browse courses</Link></div>
        )}
      </section>
    );
  }

  let courses: Awaited<ReturnType<typeof courseService.listForInstructor>> = [];
  try { courses = await courseService.listForInstructor(user); } catch {}
  return (
    <section className="p-6 md:p-10">
      <div className="flex items-center justify-between"><div><p className="font-semibold text-indigo-600">INSTRUCTOR</p><h1 className="mt-2 text-3xl font-bold">My courses</h1><p className="mt-1 text-[var(--muted)]">Create, edit, and manage publication status.</p></div><Link href="/dashboard/courses/new" className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white">Create course</Link></div>
      <div className="mt-8 overflow-hidden rounded-xl border bg-[var(--surface)]"><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"><span>Course</span><span>Lessons</span><span>Status</span></div>{courses.length ? courses.map((course) => <Link href={`/dashboard/courses/${course.id}/edit`} key={course.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-5 py-4 text-sm last:border-0 hover:bg-black/5 dark:hover:bg-white/5"><span><strong className="block">{course.title}</strong><small className="text-[var(--muted)]">{course.enrollmentCount} learners · {course.ratingAverage.toFixed(1)} rating</small></span><span>{course.lessonCount}</span><span className="rounded-full bg-indigo-500/10 px-2 py-1 text-xs text-indigo-700 dark:text-indigo-300">{course.status}</span></Link>) : <p className="p-6 text-sm text-[var(--muted)]">No courses yet. Create a draft to start building.</p>}</div>
    </section>
  );
}
