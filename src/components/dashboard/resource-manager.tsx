"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileVideo, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";

export type Resource = {
  _id: string;
  name: string;
  lessonId?: string;
  sizeBytes: number;
  mimeType?: string;
};

const accepted = ".mp4,.webm,.mov,.mkv,.avi,.pdf,.ppt,.pptx,.doc,.docx,.zip,.rar,.tar,.gz,.mp3,.wav,.txt";
const MAX_RESOURCE_BYTES = 1024 * 1024 * 1024; // 1 GB

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isVideo(name: string, mime?: string) {
  return (
    mime?.startsWith("video/") ||
    /\.(mp4|webm|mov|mkv|avi)$/i.test(name)
  );
}

export function ResourceManager({
  courseId,
  resources = [],
}: {
  courseId: string;
  lessons?: Array<{ id: string; title: string }>;
  resources: Resource[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_RESOURCE_BYTES) {
      setIsError(true);
      setMessage("File must be 1 GB or smaller.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setIsError(false);
    setFileName(file.name);
    setMessage(`Uploading ${file.name} (${formatBytes(file.size)})…`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/courses/${courseId}/resources/upload`, {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "Upload failed. Please try again.");
      }

      setIsError(false);
      setMessage(`"${file.name}" uploaded successfully!`);
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      setFileName("");
      event.target.value = "";
    }
  }

  async function remove(resourceId: string) {
    if (!window.confirm("Delete this course resource?")) return;
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error?.message ?? "Could not delete resource");
      }
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Could not delete resource");
    }
  }

  return (
    <section className="rounded-xl border bg-[var(--surface)] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold">Course resources & materials</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Upload course videos, project files, slides, or documents (up to 1 GB per file).
          </p>
        </div>
        <div>
          <label
            className={`inline-flex items-center gap-2 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition ${
              uploading ? "opacity-70 pointer-events-none" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="size-4" />
                Upload file
              </>
            )}
            <input
              className="sr-only"
              type="file"
              accept={accepted}
              disabled={uploading}
              onChange={upload}
            />
          </label>
        </div>
      </div>

      {uploading && (
        <div className="mt-4 rounded-lg bg-indigo-500/10 p-4 border border-indigo-500/20 text-sm">
          <div className="flex items-center gap-2 font-medium text-indigo-700 dark:text-indigo-300">
            <Loader2 className="size-4 animate-spin" />
            Uploading & processing {fileName}…
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">Please keep this page open while the file is uploading.</p>
        </div>
      )}

      {message && !uploading && (
        <div
          role="status"
          className={`mt-4 rounded-lg p-3 text-sm border ${
            isError
              ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300"
              : "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-6 divide-y">
        {resources.length ? (
          resources.map((resource) => (
            <div
              key={resource._id}
              className="flex items-center justify-between gap-4 py-3.5 text-sm first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                  {isVideo(resource.name, resource.mimeType) ? (
                    <FileVideo className="size-5 text-indigo-600" />
                  ) : (
                    <FileText className="size-5 text-[var(--muted)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate text-[var(--fg)]">{resource.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatBytes(resource.sizeBytes)}
                    {isVideo(resource.name, resource.mimeType) ? " · Video" : " · Material"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/resources/${resource._id}/download`, {
                      credentials: "same-origin",
                    });
                    const json = await res.json();
                    if (json?.success && json?.data?.url) {
                      window.open(json.data.url, "_blank", "noopener,noreferrer");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Download className="size-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => remove(resource._id)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-500/20 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <UploadCloud className="mx-auto size-10 text-[var(--muted)] opacity-60" />
            <p className="mt-3 text-sm font-medium">No course resources uploaded yet.</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Upload videos, slides, project files, or PDFs up to 1 GB.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
