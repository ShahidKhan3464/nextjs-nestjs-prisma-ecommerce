"use client";

import Image from "next/image";
import { toast } from "sonner";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import { useForm, type Resolver } from "react-hook-form";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";
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
      <Separator />
      <section className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <div className="max-w-md space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-9 w-32" />
        </div>
      </section>
    </div>
  );
}

export function ProfileForm() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const profileLoadedRef = React.useRef(false);
  const [profileLoading, setProfileLoading] = React.useState(true);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(
    resolveUploadUrl(user?.avatarUrl) ?? ""
  );

  const { firstName, lastName } = splitName(user?.fullName ?? user?.name);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileValues>,
    defaultValues: {
      firstName,
      lastName,
      phoneNumber: user?.phoneNumber ?? "",
    },
  });

  React.useEffect(() => {
    if (profileLoadedRef.current) return;
    profileLoadedRef.current = true;

    void fetchProfile()
      .then((profile) => {
        setAvatarUrl(resolveUploadUrl(profile.avatarUrl) ?? "");
        setUser(profile);
        const { firstName: fn, lastName: ln } = splitName(profile.fullName);
        profileForm.reset({
          firstName: fn,
          lastName: ln,
          phoneNumber: profile.phoneNumber ?? "",
        });
      })
      .catch(() => {
        profileLoadedRef.current = false;
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [setUser, profileForm]);

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema) as Resolver<PasswordValues>,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onProfileSubmit(values: ProfileValues) {
    try {
      const fullName =
        `${values.firstName.trim()} ${values.lastName.trim()}`.trim();
      const next = await updateProfile({
        fullName,
        phoneNumber: values.phoneNumber?.trim() || undefined,
      });
      setUser({ ...next, avatarUrl });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update profile"));
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    try {
      await changePassword(values);
      passwordForm.reset();
      toast.success("Password updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update password"));
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadProfileAvatar(file);
      const resolved = resolveUploadUrl(url) ?? url;
      setAvatarUrl(resolved);
      if (user) {
        setUser({ ...user, avatarUrl: resolved });
      }
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not upload photo"));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (profileLoading) {
    return <ProfileFormSkeleton />;
  }

  return (
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
              onChange={(e) => void handleAvatarChange(e)}
              accept="image/jpeg,image/png,image/gif,image/webp"
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? "Uploading…" : "Upload photo"}
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
              disabled={profileForm.formState.isSubmitting}
            >
              {profileForm.formState.isSubmitting ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Form>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Password</h2>
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            className="max-w-md space-y-4"
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
            <Button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting
                ? "Updating…"
                : "Update password"}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  );
}
