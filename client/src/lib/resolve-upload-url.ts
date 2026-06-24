import { getBackendUrl } from "@/lib/backend-url";

/** Turn a Nest `/uploads/...` path into an absolute URL for Next.js Image. */
export function resolveUploadUrl(path?: string | null): string | undefined {
  if (!path?.trim()) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${getBackendUrl()}${path}`;
  return path;
}
