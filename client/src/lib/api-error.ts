import { isAxiosError } from "axios";

const GENERIC_API_ERROR_MESSAGE = "Something went wrong. Please try again.";

function messageFromPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const raw = (data as { message?: unknown }).message;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw)) {
    const parts = raw.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
    if (parts.length > 0) return parts.join(", ");
  }
  const error = (data as { error?: unknown }).error;
  if (typeof error === "string" && error.trim()) return error.trim();
  return null;
}

function isTechnicalMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  return (
    /^Request failed with status code \d+$/i.test(trimmed) ||
    /^Network Error$/i.test(trimmed) ||
    /^timeout of \d+ms exceeded$/i.test(trimmed) ||
    /^Failed to fetch$/i.test(trimmed)
  );
}

/** Extract a user-facing message from API/axios errors (Nest or Next route handlers). */
export function getApiErrorMessage(
  error: unknown,
  fallback = GENERIC_API_ERROR_MESSAGE
): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const fromBody = messageFromPayload(error.response?.data);
    if (fromBody) return fromBody;
    if (status && status >= 500) return GENERIC_API_ERROR_MESSAGE;
    if (error.message?.trim() && !isTechnicalMessage(error.message)) {
      return error.message;
    }
    return fallback;
  }
  if (error instanceof Error && error.message.trim()) {
    if (isTechnicalMessage(error.message)) {
      return fallback;
    }
    return error.message;
  }
  return fallback;
}

export function isAccountBlockedMessage(message: string): boolean {
  return message.toLowerCase().includes("blocked");
}
