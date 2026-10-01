import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { isInstructorRole, requireUserPage } from "@/lib/auth/helpers";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUserPage();

  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <DashboardSidebar isInstructor={isInstructorRole(user.role)} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
