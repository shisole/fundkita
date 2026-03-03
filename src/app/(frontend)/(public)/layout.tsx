export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* TODO: Add Navbar component */}
      <main className="flex-1">{children}</main>
      {/* TODO: Add Footer component */}
    </>
  );
}
