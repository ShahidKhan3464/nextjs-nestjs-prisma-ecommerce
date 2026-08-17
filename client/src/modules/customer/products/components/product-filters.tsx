"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useDebouncedCallback } from "use-debounce";
import { formatFilterLabel } from "@/lib/format-filter-label";
import { PRODUCT_SORT_OPTIONS, type ProductSort } from "../types";
import { fetchBuyerCategories } from "../services/categories.service";
import { useProductSearchParams } from "../hooks/use-product-search-params";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

const SORT_LABELS: Record<ProductSort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name_asc: "Name: A–Z",
  rating_desc: "Highest rated",
};

export function ProductFilters({ disabled = false }: { disabled?: boolean }) {
  const { values, setParams, resetFilters } = useProductSearchParams();
  const [qLocal, setQLocal] = React.useState(values.q);
  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: queryKeys.products.categories,
    queryFn: fetchBuyerCategories,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    setQLocal(values.q);
  }, [values.q]);

  const debouncedQ = useDebouncedCallback((value: string) => {
    setParams({ q: value, page: 1 });
  }, 350);

  return (
    <div className="bg-muted/40 border-border rounded-xl border p-4">
      <div className="flex flex-row flex-wrap items-end justify-end gap-4">
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

        <div className="w-full min-w-50 space-y-2 sm:w-auto">
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
                placeholder={categoriesLoading ? "Loading…" : "All"}
              >
                {values.category && categories.length > 0
                  ? formatFilterLabel(
                      categories.find((c) => String(c.id) === values.category)
                        ?.name
                    )
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.length > 0 ? (
                categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {formatFilterLabel(c.name)}
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

        <div className="w-full min-w-35 space-y-2 sm:w-auto">
          <Label>Min price</Label>
          <Select
            disabled={disabled}
            value={values.minPrice || "all"}
            onValueChange={(v) => {
              if (v == null) return;
              setParams({ minPrice: v === "all" ? "" : v, page: 1 });
            }}
          >
            <SelectTrigger className="w-full" disabled={disabled}>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="25">$25+</SelectItem>
              <SelectItem value="50">$50+</SelectItem>
              <SelectItem value="100">$100+</SelectItem>
              <SelectItem value="200">$200+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-35 space-y-2 sm:w-auto">
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

        <div className="w-full min-w-35 space-y-2 sm:w-auto">
          <Label>Min rating</Label>
          <Select
            disabled={disabled}
            value={values.minRating || "all"}
            onValueChange={(v) => {
              if (v == null) return;
              setParams({ minRating: v === "all" ? "" : v, page: 1 });
            }}
          >
            <SelectTrigger className="w-full" disabled={disabled}>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-35 space-y-2 sm:w-auto">
          <Label>Sort</Label>
          <Select
            disabled={disabled}
            value={values.sort || "newest"}
            onValueChange={(v) => {
              if (v == null) return;
              setParams({
                sort: v === "newest" ? "" : v,
                page: 1,
              });
            }}
          >
            <SelectTrigger className="w-full" disabled={disabled}>
              <SelectValue placeholder="Newest">
                {SORT_LABELS[(values.sort || "newest") as ProductSort]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_SORT_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {SORT_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full sm:w-auto"
            onClick={() => {
              debouncedQ.cancel();
              setQLocal("");
              resetFilters();
            }}
          >
            Reset filters
          </Button>
        </div>
      </div>
    </div>
  );
}
