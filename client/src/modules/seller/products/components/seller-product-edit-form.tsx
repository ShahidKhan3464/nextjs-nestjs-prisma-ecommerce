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
import { formatFilterLabel } from "@/lib/format-filter-label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SellerProduct, SellerProductImage } from "../types";
import { updateSellerProduct } from "../services/products.service";
import { fetchSellerCategories } from "../services/categories.service";
import { useProductImageFilePreviews } from "../hooks/use-product-image-previews";
import {
  productSchema,
  productImageFileSchema,
  type ProductValues,
} from "../schemas";
import {
  parseCategoryId,
  sortCategoriesByName,
  DEFAULT_PRODUCT_VARIANT,
  mapFormVariantsToPayload,
  mapProductImagesToRetainPaths,
  mapProductVariantsToFormValues,
} from "../utils/product-form";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

export function SellerProductEditForm({ initial }: { initial: SellerProduct }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const { objectUrlFor, revokeFile, previewKey } =
    useProductImageFilePreviews();
  const [existingImages, setExistingImages] = useState<SellerProductImage[]>(
    initial.images.filter((img) => img.urlPath !== "/placeholder.svg")
  );

  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: queryKeys.seller.categories(),
    queryFn: () => fetchSellerCategories(),
  });

  const categoryOptions = sortCategoriesByName(categories);

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductValues>,
    defaultValues: {
      categoryId: initial.categoryId ? String(initial.categoryId) : "",
      name: initial.name,
      description: initial.description || "",
      status: initial.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
      variants: mapProductVariantsToFormValues(initial.variants),
    },
  });

  useEffect(() => {
    setExistingImages(
      initial.images.filter((img) => img.urlPath !== "/placeholder.svg")
    );
  }, [initial.images]);

  useEffect(() => {
    form.reset({
      name: initial.name,
      description: initial.description || "",
      categoryId: initial.categoryId
        ? String(initial.categoryId)
        : categories.find((c) => c.name === initial.category)
          ? String(categories.find((c) => c.name === initial.category)!.id)
          : "",
      status: initial.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
      variants: mapProductVariantsToFormValues(initial.variants),
    });
  }, [initial, categories, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return;
    const valid: File[] = [];
    for (const file of incoming) {
      const parsed = productImageFileSchema.safeParse(file);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid image");
        continue;
      }
      valid.push(parsed.data);
    }
    if (valid.length === 0) return;
    if (existingImages.length + newFiles.length + valid.length > 12) {
      toast.error("You can upload at most 12 images");
      return;
    }
    setNewFiles((prev) => [...prev, ...valid]);
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
      const product = await updateSellerProduct(initial.id, {
        categoryId,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        retainImagePaths: mapProductImagesToRetainPaths(existingImages),
        newImages: newFiles,
        variants: mapFormVariantsToPayload(values.variants),
      });
      toast.success("Product updated");
      await qc.invalidateQueries({ queryKey: queryKeys.seller.products.all });
      if (product) {
        qc.setQueryData(queryKeys.seller.products.detail(product.id), product);
      } else {
        await qc.invalidateQueries({
          queryKey: queryKeys.seller.products.detail(initial.id),
        });
      }
      router.push(ROUTES.productManage(initial.id));
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
              <Select
                value={field.value || undefined}
                disabled={categoriesLoading || categoryOptions.length === 0}
                onValueChange={(value) => field.onChange(value ?? "")}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        categoriesLoading
                          ? "Loading categories…"
                          : categoryOptions.length === 0
                            ? "No categories available"
                            : "Select category"
                      }
                    >
                      {field.value
                        ? formatFilterLabel(
                            categoryOptions.find(
                              (c) => String(c.id) === field.value
                            )?.name
                          )
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {formatFilterLabel(c.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  onClick={() => remove(index)}
                  className="text-destructive absolute top-2 right-2"
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
            htmlFor="seller-product-images-update"
            className="text-sm leading-none font-medium"
          >
            Images
          </label>
          <Input
            multiple
            type="file"
            id="seller-product-images-update"
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
              {existingImages.map((img, index) => (
                <div
                  key={`existing-${img.id}-${img.urlPath}`}
                  className="bg-muted relative aspect-square overflow-hidden rounded-lg border"
                >
                  <Image
                    fill
                    alt=""
                    unoptimized
                    src={img.url}
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(ROUTES.productManage(initial.id))}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
