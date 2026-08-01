"use client";

import { useCallback, useMemo } from "react";
import { isProductSort, type ProductSort } from "../types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useProductSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo(() => {
    const sortRaw = searchParams.get("sort") ?? "";
    const sort: ProductSort | "" =
      sortRaw && isProductSort(sortRaw) ? sortRaw : "";

    return {
      q: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      storeId: searchParams.get("storeId") ?? "",
      sort,
      page: Number(searchParams.get("page") ?? "1") || 1,
    };
  }, [searchParams]);

  const setParams = useCallback(
    (next: Partial<Record<keyof typeof values, string | number>>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v === "" || v === undefined || v === null) {
          params.delete(k);
        } else {
          params.set(k, String(v));
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { values, setParams };
}
