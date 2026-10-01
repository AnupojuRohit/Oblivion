import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CheckCircle2, Clock, Lock, PlayCircle, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/helpers";
import { courseService } from "@/modules/courses/course.service";
import { enrollmentService } from "@/modules/enrollments/enrollment.service";
import { reviewService } from "@/modules/reviews/review.service";
import { ReviewForm } from "@/components/courses/review-form";
import { EnrollmentButton } from "@/components/courses/enrollment-button";

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  const { slug } = await params;

  let course;
  try {
    course = await courseService.getBySlug(slug, user);
  } catch {
    notFound();
  }

  const enrolled = Boolean(user && await enrollmentService.hasEnrollment(user.id, course.id));
  const [reviews, myReview] = await Promise.all([
    reviewService.listForCourse(course.id),
    user ? reviewService.getUserReview(course.id, user.id) : Promise.resolve(null),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_0.8fr]">
        <div>
          <p className="font-semibold text-indigo-600">{course.level} · {course.language}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{course.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">{course.description}</p>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-[var(--muted)]">
            <span className="flex items-center gap-1"><BookOpen className="size-4" />{course.lessonCount} lessons</span>
            <span className="flex items-center gap-1"><Clock className="size-4" />Self-paced</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="size-4" />Certificate on completion</span>
          </div>
        </div>

        <aside className="h-fit rounded-xl border bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-2xl font-bold">{course.price === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency: course.currency, maximumFractionDigits: 0 }).format(course.price)}</p>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Course details and preview lessons are available below. Enrollment unlocks the full learning player.</p>
          {enrolled ? (
            <Link href={"/learn/" + course.id} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white"><PlayCircle className="size-4" />Open course player</Link>
          ) : user ? (
            <EnrollmentButton courseId={course.id} price={course.price} />
          ) : (
            <Link href={"/login?next=/courses/" + course.slug} className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white">Sign in to enroll</Link>
          )}
        </aside>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold">Course curriculum</h2>
          <div className="mt-5 divide-y rounded-xl border bg-[var(--surface)]">
            {course.sections.map((section) => (
              <div key={section.id} className="p-5">
                <h3 className="font-semibold">{section.position}. {section.title}</h3>
                {section.description ? <p className="mt-1 text-sm text-[var(--muted)]">{section.description}</p> : null}
                <ul className="mt-4 space-y-3">
                  {section.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between gap-4 rounded-lg border bg-background px-4 py-3 text-sm">
                      <span className="flex items-center gap-2"><span>{lesson.position}.</span>{lesson.title}</span>
                      <span className="inline-flex items-center gap-1 text-[var(--muted)]">{lesson.isPreview ? <PlayCircle className="size-4 text-indigo-600" /> : <Lock className="size-4" />}{lesson.isPreview ? "Preview" : "Locked"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <section className="mt-12 rounded-2xl border bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Reviews</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{course.ratingAverage.toFixed(1)} average · {course.ratingCount} reviews</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-sm font-semibold"><Star className="size-4 fill-amber-400 text-amber-400" /> {course.ratingAverage.toFixed(1)}</div>
            </div>
            <div className="mt-6 space-y-4">
              {reviews.length ? reviews.map((review) => (
                <article key={review._id.toString()} className="rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="font-semibold">{review.userId?.name ?? "Learner"}</p><p className="text-xs text-[var(--muted)]">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(review.createdAt))}</p></div>
                    <div className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">{review.rating}<Star className="size-4 fill-amber-400 text-amber-400" /></div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{review.comment}</p>
                </article>
              )) : <p className="text-sm text-[var(--muted)]">No reviews yet. Be the first to leave one after enrolling.</p>}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {enrolled ? (
            <section className="rounded-2xl border bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold">{myReview ? "Edit your review" : "Write a review"}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Share your experience with future learners.</p>
              <div className="mt-4"><ReviewForm courseId={course.id} existingReview={myReview ? { id: myReview._id.toString(), rating: myReview.rating, comment: myReview.comment } : null} /></div>
            </section>
          ) : (
            <section className="rounded-2xl border bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold">Leave a review</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Enroll in this course to share a review and help other learners decide.</p>
            </section>
          )}
          <section className="rounded-2xl border bg-[var(--surface)] p-6">
            <h2 className="text-lg font-semibold">Course resources</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Enrolled learners can download eligible course resources securely from the learning player.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
