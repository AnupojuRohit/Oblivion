import { CourseCard } from "@/components/courses/course-card";
import { courseService } from "@/modules/courses/course.service";
import { listQuerySchema } from "@/modules/courses/course.schema";
import { Search } from "lucide-react";

export const metadata = {
  title: "Courses",
  description: "Explore practical courses on LearnHub.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = listQuerySchema.parse(
    Object.fromEntries(
      Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
    ),
  );

  let result: Awaited<ReturnType<typeof courseService.list>> | null = null;
  let unavailable = false;

  try {
    result = await courseService.list(query);
  } catch {
    unavailable = true;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-semibold text-indigo-600">COURSE CATALOGUE</p>
      <h1 className="mt-2 text-4xl font-bold">Explore your next skill</h1>

      <form className="mt-8 flex max-w-2xl gap-2" action="/courses">
        <label className="sr-only" htmlFor="search">Search courses</label>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-[var(--muted)]" />
          <input
            id="search"
            name="q"
            defaultValue={query.q}
            placeholder="Search React, Docker, Python…"
            className="w-full rounded-lg border bg-[var(--surface)] py-2.5 pl-9 pr-3"
          />
        </div>
        <button className="rounded-lg bg-indigo-600 px-5 font-medium text-white">Search</button>
      </form>

      {unavailable ? (
        <p className="mt-12 rounded-lg border p-6 text-[var(--muted)]">
          Course catalogue is temporarily unavailable. Configure MongoDB to load published courses.
        </p>
      ) : result?.courses.length ? (
        <>
          <p className="mt-8 text-sm text-[var(--muted)]">{result.pagination.total} courses found</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-12 rounded-lg border p-6 text-[var(--muted)]">
          No published courses match your search yet.
        </p>
      )}
    </section>
  );
}
