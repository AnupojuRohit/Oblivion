"use client";

import { useEffect, useRef, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<NavUser>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json?.data) {
          setUser({ name: json.data.name, role: json.data.role });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  const dashboardHref =
    user?.role === "INSTRUCTOR" || user?.role === "ADMIN"
      ? "/dashboard"
      : "/dashboard";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass border-b border-[var(--border)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 text-[var(--fg)]"
            aria-label="Oblivion home"
          >
            <span
              className="font-black tracking-[-0.06em] text-xl transition-opacity duration-200 group-hover:opacity-70"
              style={{ fontFamily: "var(--font-geist-sans, system-ui)" }}
            >
              OBLIVION
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                  pathname === href || pathname.startsWith(href + "/")
                    ? "text-[var(--fg)]"
                    : "text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                {label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/register"
                className="px-3 py-1.5 text-sm font-medium rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-all duration-150"
              >
                Become Instructor
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              aria-label="Toggle color theme"
              className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-all duration-150"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )
              ) : (
                <span className="size-4" />
              )}
            </button>

            {/* Auth state */}
            {mounted && (
              <>
                {user ? (
                  <div className="relative hidden md:block" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-all duration-150"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="true"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--fg)] text-[var(--bg)] text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="max-w-[100px] truncate">{user.name}</span>
                      <ChevronDown
                        className={`size-3 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 card shadow-[var(--shadow-xl)] py-1 z-50">
                        <div className="px-3 py-2 border-b border-[var(--border)]">
                          <p className="text-xs font-semibold text-[var(--fg)]">{user.name}</p>
                          <p className="text-xs text-[var(--fg-quaternary)] uppercase tracking-wider mt-0.5">
                            {user.role}
                          </p>
                        </div>
                        <Link
                          href={dashboardHref}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          <LayoutDashboard className="size-3.5" />
                          Dashboard
                        </Link>
                        <Link
                          href="/courses"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          <BookOpen className="size-3.5" />
                          My Courses
                        </Link>
                        <Link
                          href="/finder"
                          className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          <Sparkles className="size-3.5" />
                          AI Finder
                        </Link>
                        <div className="border-t border-[var(--border)] mt-1 pt-1">
                          <Link
                            href="/dashboard/profile"
                            className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <User className="size-3.5" />
                            Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--fg-quaternary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <LogOut className="size-3.5" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-3 py-1.5 text-sm font-medium text-[var(--fg-tertiary)] hover:text-[var(--fg)] transition-colors duration-150"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="btn btn-primary text-xs px-4 py-2"
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="flex md:hidden items-center justify-center w-8 h-8 rounded-md text-[var(--fg-tertiary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border)] glass">
            <nav className="px-5 py-4 space-y-1" aria-label="Mobile navigation">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  {label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link href={dashboardHref} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-md text-[var(--fg-quaternary)] hover:text-[var(--fg)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/login" className="btn btn-secondary w-full justify-center">Sign in</Link>
                  <Link href="/register" className="btn btn-primary w-full justify-center">Get started</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer to prevent content from going behind fixed navbar */}
      <div className="h-14" aria-hidden="true" />
    </>
  );
}
