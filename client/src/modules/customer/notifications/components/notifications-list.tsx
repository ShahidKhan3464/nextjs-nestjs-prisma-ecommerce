"use client";

import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { NotificationCard } from "@/shared/components/marketplace/notification-card";
import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
} from "../constants";
import type {
  ReadFilter,
  ListFilters,
  NotificationType,
  NotificationListResult,
} from "../types";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notifications.service";

const PAGE_SIZE = 10;

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

function flattenPages(
  data: InfiniteData<NotificationListResult> | undefined
) {
  return data?.pages.flatMap((p) => p.notifications) ?? [];
}

export function NotificationsList() {
  const qc = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const filters: ListFilters = useMemo(() => {
    const next: ListFilters = {};
    if (typeFilter !== "all") next.type = typeFilter as NotificationType;
    if (readFilter === "unread") next.isRead = false;
    if (readFilter === "read") next.isRead = true;
    return next;
  }, [typeFilter, readFilter]);

  const listKey = queryKeys.notifications.list({
    ...filters,
    infinite: true,
  });

  const {
    data,
    isPending,
    isError,
    refetch,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: listKey,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchNotifications({
        ...filters,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (last) => {
      const totalPages = Math.max(1, Math.ceil(last.total / last.limit));
      return last.page < totalPages ? last.page + 1 : undefined;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages.length]);

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous =
        qc.getQueryData<InfiniteData<NotificationListResult>>(listKey);

      if (previous) {
        qc.setQueryData<InfiniteData<NotificationListResult>>(listKey, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.id === id
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            ),
          })),
        });
      }
      return { previous };
    },
    onError: (error, _id, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(listKey, ctx.previous);
      }
      toast.error(getApiErrorMessage(error, "Could not mark as read"));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: listKey });
      const previous =
        qc.getQueryData<InfiniteData<NotificationListResult>>(listKey);

      if (previous) {
        qc.setQueryData<InfiniteData<NotificationListResult>>(listKey, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.isRead
                ? n
                : { ...n, isRead: true, readAt: new Date().toISOString() }
            ),
          })),
        });
      }
      return { previous };
    },
    onSuccess: (count) => {
      toast.success(
        count > 0 ? `Marked ${count} as read` : "Nothing unread"
      );
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(listKey, ctx.previous);
      }
      toast.error(getApiErrorMessage(error, "Could not mark all as read"));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const notifications = flattenPages(data);
  const total = data?.pages[0]?.total ?? 0;
  const hasFilters = typeFilter !== "all" || readFilter !== "all";

  if (isPending) return <NotificationsSkeleton />;

  if (isError) {
    return (
      <EmptyState
        title="Could not load notifications"
        description="Something went wrong while loading your notifications."
        action={
          <Button type="button" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="w-full space-y-2 sm:w-48">
            <Label>Type</Label>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                if (v == null) return;
                setTypeFilter(v);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {NOTIFICATION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-2 sm:w-40">
            <Label>Status</Label>
            <Select
              value={readFilter}
              onValueChange={(v) => {
                if (v == null) return;
                setReadFilter(v as ReadFilter);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          size="sm"
          type="button"
          variant="outline"
          disabled={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Mark all as read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching notifications" : "No notifications"}
          description={
            hasFilters
              ? "Try a different type or read status filter."
              : "Marketplace updates about orders, stock, and seller status will appear here."
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <NotificationCard
                  id={notification.id}
                  type={notification.type}
                  title={notification.title}
                  isRead={notification.isRead}
                  message={notification.message}
                  createdAt={notification.createdAt}
                  markReadPending={markOne.isPending}
                  onMarkRead={(id) => markOne.mutate(id)}
                />
              </li>
            ))}
          </ul>

          <div ref={loadMoreRef} className="flex justify-center py-2">
            {isFetchingNextPage ? (
              <p className="text-muted-foreground text-sm">Loading more…</p>
            ) : hasNextPage ? (
              <Button
              size="sm"
                type="button"
                variant="ghost"
                onClick={() => void fetchNextPage()}
              >
                Load more
              </Button>
            ) : total > PAGE_SIZE ? (
              <p className="text-muted-foreground text-xs">End of list</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
