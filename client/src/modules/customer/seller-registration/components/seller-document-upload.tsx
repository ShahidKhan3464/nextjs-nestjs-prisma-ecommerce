"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SellerDocument, SellerDocumentType } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadSellerDocument } from "../services/seller-profile.service";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  sellerDocumentUploadSchema,
  type SellerDocumentUploadValues,
} from "../schemas";

const DOCUMENT_TYPE_LABELS: Record<SellerDocumentType, string> = {
  BUSINESS_LICENSE: "Business license",
  TAX_DOCUMENT: "Tax document",
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  documents: SellerDocument[];
  disabled?: boolean;
};

export function SellerDocumentUpload({ documents, disabled }: Props) {
  const qc = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<SellerDocumentUploadValues>({
    resolver: zodResolver(sellerDocumentUploadSchema),
    defaultValues: {
      type: "BUSINESS_LICENSE",
      file: undefined as unknown as File,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: SellerDocumentUploadValues) =>
      uploadSellerDocument(values.file, values.type),
    onSuccess: (profile) => {
      qc.setQueryData(queryKeys.sellerProfile.me, profile);
      toast.success("Document uploaded");
      form.reset({
        type: form.getValues("type"),
        file: undefined as unknown as File,
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not upload document"));
    },
  });

  return (
    <div className="space-y-4">
      {documents.length > 0 ? (
        <ul className="divide-border border-border divide-y rounded-lg border">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{doc.file.originalName}</p>
                <p className="text-muted-foreground text-xs">
                  {DOCUMENT_TYPE_LABELS[doc.type]} ·{" "}
                  {formatBytes(doc.file.fileSize)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          No documents uploaded yet. Add a business license or tax document to
          speed up review.
        </p>
      )}

      <Form {...form}>
        <form
          noValidate
          className="space-y-3"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              name="type"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange((value ?? "BUSINESS_LICENSE") as SellerDocumentType)
                    }
                    disabled={disabled || mutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BUSINESS_LICENSE">
                        Business license
                      </SelectItem>
                      <SelectItem value="TAX_DOCUMENT">Tax document</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="file"
              control={form.control}
              render={({ field: { value: _value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="file"
                      ref={fileInputRef}
                      disabled={disabled || mutation.isPending}
                      accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        onChange(file);
                      }}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    PDF or image, max 10MB.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={disabled || mutation.isPending}
          >
            {mutation.isPending ? "Uploading…" : "Upload document"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
