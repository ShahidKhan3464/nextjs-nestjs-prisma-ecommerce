"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useDebouncedCallback } from "use-debounce";
import { useProductSearchParams } from "../hooks/use-product-search-params";
import { fetchAdminCategories } from "@/modules/admin/categories/services/categories.service";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

export function ProductFilters({ disabled = false }: { disabled?: boolean }) {
  const { values, setParams } = useProductSearchParams();
  const [qLocal, setQLocal] = React.useState(values.q);
  const { data: categoriesResp, isPending: categoriesLoading } = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => fetchAdminCategories({ limit: 100 }),
  });

  const categories = categoriesResp?.categories ?? [];

  React.useEffect(() => {
    setQLocal(values.q);
  }, [values.q]);

  const debouncedQ = useDebouncedCallback((value: string) => {
    setParams({ q: value, page: 1 });
  }, 350);

  return (
    <div className="bg-muted/40 border-border rounded-xl border p-4">
      <div className="flex flex-row flex-wrap justify-end items-end gap-4">
        <div className="min-w-[min(100%,200px)] space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            value={qLocal}
            disabled={disabled}
            placeholder="Search products"
            aria-describedby="search-hint"
            onChange={(e) => {
              const v = e.target.value;
              setQLocal(v);
              debouncedQ(v);
            }}
          />
        </div>

        <div className="w-full min-w-[140px] space-y-2 sm:w-auto">
          <Label>Category</Label>
          <Select
            disabled={disabled || categoriesLoading}
            value={values.category || "all"}
            onValueChange={(v) => {
              if (v == null) return;
              setParams({ category: v === "all" ? "" : v, page: 1 });
            }}
          >
            <SelectTrigger
              className="w-full"
              disabled={disabled || categoriesLoading}
            >
              <SelectValue
                placeholder={categoriesLoading ? "Loading…" : "All categories"}
              >
                {values.category && categories.length > 0
                  ? categories.find((c) => String(c.id) === values.category)
                      ?.name
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.length > 0 ? (
                categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))
              ) : !categoriesLoading ? (
                <SelectItem value="none" disabled>
                  No categories found
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-[140px] space-y-2 sm:w-auto">
          <Label>Max price</Label>
          <Select
            disabled={disabled}
            value={values.maxPrice || "all"}
            onValueChange={(v) => {
              if (v == null) return;
              setParams({ maxPrice: v === "all" ? "" : v, page: 1 });
            }}
          >
            <SelectTrigger className="w-full" disabled={disabled}>
              <SelectValue placeholder="No limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">No limit</SelectItem>
              <SelectItem value="50">$50 or less</SelectItem>
              <SelectItem value="100">$100 or less</SelectItem>
              <SelectItem value="200">$200 or less</SelectItem>
              <SelectItem value="300">$300 or less</SelectItem>
              <SelectItem value="400">$400 or less</SelectItem>
              <SelectItem value="1000">$1000 or less</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full sm:w-auto"
            onClick={() =>
              setParams({
                q: "",
                category: "",
                minPrice: "",
                maxPrice: "",
                page: 1,
              })
            }
          >
            Reset filters
          </Button>
        </div>
      </div>
    </div>
  );
}
