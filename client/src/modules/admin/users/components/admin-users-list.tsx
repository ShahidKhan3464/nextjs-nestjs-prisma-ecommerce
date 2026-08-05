"use client";

import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { BlockTarget } from "../types";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { queryKeys } from "@/constants/query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { Eye, Ban, CheckCircle } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { AdminTableSkeleton } from "@/modules/admin/shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { fetchAdminUsers, blockAdminUser } from "../services/users.service";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

function blockedFilterParam(statusFilter: string): boolean | undefined {
  if (statusFilter === "blocked") return true;
  if (statusFilter === "active") return false;
  return undefined;
}

export function AdminUsersList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const isBlockedFilter = blockedFilterParam(statusFilter);
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const [blockTarget, setBlockTarget] = useState<BlockTarget | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: [
      ...queryKeys.admin.users,
      {
        search: debouncedSearch,
        page,
        perPage,
        isBlocked: isBlockedFilter,
      },
    ] as const,
    queryFn: () =>
      fetchAdminUsers({
        limit: perPage,
        page,
        search: debouncedSearch || undefined,
        isBlocked: isBlockedFilter,
      }),
    placeholderData: (prev) => prev,
  });

  const blockMutation = useMutation({
    mutationFn: ({
      id,
      isBlocked,
    }: {
      id: string | number;
      isBlocked: boolean;
    }) => blockAdminUser(id, isBlocked),
    onSuccess: async (_, vars) => {
      toast.success(`User ${vars.isBlocked ? "blocked" : "unblocked"}`);
      setBlockTarget(null);
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Action failed")),
  });

  if (isPending && !data) {
    return (
      <AdminTableSkeleton
        filterWidths={["w-72", "w-32", "w-24"]}
        columns={[
          { className: "flex-1" },
          { className: "flex-1" },
          { className: "flex-1" },
          { className: "flex-1 max-w-[120px]" },
          { className: "w-20" },
          { className: "w-20" },
          { className: "w-32 shrink-0", isAction: true },
        ]}
      />
    );
  }

  if (!data) {
    return null;
  }

  const total = data.meta.totalItems ?? 0;
  const hasSearch = debouncedSearch.trim().length > 0;
  const hasStatusFilter = statusFilter !== "active";
  const isEmptyCatalog = total === 0 && !hasSearch && !hasStatusFilter;
  const showPagination = total > 0;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <div className="w-72">
            <Input
              value={searchInput}
              disabled={isEmptyCatalog}
              placeholder="Search by name, email or phone"
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-32">
            <Select
              value={statusFilter}
              disabled={isEmptyCatalog}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger className="w-full!" disabled={isEmptyCatalog}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() =>
              qc.invalidateQueries({ queryKey: queryKeys.admin.users })
            }
          >
            Refresh
          </Button>
        </div>

        <div
          className={
            isFetching && !isPlaceholderData
              ? "opacity-60 transition-opacity"
              : ""
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.phoneNumber || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length > 0 ? (
                          u.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={
                                role === "SUPER_ADMIN" ? "default" : "outline"
                              }
                            >
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {u.isBlocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={ROUTES.user(u.id)}
                          aria-label={`View ${u.fullName}`}
                          className={cn(
                            buttonVariants({ size: "icon", variant: "outline" })
                          )}
                        >
                          <Eye className="size-4" />
                        </Link>
                        <Button
                          size="icon"
                          variant={u.isBlocked ? "outline" : "destructive"}
                          title={u.isBlocked ? "Unblock user" : "Block user"}
                          disabled={blockMutation.isPending}
                          onClick={() =>
                            setBlockTarget({
                              user: u,
                              isBlocked: !u.isBlocked,
                            })
                          }
                        >
                          {u.isBlocked ? (
                            <CheckCircle className="size-4" />
                          ) : (
                            <Ban className="size-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {showPagination ? (
            <Pagination
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              totalPages={data.meta.totalPages || 1}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={!!blockTarget}
        onOpenChange={(open) => {
          if (!open) setBlockTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockTarget?.isBlocked ? "Block user?" : "Unblock user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget
                ? blockTarget.isBlocked
                  ? `"${blockTarget.user.fullName}" will no longer be able to sign in or place orders.`
                  : `"${blockTarget.user.fullName}" will regain access to their account.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={blockTarget?.isBlocked ? "destructive" : "default"}
              disabled={blockMutation.isPending}
              onClick={() => {
                if (blockTarget) {
                  blockMutation.mutate({
                    id: blockTarget.user.id,
                    isBlocked: blockTarget.isBlocked,
                  });
                }
              }}
            >
              {blockTarget?.isBlocked ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
