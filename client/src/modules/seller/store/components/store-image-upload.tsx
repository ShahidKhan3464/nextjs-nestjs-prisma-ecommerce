"use client";

import Image from "next/image";
import { toast } from "sonner";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getStoreFile, type Store, type StoreFileType } from "../types";
import { removeStoreFile, uploadStoreFile } from "../services/store.service";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

type SlotProps = {
  store: Store;
  type: StoreFileType;
  label: string;
  hint: string;
  aspectClass: string;
  disabled?: boolean;
};

function StoreImageSlot({
  store,
  type,
  label,
  hint,
  aspectClass,
  disabled,
}: SlotProps) {
  const qc = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const existing = getStoreFile(store, type);
  const displayUrl = previewUrl ?? existing?.file.urlPath ?? null;

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  React.useEffect(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [existing?.file.urlPath]);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadStoreFile(file, type),
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.store.me, next);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.seller });
      toast.success(`${label} updated`);
      if (inputRef.current) inputRef.current.value = "";
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, `Could not upload ${label.toLowerCase()}`)
      );
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      if (inputRef.current) inputRef.current.value = "";
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeStoreFile(type),
    onSuccess: (next) => {
      qc.setQueryData(queryKeys.store.me, next);
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.seller });
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      toast.success(`${label} removed`);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, `Could not remove ${label.toLowerCase()}`)
      );
    },
  });

  const busy = uploadMutation.isPending || removeMutation.isPending;
  const locked = disabled || busy;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Use a JPEG, PNG, GIF, or WebP image");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5MB or smaller");
      event.target.value = "";
      return;
    }

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    uploadMutation.mutate(file);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-lg border bg-muted ${aspectClass}`}
      >
        {displayUrl ? (
          <Image
            fill
            alt={`${store.name} ${label.toLowerCase()} preview`}
            src={displayUrl}
            className="object-cover"
            sizes={
              type === "BANNER" ? "(max-width: 896px) 100vw, 896px" : "192px"
            }
            unoptimized={Boolean(previewUrl)}
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
            No {label.toLowerCase()}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={inputRef}
        accept={ACCEPT}
        disabled={locked}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          type="button"
          variant="outline"
          disabled={locked}
          onClick={() => inputRef.current?.click()}
        >
          {uploadMutation.isPending
            ? "Uploading…"
            : existing
              ? `Replace ${label.toLowerCase()}`
              : `Upload ${label.toLowerCase()}`}
        </Button>
        {existing ? (
          <Button
            size="sm"
            type="button"
            variant="ghost"
            disabled={locked}
            onClick={() => removeMutation.mutate()}
          >
            {removeMutation.isPending ? "Removing…" : "Remove"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  store: Store;
  disabled?: boolean;
};

export function StoreImageUpload({ store, disabled }: Props) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold">Store images</h3>
        <p className="text-muted-foreground text-sm">
          Upload a logo and banner for your storefront. JPEG, PNG, GIF, or WebP
          up to 5MB.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <StoreImageSlot
          type="LOGO"
          label="Logo"
          store={store}
          disabled={disabled}
          aspectClass="aspect-square max-w-48"
          hint="Square mark shown next to your store name."
        />
        <StoreImageSlot
          type="BANNER"
          store={store}
          label="Banner"
          disabled={disabled}
          aspectClass="aspect-[3/1]"
          hint="Wide image at the top of your store page."
        />
      </div>
    </section>
  );
}
