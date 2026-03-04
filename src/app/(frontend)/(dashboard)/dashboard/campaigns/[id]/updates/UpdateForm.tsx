"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SpinnerIcon } from "@/components/icons";
import { Button, Input, Textarea } from "@/components/ui";

interface UpdateFormProps {
  campaignId: string;
}

export default function UpdateForm({ campaignId }: UpdateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/campaigns/${campaignId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content: content.trim() }),
    });

    if (!res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
      const body: Record<string, unknown> = await res.json();
      const errMsg = typeof body.error === "string" ? body.error : "Something went wrong";
      setError(errMsg);
      setLoading(false);
      return;
    }

    setTitle("");
    setContent("");
    setSuccess("Update posted successfully!");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-600 dark:bg-teal-900/20 dark:text-teal-400">
          {success}
        </div>
      )}

      <Input
        id="update-title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Milestone reached!"
        required
      />

      <Textarea
        id="update-content"
        label="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your progress with donors..."
        rows={4}
        required
      />

      <Button type="submit" disabled={loading} size="sm">
        {loading ? <SpinnerIcon className="h-5 w-5 animate-spin" /> : "Post Update"}
      </Button>
    </form>
  );
}
