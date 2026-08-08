import { queryKeys } from "@/constants/query-keys";
import type { QueryClient } from "@tanstack/react-query";

/** Invalidate payment + related order/dashboard/notification caches after mutations. */
export async function invalidatePaymentQueries(
  qc: QueryClient,
  paymentId?: string | number
) {
  const tasks = [
    qc.invalidateQueries({ queryKey: queryKeys.admin.payments.all }),
    qc.invalidateQueries({ queryKey: queryKeys.seller.payments.all }),
    qc.invalidateQueries({ queryKey: queryKeys.admin.orders() }),
    qc.invalidateQueries({ queryKey: queryKeys.seller.orders.all }),
    qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
    qc.invalidateQueries({ queryKey: queryKeys.admin.analytics }),
    qc.invalidateQueries({ queryKey: queryKeys.dashboard.seller }),
    qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
    qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount }),
  ];

  if (paymentId != null) {
    const id = String(paymentId);
    tasks.push(
      qc.invalidateQueries({ queryKey: queryKeys.admin.payments.detail(id) }),
      qc.invalidateQueries({ queryKey: queryKeys.seller.payments.detail(id) })
    );
  }

  await Promise.all(tasks);
}
