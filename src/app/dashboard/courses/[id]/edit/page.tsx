import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/dashboard/course-editor";
import { CourseStatusActions } from "@/components/dashboard/course-status-actions";
import { ResourceManager } from "@/components/dashboard/resource-manager";
import { requireInstructorPage } from "@/lib/auth/helpers";
import { categoryService } from "@/modules/categories/category.service";
import { courseService } from "@/modules/courses/course.service";
import { resourceService } from "@/modules/resources/resource.service";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireInstructorPage();
  const { id } = await params;

  let course: Awaited<ReturnType<typeof courseService.getForEditor>>;
  try {
    course = await courseService.getForEditor(id, user);
  } catch {
    notFound();
  }

  let categories: Awaited<ReturnType<typeof categoryService.list>> = [];
  let resources: Awaited<ReturnType<typeof resourceService.listForCourse>> = [];

  try {
    const [fetchedCategories, fetchedResources] = await Promise.all([
      categoryService.list(),
      resourceService.listForCourse(course._id.toString(), user),
    ]);
    categories = fetchedCategories;
    resources = fetchedResources;
  } catch {
    /* database unavailable */
  }

  const safeCourse = {
    ...course,
    _id: course._id.toString(),
    categoryId: course.categoryId.toString(),
    sections: [],
  };

  const safeResources = resources.map((resource) => ({
    _id: resource._id.toString(),
    name: resource.name,
    lessonId: resource.lessonId ? resource.lessonId.toString() : undefined,
    sizeBytes: resource.sizeBytes,
    mimeType: resource.mimeType,
  }));

  return (
    <section className="p-6 md:p-10">
      <p className="font-semibold text-indigo-600 uppercase text-xs tracking-wider">
        {course.status}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit {course.title}</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Update course info, set pricing, and upload videos or course resources.
          </p>
        </div>
        <CourseStatusActions courseId={course._id.toString()} status={course.status} />
      </div>

      <div className="mt-8 grid max-w-5xl gap-7">
        <div className="rounded-xl border bg-[var(--surface)] p-6">
          <h2 className="mb-5 text-xl font-bold">Course details & pricing</h2>
          <CourseEditor
            course={safeCourse}
            categories={categories.map((category) => ({
              _id: category._id.toString(),
              name: category.name,
            }))}
          />
        </div>

        <ResourceManager
          courseId={course._id.toString()}
          resources={safeResources}
        />
      </div>
    </section>
  );
}
