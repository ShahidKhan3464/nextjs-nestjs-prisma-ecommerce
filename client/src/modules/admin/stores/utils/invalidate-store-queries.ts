import { queryKeys } from "@/constants/query-keys";
import type { QueryClient } from "@tanstack/react-query";

export async function invalidateAdminStoreQueries(
  qc: QueryClient,
  storeId?: string | number
) {
  const tasks = [
    qc.invalidateQueries({ queryKey: queryKeys.admin.stores.all }),
    qc.invalidateQueries({ queryKey: queryKeys.stores.all }),
    qc.invalidateQueries({ queryKey: queryKeys.admin.sellerProfiles }),
    qc.invalidateQueries({ queryKey: queryKeys.admin.analytics }),
    qc.invalidateQueries({ queryKey: queryKeys.store.me }),
    qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount }),
  ];

  if (storeId != null) {
    tasks.push(
      qc.invalidateQueries({
        queryKey: queryKeys.admin.stores.detail(String(storeId)),
      })
    );
  }

  await Promise.all(tasks);
}
