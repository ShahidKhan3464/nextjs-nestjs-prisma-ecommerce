"use client";

import { z } from "zod";
import { RatingStars } from "./rating-stars";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export const reviewFormSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Select a rating")
    .max(5, "Rating must be 5 or less"),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title is too long"),
  comment: z
    .string()
    .trim()
    .min(10, "Comment must be at least 10 characters")
    .max(2000, "Comment is too long"),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

const emptyValues: ReviewFormValues = {
  rating: 0,
  title: "",
  comment: "",
};

export type ReviewFormProps = {
  mode: "create" | "edit";
  defaultValues?: Partial<ReviewFormValues>;
  onSubmit: (values: ReviewFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  className?: string;
};

export function ReviewForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isPending = false,
  className,
}: ReviewFormProps) {
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema) as Resolver<ReviewFormValues>,
    defaultValues: {
      ...emptyValues,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => void onSubmit(values))}
        className={className ?? "space-y-4"}
        noValidate
      >
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <RatingStars
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Review rating"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={120}
                  placeholder="Summarize your experience"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  maxLength={2000}
                  placeholder="What did you like or dislike?"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? mode === "edit"
                ? "Saving…"
                : "Submitting…"
              : mode === "edit"
                ? "Save review"
                : "Submit review"}
          </Button>
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
