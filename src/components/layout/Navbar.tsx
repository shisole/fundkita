import Link from "next/link";

import { SearchIcon } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { getCurrentUser } from "@/lib/supabase/queries";

import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

export default async function Navbar() {
  const dbUser = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="font-heading text-xl font-bold text-teal-600 dark:text-teal-400">
          FundKita
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/campaigns"
            className="text-sm font-medium text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Campaigns
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400"
          >
            Leaderboard
          </Link>
        </div>

        {/* Desktop search */}
        <div className="hidden md:block">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search campaigns..."
              className="w-64 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {dbUser ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/dashboard">
                <Avatar src={dbUser.avatar_url} alt={dbUser.full_name ?? "User"} size="sm" />
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-400"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile nav toggle */}
          <MobileNav user={dbUser} />
        </div>
      </nav>
    </header>
  );
}
