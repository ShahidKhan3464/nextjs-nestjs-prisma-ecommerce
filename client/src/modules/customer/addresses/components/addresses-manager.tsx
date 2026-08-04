"use client";

import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { UserAddress } from "../types";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { addressSchema, type AddressFormValues } from "../schemas";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../services/addresses.service";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

function AddressesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}

const emptyForm: AddressFormValues = {
  label: "",
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "PK",
  phone: "",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

export function AddressesManager() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const { data: addresses = [], isPending } = useQuery({
    queryKey: queryKeys.addresses.all,
    queryFn: fetchAddresses,
  });

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema) as Resolver<AddressFormValues>,
    defaultValues: emptyForm,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.addresses.all });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.addresses.all });
      const previous = qc.getQueryData<UserAddress[]>(queryKeys.addresses.all);
      const optimistic: UserAddress = {
        id: `temp-${Date.now()}`,
        userId: "me",
        label: input.label || null,
        fullName: input.fullName,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        country: input.country,
        phone: input.phone || null,
        isDefaultShipping: Boolean(input.isDefaultShipping),
        isDefaultBilling: Boolean(input.isDefaultBilling),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<UserAddress[]>(queryKeys.addresses.all, (old = []) => [
        optimistic,
        ...old,
      ]);
      return { previous };
    },
    onError: (error, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.addresses.all, ctx.previous);
      toast.error(getApiErrorMessage(error, "Could not save address"));
    },
    onSuccess: () => {
      toast.success("Address saved");
      setShowForm(false);
      form.reset(emptyForm);
    },
    onSettled: () => void invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: AddressFormValues;
    }) => updateAddress(id, body),
    onSuccess: () => {
      toast.success("Address updated");
      setEditingId(null);
      setShowForm(false);
      form.reset(emptyForm);
      void invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update address"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.addresses.all });
      const previous = qc.getQueryData<UserAddress[]>(queryKeys.addresses.all);
      qc.setQueryData<UserAddress[]>(queryKeys.addresses.all, (old = []) =>
        old.filter((a) => a.id !== id)
      );
      return { previous };
    },
    onError: (error, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.addresses.all, ctx.previous);
      toast.error(getApiErrorMessage(error, "Could not delete address"));
    },
    onSuccess: () => toast.success("Address deleted"),
    onSettled: () => void invalidate(),
  });

  const defaultMutation = useMutation({
    mutationFn: ({
      id,
      shipping,
      billing,
    }: {
      id: string;
      shipping?: boolean;
      billing?: boolean;
    }) => setDefaultAddress(id, { shipping, billing }),
    onSuccess: () => {
      toast.success("Default updated");
      void invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update default"));
    },
  });

  function startCreate() {
    setEditingId(null);
    form.reset(emptyForm);
    setShowForm(true);
  }

  function startEdit(address: UserAddress) {
    setEditingId(address.id);
    form.reset({
      label: address.label ?? "",
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone ?? "",
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    });
    setShowForm(true);
  }

  function onSubmit(values: AddressFormValues) {
    const body = {
      ...values,
      label: values.label?.trim() || undefined,
      line2: values.line2?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, body });
    } else {
      createMutation.mutate(body);
    }
  }

  if (isPending) return <AddressesSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button type="button" onClick={startCreate}>
          Add address
        </Button>
      </div>

      {showForm ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 rounded-xl border p-4"
          >
            <h2 className="font-heading text-lg font-semibold">
              {editingId ? "Edit address" : "New address"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="label"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Label (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Home, Office…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="line1"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 1</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-line1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="line2"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Address line 2</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-line2" {...field} />
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
                      <Input autoComplete="address-level2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="region"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Region</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input autoComplete="postal-code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="country"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input autoComplete="country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="isDefaultShipping"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Default shipping
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                name="isDefaultBilling"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Default billing
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingId ? "Update" : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  form.reset(emptyForm);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      {addresses.length === 0 && !showForm ? (
        <EmptyState
          title="No saved addresses"
          description="Add a shipping or billing address for faster checkout."
          action={
            <Button type="button" onClick={startCreate}>
              Add address
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className={cn(
                "space-y-3 rounded-xl border p-4",
                address.id.startsWith("temp-") && "opacity-70"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">
                      {address.label || address.fullName}
                    </p>
                    {address.isDefaultShipping ? (
                      <Badge variant="secondary">Default shipping</Badge>
                    ) : null}
                    {address.isDefaultBilling ? (
                      <Badge variant="secondary">Default billing</Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {address.fullName}
                    <br />
                    {address.line1}
                    {address.line2 ? (
                      <>
                        <br />
                        {address.line2}
                      </>
                    ) : null}
                    <br />
                    {address.city}, {address.region} {address.postalCode}
                    <br />
                    {address.country}
                    {address.phone ? (
                      <>
                        <br />
                        {address.phone}
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => startEdit(address)}
                  >
                    <Pencil className="mr-1 size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(address.id)}
                  >
                    <Trash2 className="mr-1 size-3.5" /> Delete
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!address.isDefaultShipping ? (
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    disabled={defaultMutation.isPending}
                    onClick={() =>
                      defaultMutation.mutate({
                        id: address.id,
                        shipping: true,
                      })
                    }
                  >
                    Set default shipping
                  </Button>
                ) : null}
                {!address.isDefaultBilling ? (
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    disabled={defaultMutation.isPending}
                    onClick={() =>
                      defaultMutation.mutate({
                        id: address.id,
                        billing: true,
                      })
                    }
                  >
                    Set default billing
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
