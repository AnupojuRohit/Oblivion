import { redirect } from "next/navigation";
import { requireInstructor } from "@/lib/auth/helpers";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) { try { await requireInstructor(); } catch { redirect("/login"); } return <div className="mx-auto flex max-w-7xl flex-col md:flex-row"><DashboardSidebar /><div className="min-w-0 flex-1">{children}</div></div>; }
