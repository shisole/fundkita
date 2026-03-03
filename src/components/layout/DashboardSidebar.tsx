"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  CloseIcon,
  DashboardIcon,
  DonateIcon,
  CampaignIcon,
  MenuIcon,
  SettingsIcon,
} from "@/components/icons";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { href: "/dashboard", label: "Overview", icon: <DashboardIcon className="h-5 w-5" /> },
  { href: "/dashboard/donations", label: "My Donations", icon: <DonateIcon className="h-5 w-5" /> },
  {
    href: "/dashboard/campaigns",
    label: "My Campaigns",
    icon: <CampaignIcon className="h-5 w-5" />,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: <SettingsIcon className="h-5 w-5" />,
  },
];

interface DashboardSidebarProps {
  userName: string;
  userAvatarUrl: string | null;
}

export default function DashboardSidebar({ userName, userAvatarUrl }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-700">
        <Avatar src={userAvatarUrl} alt={userName} size="sm" />
        <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {userName}
        </span>
      </div>

      <div className="flex-1 space-y-1 p-3">
        {SIDEBAR_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(link.href)
                ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
            )}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-teal-500 p-3 text-white shadow-lg md:hidden"
        aria-label="Open sidebar"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl dark:bg-gray-900 md:hidden">
            <div className="flex justify-end p-2">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Close sidebar"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
        {sidebar}
      </aside>
    </>
  );
}
