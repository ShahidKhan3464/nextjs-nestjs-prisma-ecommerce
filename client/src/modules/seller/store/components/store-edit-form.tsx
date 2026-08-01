"use client";

import { toast } from "sonner";
import type { Store } from "../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { updateMyStore } from "../services/store.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStoreSchema, type UpdateStoreValues } from "../schemas";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

type Props = {
  store: Store;
  disabled?: boolean;
};

export function StoreEditForm({ store, disabled }: Props) {
  const qc = useQueryClient();

  const form = useForm<UpdateStoreValues>({
    resolver: zodResolver(updateStoreSchema) as Resolver<UpdateStoreValues>,
    defaultValues: {
      name: store.name,
      description: store.description ?? "",
      address: store.address,
      city: store.city,
      postalCode: store.postalCode,
      country: store.country,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: UpdateStoreValues) =>
      updateMyStore({
        name: values.name,
        description: values.description?.trim() || "",
        address: values.address,
        city: values.city,
        postalCode: values.postalCode,
        country: values.country,
      }),
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.store.me, next);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.seller });
      form.reset({
        name: next.name,
        description: next.description ?? "",
        address: next.address,
        city: next.city,
        postalCode: next.postalCode,
        country: next.country,
      });
      toast.success("Store updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update store"));
    },
  });

  const locked = disabled || mutation.isPending;

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold">Edit store</h3>
        <p className="text-muted-foreground text-sm">
          Update your public storefront details. Changing the name regenerates
          the store slug.
        </p>
      </div>

      <Form {...form}>
        <form
          noValidate
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Store name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="organization"
                    disabled={locked}
                    {...field}
                  />
                </FormControl>
                <p className="text-muted-foreground text-xs">
                  Current slug:{" "}
                  <code className="bg-muted rounded px-1 py-0.5 text-xs">
                    {store.slug}
                  </code>
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="description"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    disabled={locked}
                    placeholder="Tell buyers what makes your store unique"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="street-address"
                    disabled={locked}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="city"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="address-level2"
                    disabled={locked}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="postalCode"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal code</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="postal-code"
                    disabled={locked}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="country"
            control={form.control}
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="country-name"
                    disabled={locked}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={locked}
            className="sm:col-span-2 sm:w-fit"
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Form>
    </section>
  );
}
