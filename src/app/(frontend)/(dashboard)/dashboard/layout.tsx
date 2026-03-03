import { redirect } from "next/navigation";

import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { getCurrentUser } from "@/lib/supabase/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar userName={user.full_name ?? "User"} userAvatarUrl={user.avatar_url} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
