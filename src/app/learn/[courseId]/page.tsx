import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { resourceService } from "@/modules/resources/resource.service";
import { LearningPlayer } from "@/components/learning/learning-player";

function flattenLessons(course: Awaited<ReturnType<typeof courseService.getById>>) {
  const lessons: Array<{ sectionId: string; sectionTitle: string; sectionPosition: number; lessonId: string; lessonTitle: string; lessonPosition: number; type: string; isPreview: boolean; description?: string; videoUrl?: string; content?: string; durationSeconds?: number }> = [];
  for (const section of course.sections) {
    for (const lesson of section.lessons) {
      lessons.push({ sectionId: section.id, sectionTitle: section.title, sectionPosition: section.position, lessonId: lesson.id, lessonTitle: lesson.title, lessonPosition: lesson.position, type: lesson.type, isPreview: lesson.isPreview, description: lesson.description, videoUrl: lesson.videoUrl, content: lesson.content, durationSeconds: lesson.durationSeconds });
    }
  }
  return lessons.sort((a, b) => a.sectionPosition - b.sectionPosition || a.lessonPosition - b.lessonPosition);
}

export default async function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let course;
  try {
    course = await courseService.getById((await params).courseId, user);
  } catch {
    notFound();
  }

  const enrollment = await enrollmentService.getEnrollment(user.id, course.id);
  if (!enrollment && user.role !== "ADMIN" && course.instructorId !== user.id) notFound();

  const resources = await resourceService.listForLearner(course.id, user);
  const lessons = flattenLessons(course);
  const activeLessonId = enrollment?.lastLessonId?.toString() ?? lessons[0]?.lessonId;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-indigo-600">LearnHub learning player</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{course.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{course.lessonCount} lessons · {course.level} · {course.language}</p>
        </div>
        <Link href={`/courses/${course.slug}`} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10">Back to course</Link>
      </div>

      <LearningPlayer
        course={course}
        lessons={lessons}
        resources={resources.map((resource) => ({ id: resource._id.toString(), name: resource.name, lessonId: resource.lessonId.toString(), mimeType: resource.mimeType }))}
        activeLessonId={activeLessonId}
        progress={enrollment?.progressPercent ?? 0}
        lastPositionSeconds={enrollment?.lastPositionSeconds ?? 0}
        completedLessonIds={((enrollment?.completedLessonIds ?? []) as Array<{ toString(): string }>).map((lessonId) => lessonId.toString())}
          certificateDownloadUrl={enrollment?.certificateId ? `/api/courses/${course.id}/certificate` : undefined}
      />
    </section>
  );
}