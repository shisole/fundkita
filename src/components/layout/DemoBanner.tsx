"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SpinnerIcon } from "@/components/icons";
import { Badge } from "@/components/ui";
import { DEMO_USERS, isDemoMode } from "@/lib/constants/demo-users";
import { type UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface CurrentUser {
  email: string;
  name: string;
  role: UserRole;
}

function parseRole(value: unknown): UserRole {
  if (value === "organizer") return "organizer";
  if (value === "admin") return "admin";
  return "donor";
}

const ROLE_LABELS: Record<UserRole, string> = {
  organizer: "Organizer",
  donor: "Donor",
  admin: "Admin",
};

const ROLE_BADGE_VARIANT: Record<UserRole, "info" | "success" | "warning"> = {
  organizer: "info",
  donor: "success",
  admin: "warning",
};

function roleBadgeVariant(role: UserRole): "info" | "success" | "warning" {
  return ROLE_BADGE_VARIANT[role];
}

export default function DemoBanner() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isDemoMode()) return;

    async function fetchCurrentUser() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          const demoUser = DEMO_USERS.find((u) => u.email === user.email);
          if (demoUser) {
            setCurrentUser({
              email: demoUser.email,
              name: demoUser.name,
              role: demoUser.role,
            });
          } else {
            setCurrentUser({
              email: user.email,
              name: user.user_metadata?.full_name ?? user.email,
              role: parseRole(user.user_metadata?.role),
            });
          }
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setLoaded(true);
      }
    }

    void fetchCurrentUser();
  }, [switching]);

  const handleSwitch = useCallback(
    async (email: string) => {
      setSwitching(email);
      try {
        const res = await fetch("/api/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          router.refresh();
        }
      } finally {
        setSwitching(null);
      }
    },
    [router],
  );

  const handleSignOut = useCallback(async () => {
    setSwitching("guest");
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSwitching(null);
    }
  }, [router]);

  if (!isDemoMode()) return null;

  return (
    <div className="border-b border-golden-600/30 bg-golden-500 px-4 py-2 text-center text-sm font-medium text-gray-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2">
        <span className="font-bold tracking-wide">Demo Mode</span>

        {loaded && currentUser && (
          <>
            <span className="text-golden-800">&mdash;</span>
            <span>
              Signed in as <strong>{currentUser.name}</strong>
            </span>
            <Badge variant={roleBadgeVariant(currentUser.role)}>
              {ROLE_LABELS[currentUser.role]}
            </Badge>
          </>
        )}

        {loaded && !currentUser && (
          <>
            <span className="text-golden-800">&mdash;</span>
            <span className="italic text-golden-800">Guest (not signed in)</span>
          </>
        )}

        <span className="mx-1.5 text-golden-700">|</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-golden-800">
          Switch:
        </span>

        {DEMO_USERS.map((user) => {
          const isActive = currentUser?.email === user.email;
          const isLoading = switching === user.email;

          return (
            <button
              key={user.id}
              onClick={() => handleSwitch(user.email)}
              disabled={switching !== null || isActive}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all",
                isActive
                  ? "bg-golden-800 text-golden-100 ring-1 ring-golden-900"
                  : "bg-white/30 text-gray-900 hover:bg-white/50",
                (switching !== null || isActive) && "cursor-not-allowed",
                !isActive && switching === null && "hover:scale-105",
              )}
            >
              {isLoading && <SpinnerIcon className="h-3 w-3 animate-spin" />}
              {user.name.split(" ")[0]}
            </button>
          );
        })}

        <button
          onClick={handleSignOut}
          disabled={switching !== null || !loaded || !currentUser}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all",
            !currentUser && loaded
              ? "bg-golden-800 text-golden-100 ring-1 ring-golden-900"
              : "bg-white/30 text-gray-900 hover:bg-white/50",
            (switching !== null || !loaded || !currentUser) && "cursor-not-allowed",
            currentUser && switching === null && "hover:scale-105",
          )}
        >
          {switching === "guest" && <SpinnerIcon className="h-3 w-3 animate-spin" />}
          Guest
        </button>
      </div>
    </div>
  );
}
