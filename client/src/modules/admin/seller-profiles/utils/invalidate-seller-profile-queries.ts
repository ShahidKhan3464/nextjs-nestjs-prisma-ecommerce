import { queryKeys } from "@/constants/query-keys";
import type { QueryClient } from "@tanstack/react-query";

/** Invalidate list/detail + dashboard + notification queries after status changes. */
export async function invalidateSellerProfileQueries(
  qc: QueryClient,
  profileId?: string | number
) {
  const tasks = [
    qc.invalidateQueries({ queryKey: queryKeys.admin.sellerProfiles }),
    qc.invalidateQueries({ queryKey: queryKeys.admin.analytics }),
    qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount }),
    qc.invalidateQueries({ queryKey: queryKeys.sellerProfile.me }),
  ];

  if (profileId != null) {
    tasks.push(
      qc.invalidateQueries({
        queryKey: queryKeys.admin.sellerProfile(String(profileId)),
      })
    );
  }

  await Promise.all(tasks);
}
