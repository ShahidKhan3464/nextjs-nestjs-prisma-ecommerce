"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function useAppSectionMeta(): { title: string; hint?: string } {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);

  return useMemo(() => {
    const admin = role === "admin";

    if (pathname === "/dashboard") {
      return admin
        ? { title: "Analytics", hint: "Overview" }
        : { title: "Dashboard", hint: "Your overview" };
    }
    if (pathname === "/profile") {
      return { title: "Profile", hint: "Account settings" };
    }
    if (pathname.startsWith("/products/") && pathname !== "/products") {
      if (pathname.startsWith("/products/new")) {
        return { title: "New product", hint: "Create catalog item" };
      }
      if (pathname.startsWith("/products/edit/")) {
        return { title: "Edit product", hint: "Update catalog item" };
      }
      return { title: "Product", hint: "Details & variants" };
    }
    if (pathname === "/products") {
      return admin
        ? { title: "Products", hint: "Inventory" }
        : { title: "Shop", hint: "Browse catalog" };
    }
    if (pathname === "/categories") {
      return admin
        ? { title: "Categories", hint: "Manage product categories" }
        : { title: "Categories", hint: "Browse categories" };
    }
    if (pathname.startsWith("/categories/") && pathname !== "/categories") {
      if (pathname.startsWith("/categories/new")) {
        return { title: "New category", hint: "Create category" };
      }
      return { title: "Category", hint: "Products in category" };
    }
    if (pathname.startsWith("/orders/") && pathname !== "/orders") {
      return {
        title: "Order",
        hint: admin ? "Fulfillment" : "Receipt & status",
      };
    }
    if (pathname === "/orders") {
      return {
        title: "Orders",
        hint: admin ? "All storefront orders" : "Your history",
      };
    }
    if (pathname === "/cart") return { title: "Cart" };
    if (pathname === "/checkout") return { title: "Checkout" };
    if (pathname === "/wishlist") return { title: "Wishlist" };

    if (pathname === "/users") return { title: "Users", hint: "Accounts" };
    if (pathname.startsWith("/users/")) {
      return { title: "User detail", hint: "Customer record" };
    }

    return { title: "Store" };
  }, [pathname, role]);
}
