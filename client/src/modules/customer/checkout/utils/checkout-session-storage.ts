import type {
  CheckoutSuccessSnapshot,
  PersistedCheckoutSession,
} from "../types";

const SESSION_KEY = "prisma-ecommerce:checkout-session";
const SUCCESS_KEY = "prisma-ecommerce:checkout-success";

const MAX_SESSION_AGE_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUCCESS_AGE_MS = 30 * 60 * 1000; // 30 minutes

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function persistCheckoutSession(
  session: PersistedCheckoutSession
): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Quota / private mode — ignore.
  }
}

export function loadPersistedCheckoutSession(): PersistedCheckoutSession | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedCheckoutSession;
    if (!parsed?.paymentIntentId || !parsed?.clientSecret) return null;
    const age = Date.now() - new Date(parsed.createdAt).getTime();
    if (!Number.isFinite(age) || age > MAX_SESSION_AGE_MS) {
      clearPersistedCheckoutSession();
      return null;
    }
    return parsed;
  } catch {
    clearPersistedCheckoutSession();
    return null;
  }
}

export function clearPersistedCheckoutSession(): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function persistCheckoutSuccess(snapshot: CheckoutSuccessSnapshot): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function loadCheckoutSuccess(): CheckoutSuccessSnapshot | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(SUCCESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutSuccessSnapshot;
    if (!parsed?.orders?.length) return null;
    const age = Date.now() - new Date(parsed.completedAt).getTime();
    if (!Number.isFinite(age) || age > MAX_SUCCESS_AGE_MS) {
      clearCheckoutSuccess();
      return null;
    }
    return parsed;
  } catch {
    clearCheckoutSuccess();
    return null;
  }
}

export function clearCheckoutSuccess(): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(SUCCESS_KEY);
  } catch {
    // ignore
  }
}
