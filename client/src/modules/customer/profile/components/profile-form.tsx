"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import type { User } from "../types";
import { ROUTES } from "@/constants/routes";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import { queryKeys } from "@/constants/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { useForm, type Resolver } from "react-hook-form";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";
import { isBuyer, isSeller } from "@/modules/auth/utils/roles";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProfile,
  updateProfile,
  changePassword,
  uploadProfileAvatar,
} from "../services/profile.service";
import {
  profileSchema,
  passwordSchema,
  type ProfileValues,
  type PasswordValues,
} from "../schemas";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

function splitName(fullName?: string) {
  const parts = (fullName ?? "").trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function ProfileFormSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-6">
            <Skeleton className="size-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-48" />
          </div>
        </section>
        <Separator />
        <section className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 sm:col-span-1" />
            <Skeleton className="h-10 sm:col-span-1" />
            <Skeleton className="h-10 sm:col-span-2" />
            <Skeleton className="h-9 w-28 sm:col-span-2" />
          </div>
        </section>
      </div>
      <div className="space-y-6">
        <section className="space-y-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-16" />
        </section>
        <Separator />
        <section className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-9 w-32" />
        </section>
      </div>
    </div>
  );
}

export function ProfileForm() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const authUser = useAuthStore((s) => s.user);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: profile, isPending } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: fetchProfile,
  });

  const user = profile ?? authUser;

  const { firstName, lastName } = splitName(user?.fullName ?? user?.name);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileValues>,
    values: {
      firstName,
      lastName,
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema) as Resolver<PasswordValues>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (profile) setUser(profile);
  }, [profile, setUser]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: queryKeys.profile.me });
      const previous = qc.getQueryData<User>(queryKeys.profile.me);
      if (previous) {
        const optimistic: User = {
          ...previous,
          fullName: body.fullName,
          name: body.fullName,
          phoneNumber: body.phoneNumber,
        };
        qc.setQueryData(queryKeys.profile.me, optimistic);
        setUser(optimistic);
      }
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.profile.me, ctx.previous);
        setUser(ctx.previous);
      }
      toast.error(getApiErrorMessage(error, "Could not update profile"));
    },
    onSuccess: (next) => {
      const previous =
        qc.getQueryData<User>(queryKeys.profile.me) ?? authUser ?? null;
      const merged: User = {
        ...next,
        avatarUrl: next.avatarUrl ?? previous?.avatarUrl,
      };
      qc.setQueryData(queryKeys.profile.me, merged);
      setUser(merged);
      toast.success("Profile updated");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      passwordForm.reset();
      toast.success("Password updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update password"));
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadProfileAvatar,
    onSuccess: (url) => {
      const resolved = resolveUploadUrl(url) ?? url;
      const current = qc.getQueryData<User>(queryKeys.profile.me) ?? user;
      if (current) {
        const next = { ...current, avatarUrl: resolved };
        qc.setQueryData(queryKeys.profile.me, next);
        setUser(next);
      }
      toast.success("Profile photo updated");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not upload photo"));
    },
  });

  function onProfileSubmit(values: ProfileValues) {
    const fullName =
      `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
    profileMutation.mutate({
      fullName,
      phoneNumber: values.phoneNumber?.trim() || undefined,
    });
  }

  function onPasswordSubmit(values: PasswordValues) {
    passwordMutation.mutate(values);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (isPending && !user) {
    return <ProfileFormSkeleton />;
  }

  const avatarUrl = resolveUploadUrl(user?.avatarUrl) ?? "";
  const roles = user?.roles ?? [];

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-6">
            <div className="relative size-24 overflow-hidden rounded-full border bg-muted">
              {avatarUrl ? (
                <Image
                  fill
                  alt=""
                  sizes="96px"
                  src={avatarUrl}
                  className="object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex size-full items-center justify-center text-2xl font-semibold">
                  {(user?.fullName ?? user?.name ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Profile photo</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
              />
              <Button
                type="button"
                variant="outline"
                disabled={avatarMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarMutation.isPending ? "Uploading…" : "Upload photo"}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Email</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </section>

        <Separator />

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Personal details</h2>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <FormField
                name="firstName"
                control={profileForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="lastName"
                control={profileForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="phoneNumber"
                control={profileForm.control}
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input autoComplete="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="sm:col-span-2 sm:w-fit"
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </Form>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-28">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Account roles</h2>
          <p className="text-muted-foreground text-sm">
            Roles are assigned by the platform and shown for reference only.
          </p>
          <div className="flex flex-wrap gap-2">
            {roles.length === 0 ? (
              <Badge variant="outline">No roles</Badge>
            ) : (
              roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))
            )}
          </div>
        </section>

        {isBuyer(roles) && !isSeller(roles) ? (
          <>
            <Separator />
            <section className="space-y-2">
              <h2 className="font-heading text-lg font-semibold">Sell with us</h2>
              <p className="text-muted-foreground text-sm">
                Apply to open a seller account and list products on the marketplace.
              </p>
              <Link
                href={ROUTES.becomeSeller}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Become a seller
              </Link>
            </section>
          </>
        ) : null}

        <Separator />

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Password</h2>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                name="currentPassword"
                control={passwordForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="newPassword"
                control={passwordForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="confirmPassword"
                control={passwordForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </Form>
        </section>
      </aside>
    </div>
  );
}
