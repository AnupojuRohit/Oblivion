"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles, BookOpen, Zap, ChevronRight } from "lucide-react";

/* ─── HERO WORD REVEAL ───────────────────────────────────── */
function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const letters = text.split("");
  return (
    <span className={`inline-block overflow-hidden ${className}`} aria-label={text}>
      {letters.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.7,
            delay: 1.2 + i * 0.04,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── SCAN LINE ──────────────────────────────────────────── */
function ScanLine() {
  return (
    <motion.div
      className="absolute top-0 left-0 h-px w-full pointer-events-none z-10"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
      }}
      initial={{ x: "-100%" }}
      animate={{ x: "100vw" }}
      transition={{ duration: 1.4, delay: 0.4, ease: "easeInOut" }}
    />
  );
}

/* ─── SCROLL REVEAL WRAPPER ──────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── FEATURE PANEL ──────────────────────────────────────── */
function FeaturePanel({
  num,
  icon: Icon,
  title,
  description,
  href,
  delay = 0,
}: {
  num: string;
  icon: typeof BookOpen;
  title: string;
  description: string;
  href: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={href} className="group block h-full card card-hover p-8">
        <div className="flex items-start justify-between mb-8">
          <span className="label-overline">{num}</span>
          <Icon className="size-5 text-[var(--fg-quaternary)] group-hover:text-[var(--fg)] transition-colors duration-300" />
        </div>
        <h3 className="display-sm text-[var(--fg)] mb-3">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--fg-tertiary)] mb-8">
          {description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--fg-tertiary)] group-hover:text-[var(--fg)] group-hover:gap-2.5 transition-all duration-300">
          Explore <ArrowRight className="size-3.5" />
        </span>
      </Link>
    </motion.div>
  );
}

/* ─── STAT ───────────────────────────────────────────────── */
function Stat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      <motion.p
        className="display-md text-[var(--fg)]"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {value}
      </motion.p>
      <p className="text-sm text-[var(--fg-tertiary)] mt-1">{label}</p>
    </div>
  );
}

/* ─── MARQUEE ────────────────────────────────────────────── */
const marqueeItems = [
  "COURSES",
  "AI FINDER",
  "CERTIFICATES",
  "PROGRESS",
  "RESOURCES",
  "COMMUNITY",
  "INSTRUCTORS",
  "SKILLS",
];

function Marquee() {
  const items = [...marqueeItems, ...marqueeItems, ...marqueeItems];
  return (
    <div className="relative overflow-hidden py-4 border-y border-[var(--border)]">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: "-33.333%" }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        style={{ width: "max-content" }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="text-xs font-bold tracking-[0.2em] text-[var(--fg-quaternary)]"
          >
            {item}
            <span className="ml-12 inline-block w-1 h-1 rounded-full bg-[var(--border-strong)] align-middle" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── MOCK DASHBOARD PREVIEW ─────────────────────────────── */
function DashboardMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const courses = [
    { title: "System Design Fundamentals", progress: 68, lessons: 24 },
    { title: "Advanced TypeScript Patterns", progress: 35, lessons: 18 },
    { title: "Docker from Zero to Production", progress: 91, lessons: 32 },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Browser chrome */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xl)] overflow-hidden">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
            <div className="w-3 h-3 rounded-full bg-[var(--border-strong)]" />
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-[var(--bg-tertiary)] rounded text-xs px-3 py-1 text-center text-[var(--fg-quaternary)] font-mono">
              app.oblivion.io/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-6 grid grid-cols-3 gap-4">
          {/* Stats row */}
          <div className="col-span-3 grid grid-cols-3 gap-4">
            {[
              { label: "IN PROGRESS", val: "3" },
              { label: "COMPLETED", val: "12" },
              { label: "CERTIFICATES", val: "7" },
            ].map(({ label, val }) => (
              <div key={label} className="card p-4">
                <p className="label-overline mb-1">{label}</p>
                <p className="text-2xl font-bold text-[var(--fg)]">{val}</p>
              </div>
            ))}
          </div>

          {/* Course progress cards */}
          <div className="col-span-3 space-y-3">
            <p className="label-overline">CONTINUE LEARNING</p>
            {courses.map((course) => (
              <div key={course.title} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <BookOpen className="size-4 text-[var(--fg-tertiary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--fg)] truncate">{course.title}</p>
                  <p className="text-xs text-[var(--fg-quaternary)] mt-0.5">{course.lessons} lessons</p>
                  <div className="mt-2 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--fg)]"
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${course.progress}%` } : {}}
                      transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-[var(--fg-secondary)] shrink-0">
                  {course.progress}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow effect */}
      <div
        className="absolute -inset-px rounded-xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)",
        }}
      />
    </motion.div>
  );
}

/* ─── AI FINDER PREVIEW ──────────────────────────────────── */
function FinderPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const results = [
    { title: "Docker for Developers — Full Course", channel: "TechWithTim", score: 98 },
    { title: "Docker Compose in 12 Minutes", channel: "TraversyMedia", score: 91 },
    { title: "Container Fundamentals — Zero to Hero", channel: "Fireship", score: 87 },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="card overflow-hidden"
    >
      {/* Search bar */}
      <div className="p-5 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)]">
          <Sparkles className="size-4 text-[var(--fg-tertiary)] shrink-0" />
          <span className="text-sm text-[var(--fg-secondary)] flex-1">Learn Docker from beginner to production</span>
          <span className="text-xs font-semibold text-[var(--fg-quaternary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">
            ↵
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="divide-y divide-[var(--border)]">
        {results.map((r, i) => (
          <motion.div
            key={r.title}
            className="flex items-center gap-4 p-4"
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-xs font-black text-[var(--fg-quaternary)] w-6 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="w-14 h-9 rounded bg-[var(--bg-tertiary)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--fg)] truncate">{r.title}</p>
              <p className="text-xs text-[var(--fg-quaternary)] mt-0.5">{r.channel}</p>
            </div>
            <div className="shrink-0">
              <span className="text-xs font-bold text-[var(--fg-secondary)]">{r.score}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── MAIN LANDING PAGE ──────────────────────────────────── */
export default function LandingPage() {
  const [heroReady, setHeroReady] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.7], [0, 40]);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* ─── HERO ──────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg)]"
      >
        {/* Grid background */}
        <div className="absolute inset-0 grid-bg opacity-40" />

        {/* Radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, var(--bg) 80%)",
          }}
        />

        {/* Scan line */}
        {heroReady && <ScanLine />}

        {/* Content */}
        <motion.div
          className="relative z-10 text-center px-5 max-w-6xl mx-auto"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          {/* Eyebrow label */}
          <motion.div
            className="inline-flex items-center gap-2 mb-10"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="label-overline">The future of learning is here</span>
          </motion.div>

          {/* Main headline — LEARN WITHOUT LIMITS */}
          <div className="overflow-hidden mb-3">
            <motion.p
              className="display-xl text-[var(--fg-tertiary)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              LEARN WITHOUT
            </motion.p>
          </div>
          <div className="overflow-hidden mb-8">
            <motion.p
              className="display-xl text-[var(--fg)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              LIMITS.
            </motion.p>
          </div>

          {/* Brand word OBLIVION */}
          <div className="overflow-hidden leading-none mb-10">
            <h1 className="display-hero text-[var(--fg)] font-black tracking-[-0.05em]">
              {heroReady && <WordReveal text="OBLIVION" />}
            </h1>
          </div>

          {/* Subtext */}
          <motion.p
            className="mx-auto max-w-lg text-base text-[var(--fg-tertiary)] leading-relaxed mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 2.0, ease: "easeOut" }}
          >
            A modern learning marketplace combined with intelligent educational discovery.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 2.2, ease: "easeOut" }}
          >
            <Link href="/courses" className="btn btn-primary text-sm gap-2">
              Explore Courses <ArrowRight className="size-4" />
            </Link>
            <Link href="/finder" className="btn btn-secondary text-sm gap-2">
              <Sparkles className="size-4" /> Open AI Finder
            </Link>
          </motion.div>

          {/* Become instructor link */}
          <motion.div
            className="mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.5 }}
          >
            <Link
              href="/instructor/apply"
              className="text-xs text-[var(--fg-quaternary)] hover:text-[var(--fg-secondary)] inline-flex items-center gap-1 transition-colors"
            >
              Become an instructor <ArrowUpRight className="size-3" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.0, duration: 0.8 }}
        >
          <span className="label-overline text-[0.6rem]">scroll</span>
          <motion.div
            className="w-px h-8 bg-[var(--border-strong)]"
            animate={{ scaleY: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ─── MARQUEE ───────────────────────────────────────── */}
      <Marquee />

      {/* ─── THREE WAYS TO LEARN ───────────────────────────── */}
      <section className="py-28 px-5 lg:px-8 max-w-7xl mx-auto">
        <Reveal>
          <p className="label-overline mb-4">The platform</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="display-lg text-[var(--fg)] max-w-2xl text-balance mb-16">
            ONE PLATFORM.
            <br />
            <span className="text-[var(--fg-tertiary)]">THREE WAYS TO LEARN.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeaturePanel
            num="01"
            icon={BookOpen}
            title="COURSES"
            description="Structured learning from expert instructors. Follow a curriculum, track progress, earn certificates."
            href="/courses"
            delay={0.1}
          />
          <FeaturePanel
            num="02"
            icon={Sparkles}
            title="AI FINDER"
            description="Tell Oblivion what you want to learn. The AI Resource Finder discovers and ranks relevant educational videos."
            href="/finder"
            delay={0.2}
          />
          <FeaturePanel
            num="03"
            icon={Zap}
            title="LEARNING SPACE"
            description="Track progress, manage saved resources, download materials, and claim completion certificates."
            href="/dashboard"
            delay={0.3}
          />
        </div>
      </section>

      {/* ─── PRODUCT SHOWCASE ──────────────────────────────── */}
      <section className="py-20 px-5 lg:px-8 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <Reveal className="mb-12 text-center">
            <p className="label-overline mb-4">Command center</p>
            <h2 className="display-lg text-[var(--fg)] text-balance">
              YOUR LEARNING
              <br />
              <span className="text-[var(--fg-tertiary)]">COMMAND CENTER.</span>
            </h2>
          </Reveal>
          <DashboardMockup />
        </div>
      </section>

      {/* ─── STATS ─────────────────────────────────────────── */}
      <section className="py-28 px-5 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <Stat value="10K+" label="Learners worldwide" />
            <Stat value="500+" label="Expert-led courses" />
            <Stat value="98%" label="Completion satisfaction" />
            <Stat value="AI" label="Powered discovery" />
          </div>
        </div>
      </section>

      {/* ─── AI FINDER SECTION ─────────────────────────────── */}
      <section className="py-28 px-5 lg:px-8 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <p className="label-overline mb-4">AI Resource Finder</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="display-lg text-[var(--fg)] text-balance mb-6">
                DON&apos;T SEARCH.
                <br />
                <span className="text-[var(--fg-tertiary)]">DISCOVER.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="text-base text-[var(--fg-tertiary)] leading-relaxed mb-8 max-w-md">
                Tell Oblivion what you want to learn. The AI Resource Finder finds and ranks
                the most relevant educational resources backed by real YouTube results.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <Link href="/finder" className="btn btn-primary gap-2 text-sm">
                <Sparkles className="size-4" /> Try AI Finder
              </Link>
            </Reveal>
          </div>
          <FinderPreview />
        </div>
      </section>

      {/* ─── CTA SECTION ───────────────────────────────────── */}
      <section className="py-32 px-5 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="display-xl text-[var(--fg)] text-balance mb-6">
              READY TO START?
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-base text-[var(--fg-tertiary)] max-w-md mx-auto mb-10">
              Join thousands of learners who are building real skills with Oblivion.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/courses" className="btn btn-primary text-sm gap-2">
                Explore Courses <ArrowRight className="size-4" />
              </Link>
              <Link href="/register" className="btn btn-secondary text-sm gap-2">
                Create Account <ChevronRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
