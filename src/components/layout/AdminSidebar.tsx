"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  CampaignIcon,
  CloseIcon,
  DashboardIcon,
  FlagIcon,
  MenuIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ADMIN_LINKS: SidebarLink[] = [
  { href: "/admin", label: "Overview", icon: <DashboardIcon className="h-5 w-5" /> },
  { href: "/admin/campaigns", label: "Campaigns", icon: <CampaignIcon className="h-5 w-5" /> },
  { href: "/admin/kyc", label: "KYC Review", icon: <UserIcon className="h-5 w-5" /> },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: <ShieldIcon className="h-5 w-5" /> },
  { href: "/admin/fraud", label: "Fraud Flags", icon: <FlagIcon className="h-5 w-5" /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <span className="text-sm font-bold text-red-600 dark:text-red-400">Admin Panel</span>
      </div>

      <div className="flex-1 space-y-1 p-3">
        {ADMIN_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(link.href)
                ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
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
        className="fixed bottom-4 right-4 z-40 rounded-full bg-red-500 p-3 text-white shadow-lg md:hidden"
        aria-label="Open admin sidebar"
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
