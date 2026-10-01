"use client";

import Link from "next/link";
import { BarChart3, BookOpen, LayoutDashboard, PlusCircle, ReceiptText, Settings, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type User = { role: "STUDENT" | "INSTRUCTOR" | "ADMIN" };

export function DashboardSidebar() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.ok ? r.json() : null)
      .then((body) => setUser(body?.success ? body.data : null))
      .catch(() => setUser(null));
  }, []);

  const studentItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/courses", label: "My courses", icon: BookOpen },
    { href: "/finder", label: "AI Finder", icon: Sparkles },
    { href: "/dashboard/orders", label: "Orders", icon: ReceiptText },
    { href: "/dashboard/profile", label: "Profile", icon: Settings },
  ];
  const instructorItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/courses", label: "My courses", icon: BookOpen },
    { href: "/dashboard/courses/new", label: "Create course", icon: PlusCircle },
    { href: "/dashboard/orders", label: "Orders", icon: ReceiptText },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/profile", label: "Profile", icon: Settings },
  ];
  const items = user?.role === "INSTRUCTOR" || user?.role === "ADMIN" ? instructorItems : studentItems;

  return (
    <aside className="border-b bg-[var(--surface)] md:min-h-[calc(100vh-4rem)] md:w-56 md:border-b-0 md:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-500/10 hover:text-indigo-600">
            <Icon className="size-4" />{label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
