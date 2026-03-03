import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="font-heading text-2xl font-bold text-teal-600 dark:text-teal-400"
          >
            FundKita
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-gray-900">{children}</div>
      </div>
    </main>
  );
}
