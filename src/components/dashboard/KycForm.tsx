"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ImageUploader from "@/components/campaigns/ImageUploader";
import { AlertIcon, CheckBadgeIcon, SpinnerIcon } from "@/components/icons";
import { Button, Select } from "@/components/ui";
import { type KycIdType, type KycStatus } from "@/lib/supabase/types";

interface KycFormProps {
  existingSubmission: {
    id: string;
    id_type: KycIdType;
    status: KycStatus;
    rejection_reason: string | null;
    created_at: string;
  } | null;
}

const ID_TYPE_VALUES: KycIdType[] = ["national_id", "passport", "drivers_license", "philsys"];

const ID_TYPE_OPTIONS = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "philsys", label: "PhilSys" },
];

export default function KycForm({ existingSubmission }: KycFormProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [idType, setIdType] = useState<KycIdType>("national_id");
  const [idFront, setIdFront] = useState<string[]>([]);
  const [idBack, setIdBack] = useState<string[]>([]);
  const [selfie, setSelfie] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Show status cards for existing submissions
  if (existingSubmission && !showForm) {
    if (existingSubmission.status === "approved") {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <CheckBadgeIcon className="h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">
              Your identity is verified
            </h3>
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              Your identity verification was approved. You can now create and manage campaigns.
            </p>
          </div>
        </div>
      );
    }

    if (existingSubmission.status === "pending") {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
          <SpinnerIcon className="h-6 w-6 flex-shrink-0 animate-spin text-yellow-600 dark:text-yellow-400" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
              Your verification is being reviewed
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
              We are currently reviewing your submitted documents. This typically takes 1-2 business
              days.
            </p>
          </div>
        </div>
      );
    }

    // Status is "rejected" at this point
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <AlertIcon className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Verification rejected</h3>
            {existingSubmission.rejection_reason && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Reason: {existingSubmission.rejection_reason}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>Resubmit verification</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    if (idFront.length === 0) {
      setError("ID front image is required");
      return;
    }
    if (idBack.length === 0) {
      setError("ID back image is required");
      return;
    }
    if (selfie.length === 0) {
      setError("Selfie image is required");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_type: idType,
        id_front_url: idFront[0],
        id_back_url: idBack[0],
        selfie_url: selfie[0],
      }),
    });

    if (res.ok) {
      setSuccess(true);
      router.refresh();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
      const data: { error?: string } = await res.json();
      setError(typeof data.error === "string" ? data.error : "Something went wrong");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
        <CheckBadgeIcon className="h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="font-semibold text-green-800 dark:text-green-300">
            Verification submitted
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Your documents have been submitted for review. We will notify you once the review is
            complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="max-w-lg space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div>
        <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-gray-100">
          Identity verification
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Submit a valid ID to verify your identity as a campaign organizer.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <Select
        id="idType"
        label="ID type"
        value={idType}
        onChange={(e) => {
          const selectedValue = ID_TYPE_VALUES.find((v) => v === e.target.value);
          if (selectedValue) setIdType(selectedValue);
        }}
        options={ID_TYPE_OPTIONS}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          ID front
        </label>
        <ImageUploader value={idFront} onChange={setIdFront} bucket="kyc-documents" />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          ID back
        </label>
        <ImageUploader value={idBack} onChange={setIdBack} bucket="kyc-documents" />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Selfie with ID
        </label>
        <ImageUploader value={selfie} onChange={setSelfie} bucket="kyc-documents" />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : "Submit for verification"}
      </Button>
    </form>
  );
}
