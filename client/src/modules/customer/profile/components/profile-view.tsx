"use client";

import { ProfileForm } from "./profile-form";
import { AddressesManager } from "@/modules/buyer/addresses";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

export function ProfileView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam === "addresses" ? "addresses" : "general";

  function onTabChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "general") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList>
        <TabsTrigger value="general" className="cursor-pointer">
          Profile settings
        </TabsTrigger>
        <TabsTrigger value="addresses" className="cursor-pointer">
          Addresses
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="mt-0">
        <ProfileForm />
      </TabsContent>
      <TabsContent value="addresses" className="mt-0">
        <AddressesManager />
      </TabsContent>
    </Tabs>
  );
}
