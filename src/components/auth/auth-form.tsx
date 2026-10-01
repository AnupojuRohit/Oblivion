"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const payload = Object.fromEntries(form.entries());

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let body: any = null;
      try { body = raw ? JSON.parse(raw) : null; } catch {}

      if (!response.ok) {
        setError(body?.error?.message ?? `Request failed (${response.status})`);
        return;
      }

      if (!body?.success) {
        setError(body?.error?.message ?? "Authentication failed");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not reach the authentication server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-14 bg-[var(--bg-secondary)] border-r border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative z-10">
          <Link href="/" className="font-black tracking-[-0.06em] text-lg text-[var(--fg)]" style={{ fontFamily: "var(--font-geist-sans, system-ui)" }}>OBLIVION</Link>
        </div>
        <motion.div className="relative z-10" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <h2 className="display-lg text-[var(--fg)] text-balance mb-4">
            {isRegister ? <>CREATE YOUR<br /><span className="text-[var(--fg-tertiary)]">ACCOUNT.</span></> : <>WELCOME<br /><span className="text-[var(--fg-tertiary)]">BACK.</span></>}
          </h2>
          <p className="text-sm text-[var(--fg-tertiary)] leading-relaxed max-w-xs">
            {isRegister ? "Join thousands of learners building real skills on the platform built for the future." : "Continue your learning journey. Your progress, certificates, and saved resources are waiting."}
          </p>
        </motion.div>
        <p className="relative z-10 text-xs text-[var(--fg-quaternary)] tracking-widest uppercase">Learn without limits.</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-14 md:px-14">
        <motion.div className="w-full max-w-md mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
          <Link href="/" className="font-black tracking-[-0.06em] text-lg text-[var(--fg)] mb-8 block md:hidden" style={{ fontFamily: "var(--font-geist-sans, system-ui)" }}>OBLIVION</Link>
          <p className="label-overline mb-3">{isRegister ? "Get started" : "Sign in"}</p>
          <h1 className="display-sm text-[var(--fg)] mb-8">{isRegister ? "Create your account" : "Welcome back"}</h1>

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-[var(--fg-secondary)] mb-1.5" htmlFor="name">Full name</label>
                <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="John Doe" className="input-base" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--fg-secondary)] mb-1.5" htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="input-base" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[var(--fg-secondary)]" htmlFor="password">Password</label>
              </div>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} required minLength={isRegister ? 8 : 1} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "Min. 8 characters" : "Your password"} className="input-base pr-10" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-quaternary)] hover:text-[var(--fg-secondary)] transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {isRegister && <p className="mt-1.5 text-xs text-[var(--fg-quaternary)]">At least 8 characters, including a letter and number.</p>}
            </div>

            {error && <motion.p role="alert" className="text-sm text-[var(--fg)] bg-[var(--bg-tertiary)] border border-[var(--border-strong)] rounded-lg px-4 py-3" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>{error}</motion.p>}

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center gap-2 py-3 text-sm disabled:opacity-60">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <>{isRegister ? "Create account" : "Sign in"}<ArrowRight className="size-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-[var(--fg-quaternary)]">
            {isRegister ? "Already have an account?" : "New to Oblivion?"}{" "}
            <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-colors">
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
