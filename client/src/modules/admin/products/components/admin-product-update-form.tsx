"use client";

import { toast } from "sonner";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { productSchema, type ProductValues } from "../schemas";
import { type Product } from "@/modules/customer/products/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { updateAdminProduct } from "../services/products.service";
import { useProductImageFilePreviews } from "../hooks/use-product-image-previews";
import { fetchAdminCategories } from "../../categories/services/categories.service";
import {
  parseCategoryId,
  sortCategoriesByName,
  DEFAULT_PRODUCT_VARIANT,
  mapFormVariantsToPayload,
  mapProductImagesToRetainPaths,
  mapProductVariantsToFormValues,
} from "../lib/product-form";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export function AdminProductUpdateForm({ initial }: { initial: Product }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const { objectUrlFor, revokeFile, previewKey } =
    useProductImageFilePreviews();
  const [existingImages, setExistingImages] = useState<string[]>(
    initial.images
  );

  const { data: categoriesResp, isPending: categoriesLoading } = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => fetchAdminCategories({ limit: 200 }),
  });

  const categoryOptions = sortCategoriesByName(
    categoriesResp?.categories ?? []
  );

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductValues>,
    defaultValues: {
      categoryId: "",
      name: initial.name,
      description: initial.description || "",
      variants: mapProductVariantsToFormValues(initial.variants),
    },
  });

  useEffect(() => {
    setExistingImages(initial.images);
  }, [initial.images]);

  useEffect(() => {
    const categories = categoriesResp?.categories ?? [];
    const found = categories.find((c) => c.name === initial.category);
    form.reset({
      name: initial.name,
      description: initial.description || "",
      categoryId: found ? String(found.id) : "",
      variants: mapProductVariantsToFormValues(initial.variants),
    });
  }, [initial, categoriesResp?.categories, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return;
    setNewFiles((prev) => [...prev, ...incoming]);
  }

  function removeNewFileAt(index: number) {
    setNewFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) revokeFile(removed);
      return next;
    });
  }

  function removeExistingImageAt(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: ProductValues) {
    if (existingImages.length === 0 && newFiles.length === 0) {
      toast.error("Keep at least one product image");
      return;
    }

    try {
      const categoryId = parseCategoryId(values.categoryId);
      if (categoryId === null) {
        toast.error("Pick a valid category");
        return;
      }
      await updateAdminProduct(initial.id, {
        categoryId,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        retainImagePaths: mapProductImagesToRetainPaths(existingImages),
        newImages: newFiles,
        variants: mapFormVariantsToPayload(values.variants),
      });
      toast.success("Product updated");
      await qc.invalidateQueries({ queryKey: queryKeys.admin.products });
      await qc.invalidateQueries({
        queryKey: ["admin", "products", "detail", initial.id],
      });
      router.push(ROUTES.products);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not update product"));
    }
  }

  const totalImages = existingImages.length + newFiles.length;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-3xl space-y-6"
      >
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="categoryId"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <select
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  disabled={categoriesLoading}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories…"
                      : categoryOptions.length === 0
                        ? "No categories yet — restart the API after seeding"
                        : "Select category"}
                  </option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="At least 10 characters if filled in"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold tracking-tight">
              Variants
            </h3>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => append(DEFAULT_PRODUCT_VARIANT)}
            >
              <PlusIcon className="mr-2 size-4" />
              Add Variant
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative space-y-4 rounded-xl border p-4"
            >
              {fields.length > 1 && (
                <Button
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="text-destructive absolute top-2 right-2"
                  onClick={() => remove(index)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  name={`variants.${index}.size`}
                  control={form.control}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Input {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name={`variants.${index}.color`}
                  control={form.control}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name={`variants.${index}.sku`}
                  control={form.control}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="UNIQUE-SKU-001" {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  name={`variants.${index}.price`}
                  control={form.control}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min={0} {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name={`variants.${index}.stock`}
                  control={form.control}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>Stock</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <label
            htmlFor="product-images-update"
            className="text-sm leading-none font-medium"
          >
            Images
          </label>
          <Input
            multiple
            type="file"
            id="product-images-update"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <p className="text-muted-foreground text-xs">
            Current images are shown below. Remove any you do not want to keep,
            then add new ones if needed ({totalImages} total).
          </p>

          {existingImages.length > 0 || newFiles.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {existingImages.map((src, index) => (
                <div
                  key={`existing-${src}-${index}`}
                  className="bg-muted relative aspect-square overflow-hidden rounded-lg border"
                >
                  <Image
                    fill
                    alt=""
                    src={src}
                    unoptimized
                    className="object-cover"
                  />
                  <Button
                    size="icon"
                    type="button"
                    variant="secondary"
                    onClick={() => removeExistingImageAt(index)}
                    aria-label={`Remove existing image ${index + 1}`}
                    className="absolute top-1 right-1 size-8 rounded-full shadow-sm"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ))}
              {newFiles.map((file, index) => (
                <div
                  key={previewKey(file, index)}
                  className="bg-muted relative aspect-square overflow-hidden rounded-lg border"
                >
                  <Image
                    fill
                    alt=""
                    unoptimized
                    src={objectUrlFor(file)}
                    className="object-cover"
                  />
                  <Button
                    size="icon"
                    type="button"
                    variant="secondary"
                    onClick={() => removeNewFileAt(index)}
                    aria-label={`Remove new image ${index + 1}`}
                    className="absolute top-1 right-1 size-8 rounded-full shadow-sm"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating…" : "Update product"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
