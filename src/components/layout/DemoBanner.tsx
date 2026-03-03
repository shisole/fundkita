"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui";
import { DEMO_USERS, isDemoMode } from "@/lib/constants/demo-users";

interface DemoBannerProps {
  currentUserId?: string;
}

export default function DemoBanner({ currentUserId }: DemoBannerProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  if (!isDemoMode()) return null;

  const currentUser = DEMO_USERS.find((u) => u.id === currentUserId);

  const handleSwitch = async (userId: string) => {
    setSwitching(userId);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="bg-golden-500 px-4 py-2 text-center text-sm font-medium text-gray-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2">
        <span>Demo Mode</span>
        {currentUser && (
          <>
            <span>&mdash;</span>
            <span>Logged in as: {currentUser.name}</span>
            <Badge variant="info">{currentUser.role}</Badge>
          </>
        )}
        <span className="mx-2 text-golden-700">|</span>
        <span>Switch:</span>
        {DEMO_USERS.map((user) => (
          <button
            key={user.id}
            onClick={() => handleSwitch(user.id)}
            disabled={switching !== null || user.id === currentUserId}
            className="rounded bg-white/30 px-2 py-0.5 text-xs font-semibold transition-colors hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {switching === user.id ? "..." : user.name}
          </button>
        ))}
      </div>
    </div>
  );
}
