"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useIsSeller } from "@/modules/auth";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { Separator } from "@/components/ui/separator";
import { ProductStatusBadge } from "./product-status-badge";
import { formatFilterLabel } from "@/lib/format-filter-label";
import { Button, buttonVariants } from "@/components/ui/button";
import { SellerProductVariants } from "./seller-product-variants";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  canArchiveProduct,
  canPublishProduct,
  canRestoreProduct,
  type SellerProduct,
} from "../types";
import {
  archiveSellerProduct,
  deleteSellerProduct,
  fetchSellerProduct,
  publishSellerProduct,
  restoreSellerProduct,
} from "../services/products.service";
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

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="aspect-square rounded-lg" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function SellerProductDetail({ productId }: { productId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isSeller = useIsSeller();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.seller.products.detail(productId),
    queryFn: () => fetchSellerProduct(productId),
    enabled: isSeller && Boolean(productId),
  });

  const invalidate = async (product?: SellerProduct | null) => {
    await qc.invalidateQueries({ queryKey: queryKeys.seller.products.all });
    if (product) {
      qc.setQueryData(queryKeys.seller.products.detail(product.id), product);
    } else {
      await qc.invalidateQueries({
        queryKey: queryKeys.seller.products.detail(productId),
      });
    }
  };

  const publish = useMutation({
    mutationFn: () => publishSellerProduct(productId),
    onMutate: async () => {
      await qc.cancelQueries({
        queryKey: queryKeys.seller.products.detail(productId),
      });
      const previous = qc.getQueryData<SellerProduct>(
        queryKeys.seller.products.detail(productId)
      );
      if (previous) {
        qc.setQueryData(queryKeys.seller.products.detail(productId), {
          ...previous,
          status: "ACTIVE",
        });
      }
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(
          queryKeys.seller.products.detail(productId),
          ctx.previous
        );
      }
      toast.error(getApiErrorMessage(err, "Could not publish product"));
    },
    onSuccess: async (product) => {
      toast.success("Product published");
      await invalidate(product);
    },
  });

  const archive = useMutation({
    mutationFn: () => archiveSellerProduct(productId),
    onMutate: async () => {
      await qc.cancelQueries({
        queryKey: queryKeys.seller.products.detail(productId),
      });
      const previous = qc.getQueryData<SellerProduct>(
        queryKeys.seller.products.detail(productId)
      );
      if (previous) {
        qc.setQueryData(queryKeys.seller.products.detail(productId), {
          ...previous,
          status: "ARCHIVED",
        });
      }
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(
          queryKeys.seller.products.detail(productId),
          ctx.previous
        );
      }
      toast.error(getApiErrorMessage(err, "Could not archive product"));
    },
    onSuccess: async (product) => {
      toast.success("Product archived");
      await invalidate(product);
    },
  });

  const restore = useMutation({
    mutationFn: () => restoreSellerProduct(productId),
    onMutate: async () => {
      await qc.cancelQueries({
        queryKey: queryKeys.seller.products.detail(productId),
      });
      const previous = qc.getQueryData<SellerProduct>(
        queryKeys.seller.products.detail(productId)
      );
      if (previous) {
        qc.setQueryData(queryKeys.seller.products.detail(productId), {
          ...previous,
          isRemoved: false,
          status: "ACTIVE",
        });
      }
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(
          queryKeys.seller.products.detail(productId),
          ctx.previous
        );
      }
      toast.error(getApiErrorMessage(err, "Could not restore product"));
    },
    onSuccess: async (product) => {
      toast.success("Product restored");
      await invalidate(product);
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteSellerProduct(productId),
    onSuccess: async () => {
      toast.success("Product removed");
      setConfirmDelete(false);
      await qc.invalidateQueries({ queryKey: queryKeys.seller.products.all });
      router.push(ROUTES.products);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Could not delete product")),
  });

  if (!isSeller) {
    return (
      <EmptyState
        title="Seller access required"
        description="Only approved sellers can manage store products."
      />
    );
  }

  if (isPending) {
    return <DetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Could not load product"
        description={getApiErrorMessage(error, "This product may not belong to your store.")}
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? "Retrying…" : "Retry"}
            </Button>
            <Link
              href={ROUTES.products}
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            >
              Back to products
            </Link>
          </div>
        }
      />
    );
  }

  const product = data;
  const gallery = product.images.filter(
    (img) => img.urlPath !== "/placeholder.svg"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <ProductStatusBadge product={product} />
          </div>
          <p className="text-muted-foreground text-sm">
            {formatFilterLabel(product.category) || "Uncategorized"}
            {product.slug ? ` · ${product.slug}` : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!product.isRemoved ? (
            <Link
              href={ROUTES.productEdit(product.id)}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Edit
            </Link>
          ) : null}
          {canPublishProduct(product) ? (
            <Button
              size="sm"
              variant="outline"
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
            >
              Publish
            </Button>
          ) : null}
          {canArchiveProduct(product) ? (
            <Button
              size="sm"
              variant="outline"
              disabled={archive.isPending}
              onClick={() => archive.mutate()}
            >
              Archive
            </Button>
          ) : null}
          {canRestoreProduct(product) ? (
            <Button
              size="sm"
              variant="outline"
              disabled={restore.isPending}
              onClick={() => restore.mutate()}
            >
              Restore
            </Button>
          ) : null}
          {!product.isRemoved ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      {gallery.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {gallery.map((img) => (
            <div
              key={`${img.id}-${img.urlPath}`}
              className="bg-muted relative aspect-square overflow-hidden rounded-lg border"
            >
              <Image
                fill
                unoptimized
                src={img.url}
                alt={product.name}
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-muted text-muted-foreground flex aspect-3/1 items-center justify-center rounded-lg border text-sm">
          No images uploaded
        </div>
      )}

      <Separator />

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Description
        </h2>
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {product.description?.trim()
            ? product.description
            : "No description provided."}
        </p>
      </section>

      <SellerProductVariants
        productId={product.id}
        readOnly={product.isRemoved}
        initialVariants={product.variants}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove product?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${product.name}" will be removed from your catalog. You can restore it later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
