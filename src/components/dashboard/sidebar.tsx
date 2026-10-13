import Link from "next/link";
import { BarChart3, BookOpen, LayoutDashboard, PlusCircle, ReceiptText, Settings, Sparkles } from "lucide-react";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Browse courses", icon: BookOpen },
  { href: "/dashboard/courses/new", label: "Upload course", icon: PlusCircle },
  { href: "/dashboard/courses", label: "My uploaded courses", icon: BookOpen },
  { href: "/finder", label: "AI Finder", icon: Sparkles },
  { href: "/dashboard/profile", label: "Profile", icon: Settings },
];

const adminItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/courses", label: "Browse courses", icon: BookOpen },
  { href: "/dashboard/courses/new", label: "Upload course", icon: PlusCircle },
  { href: "/dashboard/courses", label: "My uploaded courses", icon: BookOpen },
  { href: "/dashboard/orders", label: "Orders", icon: ReceiptText },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/finder", label: "AI Finder", icon: Sparkles },
  { href: "/dashboard/profile", label: "Profile", icon: Settings },
];

export function DashboardSidebar({ isAdmin = false }: { isInstructor?: boolean; isAdmin?: boolean }) {
  const items = isAdmin ? adminItems : mainItems;

  return (
    <aside className="border-b bg-[var(--surface)] md:min-h-[calc(100vh-4rem)] md:w-56 md:border-b-0 md:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-500/10 hover:text-indigo-600"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
