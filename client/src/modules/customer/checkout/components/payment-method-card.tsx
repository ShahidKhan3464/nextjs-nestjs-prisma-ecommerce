"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PaymentProviderMeta } from "../types";

type Props = {
  provider: PaymentProviderMeta;
  selected: boolean;
  onSelect: (id: PaymentProviderMeta["id"]) => void;
};

export function PaymentMethodCard({ provider, selected, onSelect }: Props) {
  const disabled = !provider.enabled;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(provider.id)}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
        selected && !disabled
          ? "border-primary bg-primary/5 ring-primary/20 ring-1"
          : "hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-medium">{provider.label}</span>
        {provider.comingSoon ? (
          <Badge variant="secondary">Coming soon</Badge>
        ) : selected ? (
          <Badge variant="default">Selected</Badge>
        ) : null}
      </span>
      <span className="text-muted-foreground text-xs leading-relaxed">
        {provider.description}
      </span>
    </button>
  );
}
