"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";

export function Pagination({
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange,
}: {
  page: number;
  perPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-4">
      <div className="flex items-center gap-2">
        <Select
          defaultValue={String(perPage)}
          onValueChange={(v) => onPerPageChange(Number(v))}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
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
        <div className="text-sm text-muted-foreground">
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
