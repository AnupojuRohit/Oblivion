import Link from "next/link";
import { BookOpen, PlayCircle, PlusCircle, Sparkles, Video } from "lucide-react";
import { requireUserPage } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";

export default async function DashboardPage() {
  const user = await requireUserPage();

  let enrollments: Awaited<ReturnType<typeof enrollmentService.getForUser>> = [];
  let uploadedCourses: Awaited<ReturnType<typeof courseService.listForInstructor>> = [];

  try {
    const [fetchedEnrollments, fetchedCourses] = await Promise.all([
      enrollmentService.getForUser(user.id),
      courseService.listForInstructor(user),
    ]);
    enrollments = fetchedEnrollments;
    uploadedCourses = fetchedCourses;
  } catch {
    /* database unavailable */
  }

  return (
    <section className="p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">MVP Workspace</p>
          <h1 className="mt-1 text-3xl font-bold">Welcome, {user.name}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Upload and share your own courses, or watch and learn from the catalogue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/courses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <PlusCircle className="size-4" />
            Upload course
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <BookOpen className="size-4" />
            Browse courses
          </Link>
        </div>
      </div>

      {/* Metrics overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Enrolled Courses</span>
            <PlayCircle className="size-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold">{enrollments.length}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Courses you are currently learning</p>
        </div>

        <div className="rounded-xl border bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">Uploaded Courses</span>
            <Video className="size-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-bold">{uploadedCourses.length}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Courses you have created and shared</p>
        </div>

        <div className="rounded-xl border bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-[var(--muted)]">AI Discovery</span>
            <Sparkles className="size-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-lg font-bold">Smart Finder</p>
          <Link href="/finder" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
            Search YouTube resources &rarr;
          </Link>
        </div>
      </div>

      {/* Section 1: Enrolled Courses (Watch course) */}
      <div className="rounded-xl border bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-bold">My learning & enrollments</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Watch videos and lessons from enrolled courses</p>
          </div>
          <Link href="/courses" className="text-xs font-semibold text-indigo-600 hover:underline">
            Find more courses &rarr;
          </Link>
        </div>

        {enrollments.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {enrollments.map((enrollment) => {
              const course = enrollment.courseId as {
                _id?: { toString(): string };
                title?: string;
                slug?: string;
                level?: string;
              } | null;
              const courseId = course?._id?.toString();
              const title = course?.title ?? "Course";

              return (
                <div
                  key={String(enrollment._id)}
                  className="flex flex-col justify-between rounded-lg border bg-background p-4 hover:border-indigo-500/50 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-indigo-600">{course?.level ?? "COURSE"}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {enrollment.progressPercent ?? 0}% completed
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold">{title}</h3>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t">
                    {course?.slug && (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="text-xs text-[var(--muted)] hover:text-[var(--fg)]"
                      >
                        Course overview
                      </Link>
                    )}
                    {courseId ? (
                      <Link
                        href={`/learn/${courseId}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        <PlayCircle className="size-3.5" />
                        Watch course
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <PlayCircle className="mx-auto size-10 text-[var(--muted)] opacity-60" />
            <p className="mt-3 text-sm font-medium">You haven&apos;t enrolled in any courses yet.</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Browse our catalogue and register for courses for free or paid.</p>
            <Link
              href="/courses"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Browse courses catalogue
            </Link>
          </div>
        )}
      </div>

      {/* Section 2: Uploaded Courses (Upload & Manage) */}
      <div className="rounded-xl border bg-[var(--surface)] p-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-bold">My uploaded courses</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Courses you uploaded to the platform</p>
          </div>
          <Link
            href="/dashboard/courses/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
          >
            <PlusCircle className="size-3.5" />
            Upload new course
          </Link>
        </div>

        {uploadedCourses.length ? (
          <div className="mt-4 divide-y">
            {uploadedCourses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{course.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        course.status === "PUBLISHED"
                          ? "bg-green-500/10 text-green-700 dark:text-green-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {course.lessonCount} lessons · {course.enrollmentCount} learners registered · Price:{" "}
                    {course.price === 0 ? "Free" : `₹${course.price}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/learn/${course.id}`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <PlayCircle className="size-3.5" />
                    Preview player
                  </Link>
                  <Link
                    href={`/dashboard/courses/${course.id}/edit`}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Edit & lessons
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Video className="mx-auto size-10 text-[var(--muted)] opacity-60" />
            <p className="mt-3 text-sm font-medium">You haven&apos;t uploaded any courses yet.</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Anyone can upload and publish courses with lessons and videos.</p>
            <Link
              href="/dashboard/courses/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <PlusCircle className="size-4" />
              Upload your first course
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
