"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  void error;

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="text-xs uppercase tracking-[0.2em] opacity-60 mb-3">Oblivion</p>
            <h1 className="text-3xl font-bold">Something went wrong.</h1>
            <p className="mt-4 text-sm opacity-70">Please try again. The application encountered an unexpected error.</p>
            <button type="button" onClick={() => reset()} className="mt-7 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black">
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
