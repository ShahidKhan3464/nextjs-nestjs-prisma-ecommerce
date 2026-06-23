"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { categorySchema, type CategoryValues } from "../schemas";
import {
  createAdminCategory,
  updateAdminCategory,
} from "../services/categories.service";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

function buildCategoryPayload(values: CategoryValues) {
  const name = values.name.trim();
  const desc = values.description?.trim();
  const payload: { name: string; description?: string } = { name };
  if (desc && desc.length >= 10) {
    payload.description = desc;
  }
  return payload;
}

export function AdminCategoryForm({
  initial,
}: {
  initial?: { id: number; name: string; description?: string | null };
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
    },
  });

  async function onSubmit(values: CategoryValues) {
    const payload = buildCategoryPayload(values);
    try {
      if (initial) {
        await updateAdminCategory(initial.id, payload);
        toast.success("Category updated");
      } else {
        await createAdminCategory(payload);
        toast.success("Category created");
      }
      await qc.invalidateQueries({ queryKey: queryKeys.admin.categories });
      router.push(ROUTES.categories);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save category"));
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-2xl space-y-4"
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
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <p className="text-muted-foreground text-xs">
                If provided, use at least 10 characters (API validation).
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initial ? "Update" : "Create"} category
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
