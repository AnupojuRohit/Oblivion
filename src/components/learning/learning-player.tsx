"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileVideo, FileText, PlayCircle, RotateCcw } from "lucide-react";

type LearningLesson = {
  sectionId: string;
  sectionTitle: string;
  sectionPosition: number;
  lessonId: string;
  lessonTitle: string;
  lessonPosition: number;
  type: string;
  isPreview: boolean;
  description?: string;
  videoUrl?: string;
  content?: string;
  durationSeconds?: number;
};

type LearningCourse = {
  id: string;
  title: string;
  slug: string;
  level: string;
  language: string;
  sections: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{
      id: string;
      title: string;
      position: number;
      isPreview: boolean;
      type: string;
      videoUrl?: string;
      content?: string;
      description?: string;
      durationSeconds?: number;
    }>;
  }>;
};

type ResourceItem = {
  id: string;
  name: string;
  lessonId?: string;
  mimeType?: string;
  fileUrl?: string;
};

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: { Player: new (id: HTMLElement | string, options: any) => any; PlayerState: any };
  }
}

let ytPromise: Promise<void> | null = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(s);
  });
  return ytPromise;
}

function videoIdFromUrl(url?: string) {
  if (!url) return null;
  return url.match(/[?&]v=([^&]+)/)?.[1] ?? url.match(/youtu\.be\/([^?]+)/)?.[1] ?? null;
}

function isVideoResource(name: string, mime?: string) {
  return mime?.startsWith("video/") || /\.(mp4|webm|mov|mkv|avi)$/i.test(name);
}

export function LearningPlayer({
  course,
  lessons = [],
  resources = [],
  activeLessonId,
  progress,
  lastPositionSeconds,
  completedLessonIds,
  certificateDownloadUrl,
}: {
  course: LearningCourse;
  lessons: LearningLesson[];
  resources: ResourceItem[];
  activeLessonId?: string;
  progress: number;
  lastPositionSeconds: number;
  completedLessonIds: string[];
  certificateDownloadUrl?: string;
}) {
  const [selectedLessonId, setSelectedLessonId] = useState(activeLessonId ?? lessons[0]?.lessonId);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    resources.find((r) => isVideoResource(r.name, r.mimeType))?.id ?? resources[0]?.id ?? null
  );
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [activeMediaResourceId, setActiveMediaResourceId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [localProgress, setLocalProgress] = useState(progress);
  const [saving, startTransition] = useTransition();
  const [playerReady, setPlayerReady] = useState(false);
  const playerHost = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);

  const activeIndex = Math.max(0, lessons.findIndex((l) => l.lessonId === selectedLessonId));
  const activeLesson = lessons[activeIndex] ?? lessons[0];
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  const currentResource = resources.find((r) => r.id === selectedResourceId);

  const lessonResources = useMemo(() => {
    if (!activeLesson) return resources;
    return resources.filter((r) => !r.lessonId || r.lessonId === activeLesson.lessonId);
  }, [resources, activeLesson]);

  const isCompleted = activeLesson ? completedLessonIds.includes(activeLesson.lessonId) : false;
  const videoId = useMemo(() => videoIdFromUrl(activeLesson?.videoUrl), [activeLesson?.videoUrl]);

  // Load resource playback URL when selecting a resource
  useEffect(() => {
    if (!currentResource) return;
    let active = true;
    void fetch(`/api/resources/${currentResource.id}/download?inline=true`, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load this uploaded video.");
        return res.json();
      })
      .then((json) => {
        if (active && json.success && json.data?.url) {
          setActiveMediaUrl(json.data.url);
          setActiveMediaResourceId(currentResource.id);
          setMediaError(null);
        } else if (active) {
          setMediaError("Unable to load this uploaded video.");
        }
      })
      .catch(() => {
        if (active) setMediaError("Unable to load this uploaded video.");
      });
    return () => {
      active = false;
    };
  }, [currentResource]);

  // YouTube player initialization if lesson has YouTube URL
  useEffect(() => {
    let cancelled = false;
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
    if (!videoId || !playerHost.current) return;
    void loadYouTubeApi().then(() => {
      if (cancelled || !playerHost.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(playerHost.current, {
        videoId,
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            if (!cancelled) setPlayerReady(true);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const updateProgress = async (completed: boolean) => {
    if (!activeLesson) return;
    startTransition(async () => {
      const position =
        !completed && playerRef.current?.getCurrentTime
          ? Math.floor(playerRef.current.getCurrentTime())
          : 0;
      const response = await fetch(
        `/api/courses/${course.id}/lessons/${activeLesson.lessonId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ completed, lastPositionSeconds: position }),
        }
      );
      const json = await response.json();
      if (response.ok && json.success) {
        setLocalProgress(json.data?.enrollment?.progressPercent ?? localProgress);
      }
    });
  };

  const downloadResource = async (id: string) => {
    const res = await fetch(`/api/resources/${id}/download`, { credentials: "same-origin" });
    const json = await res.json();
    if (json?.success && json?.data?.url) {
      window.open(json.data.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="rounded-2xl border bg-[var(--surface)] p-4 shadow-sm md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <CheckCircle2 className="size-4" />
                Progress
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {Math.round(localProgress)}% complete
                {isCompleted ? " · completed" : ""}
              </p>
            </div>
            {lastPositionSeconds > 0 && (
              <div className="text-right text-sm text-[var(--muted)]">
                Saved position {lastPositionSeconds}s
              </div>
            )}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, localProgress))}%` }}
            />
          </div>
        </div>

        {certificateDownloadUrl && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Certificate unlocked</p>
                <p className="mt-1">
                  You have completed this course. Download your certificate or verify it publicly.
                </p>
              </div>
              <a
                href={certificateDownloadUrl}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white"
              >
                Download PDF
              </a>
            </div>
          </div>
        )}

        {/* Video Player or Lesson Content */}
        <div className="rounded-2xl border bg-[var(--surface)] p-4 shadow-sm md:p-6">
          {activeLesson ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {activeLesson?.sectionTitle}
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">{activeLesson?.lessonTitle}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {activeLesson?.type === "VIDEO" ? "Video lesson" : "Text lesson"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!previousLesson}
                    onClick={() => previousLesson && setSelectedLessonId(previousLesson.lessonId)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </button>
                  <button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && setSelectedLessonId(nextLesson.lessonId)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {activeLesson?.type === "VIDEO" && videoId ? (
                <div className="overflow-hidden rounded-2xl border bg-black">
                  <div ref={playerHost} className="aspect-video w-full" />
                  {!playerReady && (
                    <p className="px-3 py-2 text-xs text-white/70">Loading YouTube player…</p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border bg-background p-5">
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    {activeLesson?.content ??
                      activeLesson?.description ??
                      "Follow along with this lesson's resources below."}
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => updateProgress(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
                  disabled={saving || !activeLesson}
                >
                  {isCompleted ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
                  {isCompleted ? "Mark incomplete" : "Mark complete"}
                </button>
                <button
                  onClick={() => updateProgress(false)}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold"
                  disabled={saving || !activeLesson || !videoId}
                >
                  <PlayCircle className="size-4" />
                  Save watch position
                </button>
              </div>
            </>
          ) : (
            /* Direct Course Resource Mode (No Curriculum) */
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  {currentResource?.name ?? course.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {currentResource && isVideoResource(currentResource.name, currentResource.mimeType)
                    ? "Course Video Player"
                    : "Course Materials & Player"}
                </p>
              </div>

              {currentResource &&
              isVideoResource(currentResource.name, currentResource.mimeType) &&
              activeMediaResourceId === currentResource.id &&
              activeMediaUrl ? (
                <div className="overflow-hidden rounded-2xl border bg-black">
                  <video
                    key={activeMediaUrl}
                    src={activeMediaUrl}
                    controls
                    className="aspect-video w-full"
                    playsInline
                    onError={() => setMediaError("This video could not be played. Check that the uploaded file is a supported video format.")}
                  />
                  {mediaError && <p className="px-3 py-2 text-xs text-red-300">{mediaError}</p>}
                </div>
              ) : (
                <div className="rounded-2xl border bg-background p-6">
                  <p className="text-base font-semibold">{course.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Select a course video or material from the resources panel to view or download.
                  </p>
                  {currentResource && (
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => downloadResource(currentResource.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        <Download className="size-4" />
                        Download {currentResource.name}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Resources list under player */}
        <div className="rounded-2xl border bg-[var(--surface)] p-5">
          <h3 className="text-lg font-semibold">Course resources & files</h3>
          <div className="mt-3 space-y-3">
            {lessonResources.length ? (
              lessonResources.map((r) => (
                <div
                  key={r.id}
                  className="flex w-full items-center justify-between rounded-xl border bg-background px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isVideoResource(r.name, r.mimeType) ? (
                      <FileVideo className="size-4 text-indigo-600 shrink-0" />
                    ) : (
                      <FileText className="size-4 text-[var(--muted)] shrink-0" />
                    )}
                    <span className="truncate font-medium">{r.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadResource(r.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline shrink-0"
                  >
                    <Download className="size-3.5" />
                    Download
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No resources attached to this course yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Aside: Curriculum if present, or Resource List if curriculum was removed */}
      <aside className="rounded-2xl border bg-[var(--surface)] p-4 shadow-sm md:p-5">
        {course.sections.length > 0 ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Curriculum</h2>
              <p className="text-sm text-[var(--muted)]">Jump between lessons and track your progress.</p>
            </div>
            <div className="space-y-4">
              {course.sections.map((s) => (
                <div key={s.id} className="rounded-xl border bg-background p-3">
                  <h3 className="text-sm font-semibold">
                    {s.position}. {s.title}
                  </h3>
                  <div className="mt-3 space-y-2">
                    {s.lessons.map((l) => {
                      const completed = completedLessonIds.includes(l.id);
                      const selected = l.id === selectedLessonId;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedLessonId(l.id)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "bg-indigo-600 text-white"
                              : "hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="line-clamp-1 flex items-center gap-2">
                            <span className="text-xs opacity-80">{l.position}.</span>
                            {l.title}
                            {l.isPreview && <span className="text-xs opacity-70">Preview</span>}
                          </span>
                          {completed ? (
                            <CheckCircle2 className="size-4 shrink-0" />
                          ) : (
                            <span className="text-xs opacity-70">{l.type}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Course materials & videos</h2>
              <p className="text-sm text-[var(--muted)]">
                Watch uploaded videos and access files.
              </p>
            </div>
            <div className="space-y-2">
              {resources.length ? (
                resources.map((r) => {
                  const isVid = isVideoResource(r.name, r.mimeType);
                  const selected = r.id === selectedResourceId;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedResourceId(r.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm transition ${
                        selected
                          ? "border-indigo-600 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "border-[var(--border)] bg-background hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isVid ? (
                          <FileVideo className="size-4 shrink-0 text-indigo-600" />
                        ) : (
                          <FileText className="size-4 shrink-0 text-[var(--muted)]" />
                        )}
                        <span className="truncate font-medium">{r.name}</span>
                      </div>
                      <span className="text-xs text-[var(--muted)] shrink-0">
                        {isVid ? "Watch" : "File"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--muted)] p-3">No course files uploaded yet.</p>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}