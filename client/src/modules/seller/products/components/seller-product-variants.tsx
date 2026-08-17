"use client";

import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import type { SellerVariantValues } from "../schemas";
import { SellerVariantForm } from "./seller-variant-form";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type {
  FormMode,
  SellerProduct,
  SellerProductVariant,
} from "../types";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSellerVariant,
  deleteSellerVariant,
  fetchSellerVariants,
  updateSellerVariant,
} from "../services/variants.service";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
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

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function VariantsTableSkeleton() {
  return (
    <div className="space-y-2 rounded-md border p-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-3/4" />
    </div>
  );
}

function syncProductDetailVariants(
  product: SellerProduct | undefined,
  variants: SellerProductVariant[]
): SellerProduct | undefined {
  if (!product) return product;
  const basePrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => v.price))
      : product.basePrice;
  return {
    ...product,
    variants,
    basePrice: Number.isFinite(basePrice) ? basePrice : product.basePrice,
  };
}

type Props = {
  productId: string;
  /** Seed / fallback while the dedicated variants query loads. */
  initialVariants?: SellerProductVariant[];
  /** When true, mutations are disabled (e.g. soft-deleted product). */
  readOnly?: boolean;
};

export function SellerProductVariants({
  productId,
  initialVariants = [],
  readOnly = false,
}: Props) {
  const qc = useQueryClient();
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [deleteTarget, setDeleteTarget] =
    useState<SellerProductVariant | null>(null);

  const variantsKey = queryKeys.seller.variants.byProduct(productId);
  const productKey = queryKeys.seller.products.detail(productId);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: variantsKey,
    queryFn: () =>
      fetchSellerVariants({ productId, page: 1, limit: 100 }),
    placeholderData: initialVariants.length
      ? {
          variants: initialVariants,
          pagination: {
            page: 1,
            limit: 100,
            total: initialVariants.length,
            totalPages: 1,
          },
        }
      : undefined,
  });

  const variants = data?.variants ?? initialVariants;
  const lowestPrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => v.price))
      : null;
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  const patchCaches = (
    nextVariants: SellerProductVariant[],
    options?: { replaceDetailVariant?: SellerProductVariant }
  ) => {
    qc.setQueryData(variantsKey, (prev: typeof data) => {
      if (!prev) {
        return {
          variants: nextVariants,
          pagination: {
            page: 1,
            limit: 100,
            total: nextVariants.length,
            totalPages: 1,
          },
        };
      }
      return {
        ...prev,
        variants: nextVariants,
        pagination: {
          ...prev.pagination,
          total: nextVariants.length,
        },
      };
    });

    const previousProduct = qc.getQueryData<SellerProduct>(productKey);
    const nextProduct = syncProductDetailVariants(
      previousProduct,
      nextVariants
    );
    if (nextProduct) {
      qc.setQueryData(productKey, nextProduct);
    }

    if (options?.replaceDetailVariant) {
      qc.setQueryData(
        queryKeys.seller.variants.detail(options.replaceDetailVariant.id),
        options.replaceDetailVariant
      );
    }
  };

  const invalidateRelated = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: variantsKey }),
      qc.invalidateQueries({ queryKey: productKey }),
      qc.invalidateQueries({ queryKey: queryKeys.seller.products.all }),
    ]);
  };

  const create = useMutation({
    mutationFn: (values: SellerVariantValues) =>
      createSellerVariant({ productId, ...values }),
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: variantsKey });
      await qc.cancelQueries({ queryKey: productKey });

      const previousVariants = qc.getQueryData<typeof data>(variantsKey);
      const previousProduct = qc.getQueryData<SellerProduct>(productKey);
      const current =
        previousVariants?.variants ?? previousProduct?.variants ?? variants;

      const optimistic: SellerProductVariant = {
        id: `optimistic-${Date.now()}`,
        productId,
        sku: values.sku.trim(),
        size: values.size.trim(),
        color: values.color.trim(),
        price: values.price,
        stock: values.stock,
      };
      patchCaches([...current, optimistic]);

      return { previousVariants, previousProduct };
    },
    onError: (err, _values, ctx) => {
      if (ctx?.previousVariants !== undefined) {
        qc.setQueryData(variantsKey, ctx.previousVariants);
      }
      if (ctx?.previousProduct !== undefined) {
        qc.setQueryData(productKey, ctx.previousProduct);
      }
      toast.error(getApiErrorMessage(err, "Could not create variant"));
    },
    onSuccess: async (variant) => {
      toast.success("Variant created");
      setFormMode({ type: "closed" });
      const current =
        qc.getQueryData<typeof data>(variantsKey)?.variants ?? variants;
      const next = [
        ...current.filter(
          (v) => !v.id.startsWith("optimistic-") && v.id !== variant.id
        ),
        variant,
      ];
      patchCaches(next, { replaceDetailVariant: variant });
      await invalidateRelated();
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: SellerVariantValues;
    }) => updateSellerVariant(id, values),
    onMutate: async ({ id, values }) => {
      await qc.cancelQueries({ queryKey: variantsKey });
      await qc.cancelQueries({ queryKey: productKey });

      const previousVariants = qc.getQueryData<typeof data>(variantsKey);
      const previousProduct = qc.getQueryData<SellerProduct>(productKey);
      const current =
        previousVariants?.variants ?? previousProduct?.variants ?? variants;

      const next = current.map((v) =>
        v.id === id
          ? {
              ...v,
              sku: values.sku.trim(),
              size: values.size.trim(),
              color: values.color.trim(),
              price: values.price,
              stock: values.stock,
            }
          : v
      );
      patchCaches(next);

      return { previousVariants, previousProduct };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousVariants !== undefined) {
        qc.setQueryData(variantsKey, ctx.previousVariants);
      }
      if (ctx?.previousProduct !== undefined) {
        qc.setQueryData(productKey, ctx.previousProduct);
      }
      toast.error(getApiErrorMessage(err, "Could not update variant"));
    },
    onSuccess: async (variant) => {
      toast.success("Variant updated");
      setFormMode({ type: "closed" });
      const current =
        qc.getQueryData<typeof data>(variantsKey)?.variants ?? variants;
      const next = current.map((v) => (v.id === variant.id ? variant : v));
      patchCaches(next, { replaceDetailVariant: variant });
      await invalidateRelated();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSellerVariant(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: variantsKey });
      await qc.cancelQueries({ queryKey: productKey });

      const previousVariants = qc.getQueryData<typeof data>(variantsKey);
      const previousProduct = qc.getQueryData<SellerProduct>(productKey);
      const current =
        previousVariants?.variants ?? previousProduct?.variants ?? variants;

      patchCaches(current.filter((v) => v.id !== id));

      return { previousVariants, previousProduct };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.previousVariants !== undefined) {
        qc.setQueryData(variantsKey, ctx.previousVariants);
      }
      if (ctx?.previousProduct !== undefined) {
        qc.setQueryData(productKey, ctx.previousProduct);
      }
      toast.error(getApiErrorMessage(err, "Could not delete variant"));
    },
    onSuccess: async () => {
      toast.success("Variant deleted");
      setDeleteTarget(null);
      if (formMode.type === "edit") {
        setFormMode({ type: "closed" });
      }
      await invalidateRelated();
    },
  });

  const formPending = create.isPending || update.isPending;
  const editingId =
    formMode.type === "edit" ? formMode.variant.id : null;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Variants
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage SKU, size, color, price, and stock for this product.
            {lowestPrice !== null ? (
              <span className="mt-1 block tabular-nums">
                From {formatMoney(lowestPrice)} · {totalStock} in stock ·{" "}
                {variants.length} variant{variants.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </p>
        </div>
        {!readOnly ? (
          <Button
            size="sm"
            onClick={() => setFormMode({ type: "create" })}
            disabled={formMode.type !== "closed" || formPending}
          >
            <PlusIcon className="mr-2 size-4" />
            Add variant
          </Button>
        ) : null}
      </div>

      {formMode.type === "create" ? (
        <SellerVariantForm
          mode="create"
          pending={create.isPending}
          onSubmit={(values) => create.mutate(values)}
          onCancel={() => setFormMode({ type: "closed" })}
        />
      ) : null}

      {formMode.type === "edit" ? (
        <SellerVariantForm
          mode="edit"
          initial={formMode.variant}
          pending={update.isPending}
          onCancel={() => setFormMode({ type: "closed" })}
          onSubmit={(values) =>
            update.mutate({ id: formMode.variant.id, values })
          }
        />
      ) : null}

      {isPending && !data && initialVariants.length === 0 ? (
        <VariantsTableSkeleton />
      ) : isError && variants.length === 0 ? (
        <div className="rounded-md border px-4 py-8 text-center">
          <p className="text-muted-foreground text-sm">
            {getApiErrorMessage(error, "Could not load variants")}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                {!readOnly ? (
                  <TableHead className="w-[1%] text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={readOnly ? 5 : 6}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    No variants yet. Add one to sell this product.
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((v) => (
                  <TableRow
                    key={v.id}
                    data-editing={editingId === v.id ? "" : undefined}
                    className={
                      editingId === v.id ? "bg-muted/40" : undefined
                    }
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {v.sku}
                    </TableCell>
                    <TableCell>{v.size}</TableCell>
                    <TableCell>{v.color}</TableCell>
                    <TableCell className="tabular-nums whitespace-nowrap">
                      {formatMoney(v.price)}
                    </TableCell>
                    <TableCell className="tabular-nums">{v.stock}</TableCell>
                    {!readOnly ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Edit ${v.sku}`}
                            disabled={formPending || formMode.type !== "closed"}
                            onClick={() =>
                              setFormMode({ type: "edit", variant: v })
                            }
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Delete ${v.sku}`}
                            disabled={formPending || remove.isPending}
                            onClick={() => setDeleteTarget(v)}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      )}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variant?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `SKU "${deleteTarget.sku}" (${deleteTarget.size} / ${deleteTarget.color}) will be permanently removed. Variants referenced by orders cannot be deleted.`
                : "This variant will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending || !deleteTarget}
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget.id);
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
