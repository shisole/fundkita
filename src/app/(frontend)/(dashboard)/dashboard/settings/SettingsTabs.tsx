"use client";

import Link from "next/link";
import { useState } from "react";

import KycForm from "@/components/dashboard/KycForm";
import ProfileForm from "@/components/dashboard/ProfileForm";
import { Tabs } from "@/components/ui";
import { type KycIdType, type KycStatus, type UserRole } from "@/lib/supabase/types";

interface SettingsTabsProps {
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  userRole: UserRole;
  kycSubmission: {
    id: string;
    id_type: KycIdType;
    status: KycStatus;
    rejection_reason: string | null;
    created_at: string;
  } | null;
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "verification", label: "Verification" },
];

export default function SettingsTabs({ user, userRole, kycSubmission }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div>
      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === "profile" && <ProfileForm user={user} />}

      {activeTab === "verification" && (
        <div>
          {userRole === "organizer" || userRole === "admin" ? (
            <KycForm existingSubmission={kycSubmission} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400">
                Become an organizer by creating a campaign to access identity verification.
              </p>
              <Link
                href="/dashboard/campaigns/new"
                className="mt-4 inline-block font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
              >
                Create your first campaign
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
