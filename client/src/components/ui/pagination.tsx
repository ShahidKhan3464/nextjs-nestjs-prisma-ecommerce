"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

const DEFAULT_PER_PAGE_OPTIONS = [10, 12, 25, 50];

export function Pagination({
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
}: {
  page: number;
  perPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
  perPageOptions?: number[];
}) {
  const options = useMemo(() => {
    const merged = new Set([...perPageOptions, perPage]);
    return [...merged].sort((a, b) => a - b);
  }, [perPage, perPageOptions]);

  const selectItems = useMemo(
    () =>
      options.map((option) => ({
        value: String(option),
        label: String(option),
      })),
    [options]
  );

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground hidden text-sm sm:inline">
          Rows per page
        </span>
        <Select
          items={selectItems}
          value={String(perPage)}
          onValueChange={(value) => {
            if (value == null) return;
            onPerPageChange(Number(value));
          }}
        >
          <SelectTrigger className="w-22" aria-label="Rows per page">
            <SelectValue placeholder={String(perPage)} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft />
        </Button>
        <div className="text-muted-foreground text-sm">
          Page {page} of {totalPages}
        </div>
        <Button
          size="icon"
          variant="outline"
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
