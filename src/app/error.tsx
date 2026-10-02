"use client";

import { useEffect } from "react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the production UI useful without exposing server-side error details.
  }, []);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="label-overline mb-3">Something went wrong</p>
        <h1 className="display-md text-[var(--fg)]">We hit an unexpected error.</h1>
        <p className="mt-4 text-sm text-[var(--fg-tertiary)]">
          Please try again. If the problem continues, come back in a few minutes.
        </p>
        <button type="button" onClick={() => reset()} className="btn btn-primary mt-7">
          Try again
        </button>
      </div>
    </main>
  );
}
