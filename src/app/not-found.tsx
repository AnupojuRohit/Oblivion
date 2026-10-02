import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="label-overline mb-3">404</p>
        <h1 className="display-md text-[var(--fg)]">Page not found.</h1>
        <p className="mt-4 text-sm text-[var(--fg-tertiary)]">
          The page you requested does not exist or is no longer available.
        </p>
        <Link href="/" className="btn btn-primary mt-7 inline-flex">Back home</Link>
      </div>
    </main>
  );
}
