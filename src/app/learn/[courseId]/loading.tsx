export default function LoadingLearnPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-40 rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-10 w-80 rounded-full bg-black/10 dark:bg-white/10" />
            <div className="h-4 w-64 rounded-full bg-black/10 dark:bg-white/10" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-black/10 dark:bg-white/10" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="h-24 rounded-2xl border bg-[var(--surface)]" />
            <div className="h-80 rounded-2xl border bg-[var(--surface)]" />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-36 rounded-2xl border bg-[var(--surface)]" />
              <div className="h-36 rounded-2xl border bg-[var(--surface)]" />
            </div>
          </div>
          <div className="h-[40rem] rounded-2xl border bg-[var(--surface)]" />
        </div>
      </div>
    </section>
  );
}