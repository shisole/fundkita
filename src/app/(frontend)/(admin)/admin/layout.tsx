export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* TODO: Add admin sidebar with role guard */}
      <main className="flex-1">{children}</main>
    </>
  );
}
