const DEFAULT_STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
  : "";

const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? DEFAULT_STORAGE_BASE;

/**
 * Resolve an image URL from a stored path or full URL.
 *
 * - `null`/`undefined` → `null` (caller keeps gradient fallback)
 * - Starts with `http` → returned as-is (Supabase URLs, Unsplash, etc.)
 * - Relative path → prepended with `NEXT_PUBLIC_STORAGE_BASE_URL`
 *
 * When migrating to R2, set `NEXT_PUBLIC_STORAGE_BASE_URL=https://your-r2.r2.dev`.
 */
export function getImageUrl(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith("http")) return urlOrPath;
  return `${STORAGE_BASE}/${urlOrPath}`;
}
