import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { logoutRequest } from "@/modules/auth";
import { useAuthStore } from "@/store/auth-store";
import { resetCartWishlistSession } from "@/lib/cart-wishlist-session";
import { getApiErrorMessage, isAccountBlockedMessage } from "@/lib/api-error";

export const ACCOUNT_BLOCKED_MESSAGE =
  "Your account has been blocked. Please contact support.";

let forcedLogoutInProgress = false;

/** Clear client session and cookies when the account is blocked mid-session. */
async function forceBlockedLogout(
  message = ACCOUNT_BLOCKED_MESSAGE
): Promise<void> {
  if (forcedLogoutInProgress) return;
  forcedLogoutInProgress = true;

  useAuthStore.getState().clearSession();
  resetCartWishlistSession();
  try {
    await logoutRequest();
  } catch {
    /* ignore */
  }

  if (typeof window !== "undefined") {
    toast.error(message);
    const login = new URL(ROUTES.login, window.location.origin);
    login.searchParams.set("blocked", "1");
    window.location.assign(login.toString());
  }

  forcedLogoutInProgress = false;
}

export function handlePossibleBlockedApiError(error: unknown): boolean {
  const message = getApiErrorMessage(error, "");
  if (!message || !isAccountBlockedMessage(message)) return false;
  void forceBlockedLogout(message);
  return true;
}
