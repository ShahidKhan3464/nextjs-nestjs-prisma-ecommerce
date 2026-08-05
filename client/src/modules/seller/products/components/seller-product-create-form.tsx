"use client";

import { toast } from "sonner";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFieldArray } from "react-hook-form";
import { queryKeys } from "@/constants/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { XIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createSellerProduct } from "../services/products.service";
import { fetchSellerCategories } from "../services/categories.service";
import { useProductImageFilePreviews } from "../hooks/use-product-image-previews";
import { productImagesSchema, productSchema, type ProductValues } from "../schemas";
import {
  parseCategoryId,
  sortCategoriesByName,
  DEFAULT_PRODUCT_VARIANT,
  mapFormVariantsToPayload,
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

export function SellerProductCreateForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const { objectUrlFor, revokeFile, previewKey } =
    useProductImageFilePreviews();

  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: queryKeys.seller.categories,
    queryFn: () => fetchSellerCategories({ limit: 200 }),
  });

  const categoryOptions = sortCategoriesByName(categories);

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return;
    const parsed = productImagesSchema.safeParse([...files, ...incoming]);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid images");
      return;
    }
    setFiles(parsed.data);
  }

  function removeFileAt(index: number) {
    setFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) revokeFile(removed);
      return next;
    });
  }

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductValues>,
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      status: "DRAFT",
      variants: [DEFAULT_PRODUCT_VARIANT],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  async function onSubmit(values: ProductValues) {
    const imagesParsed = productImagesSchema.safeParse(files);
    if (!imagesParsed.success) {
      toast.error(imagesParsed.error.issues[0]?.message ?? "Add product images");
      return;
    }

    try {
      const categoryId = parseCategoryId(values.categoryId);
      if (categoryId === null) {
        toast.error("Pick a valid category");
        return;
      }
      const product = await createSellerProduct({
        categoryId,
        images: imagesParsed.data,
        name: values.name.trim(),
        status: values.status,
        description: values.description?.trim() || undefined,
        variants: mapFormVariantsToPayload(values.variants),
      });
      toast.success(
        values.status === "ACTIVE" ? "Product published" : "Product saved as draft"
      );
      await qc.invalidateQueries({ queryKey: queryKeys.seller.products.all });
      qc.setQueryData(queryKeys.seller.products.detail(product.id), product);
      router.push(ROUTES.productManage(product.id));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Could not create product"));
    }
  }

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

        <div className="grid gap-4 sm:grid-cols-2">
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
                          ? "No categories available"
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
            name="status"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">Save as draft</SelectItem>
                    <SelectItem value="ACTIVE">Publish immediately</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            htmlFor="seller-product-images"
            className="text-sm leading-none font-medium"
          >
            Images
          </label>
          <Input
            multiple
            type="file"
            id="seller-product-images"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <p className="text-muted-foreground text-xs">
            Add one or more images (JPEG, PNG, GIF, or WebP). Max 5 MB each, up
            to 12 images.
          </p>

          {files.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {files.map((file, index) => (
                <div
                  key={previewKey(file, index)}
                  className="bg-muted relative aspect-square overflow-hidden rounded-lg border"
                >
                  <Image
                    fill
                    alt=""
                    unoptimized
                    className="object-cover"
                    src={objectUrlFor(file)}
                  />
                  <Button
                    size="icon"
                    type="button"
                    variant="secondary"
                    onClick={() => removeFileAt(index)}
                    aria-label={`Remove image ${index + 1}`}
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
            {form.formState.isSubmitting ? "Creating…" : "Create product"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(ROUTES.products)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
