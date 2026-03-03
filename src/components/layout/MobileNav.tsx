"use client";

import Link from "next/link";
import { useState } from "react";

import { CloseIcon, MenuIcon } from "@/components/icons";
import { Avatar } from "@/components/ui";
import { type TableRow } from "@/lib/supabase/types";

interface MobileNavProps {
  user: TableRow<"users"> | null;
}

export default function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Open menu"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)} />

          {/* Slide-out panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <span className="font-heading text-lg font-bold text-teal-600 dark:text-teal-400">
                FundKita
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Close menu"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-8 space-y-4">
              <Link
                href="/campaigns"
                className="block text-base font-medium text-gray-700 hover:text-teal-600 dark:text-gray-300"
                onClick={() => setIsOpen(false)}
              >
                Campaigns
              </Link>
              <Link
                href="/leaderboard"
                className="block text-base font-medium text-gray-700 hover:text-teal-600 dark:text-gray-300"
                onClick={() => setIsOpen(false)}
              >
                Leaderboard
              </Link>

              <hr className="border-gray-200 dark:border-gray-700" />

              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar_url} alt={user.full_name ?? "User"} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block text-base font-medium text-gray-700 hover:text-teal-600 dark:text-gray-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="block text-base font-medium text-gray-700 hover:text-teal-600 dark:text-gray-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Settings
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block rounded-lg px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block rounded-lg bg-teal-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-400"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
