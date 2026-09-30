"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ReviewFormProps = { courseId: string; existingReview?: { id: string; rating: number; comment: string } | null };

export function ReviewForm({ courseId, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(existingReview);

  const canSubmit = useMemo(() => comment.trim().length > 0, [comment]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const response = await fetch(isEditing ? `/api/reviews/${existingReview!.id}` : `/api/courses/${courseId}/reviews`, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const json = await response.json();
      if (response.ok && json.success) {
        setMessage(isEditing ? "Review updated" : "Review submitted");
        router.refresh();
      } else {
        setMessage(json?.error?.message ?? "Could not save review");
      }
    });
  };

  const remove = () => {
    if (!existingReview) return;
    startTransition(async () => {
      const response = await fetch(`/api/reviews/${existingReview.id}`, { method: "DELETE" });
      const json = await response.json();
      if (response.ok && json.success) {
        setMessage("Review deleted");
        router.refresh();
      } else {
        setMessage(json?.error?.message ?? "Could not delete review");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-background p-5">
      <div>
        <label className="text-sm font-medium">Rating</label>
        <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm">
          {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Comment</label>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm" placeholder="Share what you learned..." />
      </div>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={!canSubmit || isPending} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isEditing ? "Update review" : "Submit review"}</button>
        {existingReview ? <button type="button" onClick={remove} disabled={isPending} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Delete</button> : null}
      </div>
    </form>
  );
}