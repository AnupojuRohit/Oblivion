import { Suspense } from "react";
import FinderClient from "./finder-client";

export default function FinderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-12 text-sm text-[var(--muted)]">Loading resource finder...</div>}>
      <FinderClient />
    </Suspense>
  );
}