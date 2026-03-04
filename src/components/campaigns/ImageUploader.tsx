"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { CloseIcon, ImageIcon, SpinnerIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: "campaign-images" | "kyc-documents" | "avatars";
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  bucket,
  multiple = false,
  maxFiles = 5,
  className,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = [...files];
      const remaining = maxFiles - value.length;
      const toUpload = multiple ? fileArray.slice(0, remaining) : [fileArray[0]];

      setUploading(true);
      const newUrls: string[] = [];

      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", bucket);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- res.json() returns any
          const data: { url: string } = await res.json();
          newUrls.push(data.url);
        }
      }

      if (multiple) {
        onChange([...value, ...newUrls]);
      } else {
        onChange(newUrls.length > 0 ? [newUrls[0]] : value);
      }
      setUploading(false);
    },
    [bucket, maxFiles, multiple, onChange, value],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        void upload(e.dataTransfer.files);
      }
    },
    [upload],
  );

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const canAddMore = multiple ? value.length < maxFiles : value.length === 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, i) => (
            <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-lg">
              <Image src={url} alt={`Upload ${String(i + 1)}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
            dragActive
              ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
              : "border-gray-300 hover:border-teal-400 dark:border-gray-600",
          )}
        >
          {uploading ? (
            <SpinnerIcon className="h-8 w-8 animate-spin text-teal-500" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {multiple
                  ? "Drop images here or click to upload"
                  : "Drop image here or click to upload"}
              </p>
              <p className="mt-1 text-xs text-gray-400">Max 5MB per file</p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files);
        }}
        className="hidden"
      />
    </div>
  );
}
