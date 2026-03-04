"use client";

import { useState } from "react";

import ImageUploader from "@/components/campaigns/ImageUploader";
import { CheckCircleIcon, SpinnerIcon } from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [avatar, setAvatar] = useState<string[]>(user.avatar_url ? [user.avatar_url] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        avatar_url: avatar[0] ?? null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="max-w-lg space-y-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircleIcon className="h-5 w-5" />
          Profile updated successfully.
        </div>
      )}

      <Input
        id="fullName"
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Juan Dela Cruz"
      />

      <Input
        id="username"
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="juandelacruz"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar</label>
        <ImageUploader value={avatar} onChange={setAvatar} bucket="avatars" />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : "Save changes"}
      </Button>
    </form>
  );
}
