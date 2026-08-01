"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SellerProductVariant } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { DEFAULT_PRODUCT_VARIANT } from "../lib/product-form";
import {
  sellerVariantSchema,
  type SellerVariantValues,
} from "../schemas";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

type Props = {
  mode: "create" | "edit";
  initial?: SellerProductVariant | null;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (values: SellerVariantValues) => void;
};

export function SellerVariantForm({
  mode,
  initial,
  pending = false,
  onCancel,
  onSubmit,
}: Props) {
  const form = useForm<SellerVariantValues>({
    resolver: zodResolver(sellerVariantSchema) as Resolver<SellerVariantValues>,
    defaultValues: initial
      ? {
          size: initial.size,
          color: initial.color,
          sku: initial.sku,
          stock: initial.stock,
          price: initial.price,
        }
      : { ...DEFAULT_PRODUCT_VARIANT },
  });

  useEffect(() => {
    if (initial) {
      form.reset({
        size: initial.size,
        color: initial.color,
        sku: initial.sku,
        stock: initial.stock,
        price: initial.price,
      });
    } else {
      form.reset({ ...DEFAULT_PRODUCT_VARIANT });
    }
  }, [initial, form]);

  return (
    <Form {...form}>
      <form
        className="space-y-4 rounded-md border p-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-1">
          <h3 className="font-heading text-base font-semibold tracking-tight">
            {mode === "create" ? "Add variant" : "Edit variant"}
          </h3>
          <p className="text-muted-foreground text-sm">
            Set SKU, size, color, price, and stock for this product.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="SKU-001"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="M"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="Black"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    inputMode="decimal"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={1}
                    min={0}
                    inputMode="numeric"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending
              ? mode === "create"
                ? "Adding…"
                : "Saving…"
              : mode === "create"
                ? "Add variant"
                : "Save changes"}
          </Button>
          <Button
            size="sm"
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
