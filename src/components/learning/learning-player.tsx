"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, PlayCircle, RotateCcw } from "lucide-react";

type LearningLesson = { sectionId: string; sectionTitle: string; sectionPosition: number; lessonId: string; lessonTitle: string; lessonPosition: number; type: string; isPreview: boolean; description?: string; videoUrl?: string; content?: string; durationSeconds?: number };
type LearningCourse = { id: string; title: string; slug: string; level: string; language: string; sections: Array<{ id: string; title: string; position: number; lessons: Array<{ id: string; title: string; position: number; isPreview: boolean; type: string; videoUrl?: string; content?: string; description?: string; durationSeconds?: number }> }> };
type ResourceItem = { id: string; name: string; lessonId: string; mimeType: string };

export function LearningPlayer({ course, lessons, resources, activeLessonId, progress, lastPositionSeconds, completedLessonIds, certificateDownloadUrl }: { course: LearningCourse; lessons: LearningLesson[]; resources: ResourceItem[]; activeLessonId?: string; progress: number; lastPositionSeconds: number; completedLessonIds: string[]; certificateDownloadUrl?: string }) {
  const [selectedLessonId, setSelectedLessonId] = useState(activeLessonId ?? lessons[0]?.lessonId);
  const [localProgress, setLocalProgress] = useState(progress);
  const [saving, startTransition] = useTransition();

  const activeIndex = Math.max(0, lessons.findIndex((lesson) => lesson.lessonId === selectedLessonId));
  const activeLesson = lessons[activeIndex] ?? lessons[0];
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;
  const lessonResources = resources.filter((resource) => resource.lessonId === activeLesson?.lessonId);

  const isCompleted = activeLesson ? completedLessonIds.includes(activeLesson.lessonId) : false;

  const videoEmbedUrl = useMemo(() => {
    const videoUrl = activeLesson?.videoUrl;
    if (!videoUrl) return null;
    const match = videoUrl.match(/[?&]v=([^&]+)/) ?? videoUrl.match(/youtu\.be\/([^?]+)/);
    const videoId = match?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }, [activeLesson?.videoUrl]);

  const updateProgress = async (completed: boolean) => {
    if (!activeLesson) return;
    startTransition(async () => {
      const response = await fetch(`/api/courses/${course.id}/lessons/${activeLesson.lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed, lastPositionSeconds: completed ? 0 : lastPositionSeconds }),
      });
      const json = await response.json();
      if (response.ok && json.success) {
        setLocalProgress(json.data?.enrollment?.progressPercent ?? localProgress);
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border bg-[var(--surface)] p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600"><CheckCircle2 className="size-4" /> Progress</div>
              <p className="mt-1 text-sm text-[var(--muted)]">{Math.round(localProgress)}% complete{isCompleted ? " · lesson completed" : ""}</p>
            </div>
            <div className="text-right text-sm text-[var(--muted)]">Resume at {lastPositionSeconds}s</div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, localProgress))}%` }} /></div>
        </div>

        {certificateDownloadUrl ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Certificate unlocked</p>
                <p className="mt-1">You have completed this course. Download your certificate or verify it publicly.</p>
              </div>
              <a href={certificateDownloadUrl} className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white">Download PDF</a>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border bg-[var(--surface)] p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{activeLesson?.sectionTitle}</p>
              <h2 className="text-2xl font-bold tracking-tight">{activeLesson?.lessonTitle}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{activeLesson?.type === "VIDEO" ? "Video lesson" : "Text lesson"}</p>
            </div>
            <div className="flex gap-2">
              <button disabled={!previousLesson} onClick={() => previousLesson && setSelectedLessonId(previousLesson.lessonId)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"><ChevronLeft className="size-4" /> Previous</button>
              <button disabled={!nextLesson} onClick={() => nextLesson && setSelectedLessonId(nextLesson.lessonId)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next <ChevronRight className="size-4" /></button>
            </div>
          </div>

          {activeLesson?.type === "VIDEO" && videoEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border bg-black">
              <iframe title={activeLesson.lessonTitle} src={videoEmbedUrl} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : (
            <div className="rounded-2xl border bg-background p-5">
              <p className="text-sm leading-7 text-[var(--muted)]">{activeLesson?.content ?? activeLesson?.description ?? "This lesson does not have text content yet."}</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={() => updateProgress(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70" disabled={saving || !activeLesson}>{isCompleted ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />} Mark complete</button>
            <button onClick={() => updateProgress(false)} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold" disabled={saving || !activeLesson}><PlayCircle className="size-4" /> Save watch position</button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-[var(--surface)] p-5">
            <h3 className="text-lg font-semibold">Lesson notes</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{activeLesson?.description ?? "Use the lesson player to follow along and add your own notes here in a future enhancement."}</p>
          </div>

          <div className="rounded-2xl border bg-[var(--surface)] p-5">
            <h3 className="text-lg font-semibold">Resources</h3>
            <div className="mt-3 space-y-3">
              {lessonResources.length ? lessonResources.map((resource) => (
                <button key={resource.id} type="button" onClick={async () => { const response = await fetch(`/api/resources/${resource.id}/download`); const json = await response.json(); if (json.success) window.open(json.data.url, "_blank", "noopener,noreferrer"); }} className="flex w-full items-center justify-between rounded-xl border bg-background px-4 py-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5">
                  <span>{resource.name}</span>
                  <Download className="size-4 text-[var(--muted)]" />
                </button>
              )) : <p className="text-sm text-[var(--muted)]">No resources attached to this lesson yet.</p>}
            </div>
          </div>
        </div>
      </div>

      <aside className="rounded-2xl border bg-[var(--surface)] p-4 shadow-sm md:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Curriculum</h2>
          <p className="text-sm text-[var(--muted)]">Jump between lessons and track your progress.</p>
        </div>

        <div className="space-y-4">
          {course.sections.map((section) => (
            <div key={section.id} className="rounded-xl border bg-background p-3">
              <h3 className="text-sm font-semibold">{section.position}. {section.title}</h3>
              <div className="mt-3 space-y-2">
                {section.lessons.map((lesson) => {
                  const completed = completedLessonIds.includes(lesson.id);
                  const selected = lesson.id === selectedLessonId;
                  return (
                    <button key={lesson.id} type="button" onClick={() => setSelectedLessonId(lesson.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${selected ? "bg-indigo-600 text-white" : "hover:bg-black/5 dark:hover:bg-white/5"}`}>
                      <span className="line-clamp-1 flex items-center gap-2"><span className="text-xs opacity-80">{lesson.position}.</span>{lesson.title}{lesson.isPreview ? <span className="text-xs opacity-70">Preview</span> : null}</span>
                      {completed ? <CheckCircle2 className="size-4 shrink-0" /> : <span className="text-xs opacity-70">{lesson.type}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}