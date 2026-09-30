import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { certificateService } from "@/modules/certificates/certificate.service";

export default async function VerifyCertificatePage({ params }: { params: Promise<{ verifyId: string }> }) {
  let certificate;
  try {
    certificate = await certificateService.getPublicVerification((await params).verifyId);
  } catch {
    notFound();
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <div className="rounded-3xl border bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400"><ShieldCheck className="size-7" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Certificate verified</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{certificate.studentNameSnapshot}</h1>
            <p className="mt-2 text-[var(--muted)]">This LearnHub certificate is valid and was issued on {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(certificate.issuedAt))}.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-2xl border bg-background p-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Student</p>
            <p className="mt-1 text-lg font-semibold">{certificate.studentNameSnapshot}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Course</p>
            <p className="mt-1 text-lg font-semibold">{certificate.courseTitleSnapshot}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Issued</p>
            <p className="mt-1 text-lg font-semibold">{new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(certificate.issuedAt))}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Verification ID</p>
            <p className="mt-1 break-all text-lg font-semibold">{certificate.verifyId}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/api/courses/${certificate.courseId}/certificate`} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">
            <CheckCircle2 className="size-4" />
            Download PDF
          </Link>
          <Link href={certificate.courseSlugSnapshot ? `/courses/${certificate.courseSlugSnapshot}` : "/courses"} className="rounded-xl border px-4 py-2.5 text-sm font-semibold">Back to learning</Link>
        </div>
      </div>
    </section>
  );
}