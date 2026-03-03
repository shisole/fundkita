export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* TODO: Add dashboard sidebar/navigation */}
      <main className="flex-1">{children}</main>
    </>
  );
}
