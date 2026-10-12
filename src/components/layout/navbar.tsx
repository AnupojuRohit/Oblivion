"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Menu, X, ChevronDown, BookOpen, Sparkles, LayoutDashboard, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";

type NavUser = { name: string; role: string } | null;

const navLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/finder", label: "AI Finder" },
];

export function Navbar() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<NavUser>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const syncUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const json = response.ok ? await response.json() : null;
        if (!active) return;
        setUser(json?.success && json?.data
          ? { name: String(json.data.name ?? ""), role: String(json.data.role ?? "STUDENT") }
          : null);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setAuthResolved(true);
      }
    };
    const onAuthChanged = () => { void syncUser(); };
    void syncUser();
    window.addEventListener("focus", onAuthChanged);
    window.addEventListener("pageshow", onAuthChanged);
    window.addEventListener("oblivion:auth-changed", onAuthChanged);
    return () => {
      active = false;
      window.removeEventListener("focus", onAuthChanged);
      window.removeEventListener("pageshow", onAuthChanged);
      window.removeEventListener("oblivion:auth-changed", onAuthChanged);
    };
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.success !== true) {
        throw new Error(body?.error?.message ?? "Could not sign out. Please try again.");
      }
      setUser(null);
      setUserMenuOpen(false);
      setMobileOpen(false);
      window.dispatchEvent(new Event("oblivion:auth-changed"));
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Oblivion sign-out failed", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass border-b border-[var(--border)]" : "bg-transparent border-b border-transparent"}`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="group flex items-center gap-2 text-[var(--fg)]" aria-label="Oblivion home">
            <span className="font-black tracking-[-0.06em] text-xl transition-opacity duration-200 group-hover:opacity-70">OBLIVION</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${pathname === href || pathname.startsWith(href + "/") ? "text-[var(--fg)]" : "text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)]"}`}>
                {label}
              </Link>
            ))}
            {authResolved && !user && <Link href="/register" className="px-3 py-1.5 text-sm font-medium rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)]">Become Instructor</Link>}
            {authResolved && user?.role === "STUDENT" && <Link href="/dashboard/instructor" className="px-3 py-1.5 text-sm font-medium rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)]">Become Instructor</Link>}
          </nav>

          <div className="flex items-center gap-2">
            <button aria-label="Toggle color theme" className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)]" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              {mounted ? (resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />) : <span className="size-4" />}
            </button>

            {mounted && authResolved && user ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)]" aria-expanded={userMenuOpen} aria-haspopup="true">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--fg)] text-[var(--bg)] text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className={`size-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 card shadow-[var(--shadow-xl)] py-1 z-50">
                    <div className="px-3 py-2 border-b border-[var(--border)]"><p className="text-xs font-semibold text-[var(--fg)]">{user.name}</p><p className="text-xs text-[var(--fg-quaternary)] uppercase tracking-wider mt-0.5">{user.role}</p></div>
                    <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]"><LayoutDashboard className="size-3.5" />Dashboard</Link>
                    <Link href="/dashboard/courses" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]"><BookOpen className="size-3.5" />My Courses</Link>
                    <Link href="/finder" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]"><Sparkles className="size-3.5" />AI Finder</Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]"><User className="size-3.5" />Profile</Link>
                    <button disabled={loggingOut} onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-quaternary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"><LogOut className="size-3.5" />{loggingOut ? "Signing out…" : "Sign out"}</button>
                  </div>
                )}
              </div>
            ) : mounted && authResolved ? (
              <div className="hidden md:flex items-center gap-2"><Link href="/login" className="px-3 py-1.5 text-sm font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg)]">Sign in</Link><Link href="/register" className="btn btn-primary text-xs px-4 py-2">Get started</Link></div>
            ) : null}

            <button className="flex md:hidden items-center justify-center w-8 h-8 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg)]" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border)] glass">
            <nav className="px-5 py-4 space-y-1">
              {navLinks.map(({ href, label }) => <Link key={href} href={href} className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)]">{label}</Link>)}
              {user ? <><Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md"><LayoutDashboard className="size-4" />Dashboard</Link>{user.role === "STUDENT" && <Link href="/dashboard/instructor" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md"><BookOpen className="size-4" />Become Instructor</Link>}<button disabled={loggingOut} onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md disabled:opacity-50"><LogOut className="size-4" />{loggingOut ? "Signing out…" : "Sign out"}</button></> : authResolved ? <div className="pt-2 flex flex-col gap-2"><Link href="/login" className="btn btn-secondary w-full justify-center">Sign in</Link><Link href="/register" className="btn btn-primary w-full justify-center">Get started</Link></div> : <p className="px-3 py-2 text-sm text-[var(--fg-quaternary)]">Checking account…</p>}
            </nav>
          </div>
        )}
      </header>
      <div className="h-14" aria-hidden="true" />
    </>
  );
}
