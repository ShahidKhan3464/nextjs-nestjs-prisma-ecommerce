"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUserRoles } from "@/modules/auth";
import { resolveShopChrome } from "@/shared/navigation/app-nav";

export function useAppSectionMeta(): { title: string; hint?: string } {
  const pathname = usePathname();
  const roles = useUserRoles();
  const chrome = resolveShopChrome(roles);

  return useMemo(() => {
    if (pathname === "/dashboard") {
      if (chrome === "admin") {
        return { title: "Analytics", hint: "Overview" };
      }
      if (chrome === "seller") {
        return { title: "Dashboard", hint: "Seller overview" };
      }
      return { title: "Dashboard", hint: "Your overview" };
    }
    if (pathname === "/profile") {
      return { title: "Profile", hint: "Account settings" };
    }
    if (pathname === "/profile/addresses") {
      return { title: "Addresses", hint: "Shipping & billing" };
    }
    if (pathname === "/notifications") {
      return { title: "Notifications", hint: "Marketplace updates" };
    }
    if (pathname.startsWith("/products/") && pathname !== "/products") {
      if (pathname.startsWith("/products/new")) {
        return { title: "New product", hint: "Create catalog item" };
      }
      if (pathname.startsWith("/products/edit/")) {
        return { title: "Edit product", hint: "Update catalog item" };
      }
      if (pathname.startsWith("/products/manage/")) {
        return {
          title: "Product",
          hint:
            chrome === "seller"
              ? "Listing & variants"
              : "Details",
        };
      }
      return { title: "Product", hint: "Details & variants" };
    }
    if (pathname === "/products") {
      if (chrome === "seller") {
        return { title: "Products", hint: "Your listings" };
      }
      return { title: "Shop", hint: "Browse catalog" };
    }
    if (pathname === "/categories") {
      return chrome === "admin"
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
        hint:
          chrome === "admin"
            ? "Fulfillment"
            : chrome === "seller"
              ? "Order details"
              : "Receipt & status",
      };
    }
    if (pathname === "/orders") {
      return {
        title: "Orders",
        hint:
          chrome === "admin"
            ? "All storefront orders"
            : chrome === "seller"
              ? "Your sales"
              : "Your history",
      };
    }
    if (pathname === "/reviews") {
      return {
        title: "Reviews",
        hint:
          chrome === "admin"
            ? "Moderation"
            : chrome === "seller"
              ? "Store feedback"
              : "Reviews",
      };
    }
    if (pathname === "/cart") return { title: "Cart" };
    if (pathname === "/checkout/success") return { title: "Order confirmed" };
    if (pathname === "/checkout") return { title: "Checkout" };
    if (pathname === "/wishlist") return { title: "Wishlist" };
    if (pathname === "/become-seller" || pathname.startsWith("/become-seller/")) {
      return { title: "Become a seller", hint: "Seller application" };
    }

    if (pathname === "/users") return { title: "Users", hint: "Accounts" };
    if (pathname.startsWith("/users/")) {
      return { title: "User detail", hint: "Customer record" };
    }
    if (pathname === "/seller-profiles") {
      return { title: "Seller applications", hint: "Review & approve" };
    }
    if (pathname.startsWith("/seller-profiles/")) {
      return { title: "Seller application", hint: "Application detail" };
    }
    if (pathname === "/payments") {
      return {
        title: "Payments",
        hint:
          chrome === "admin"
            ? "Refunds & inspection"
            : chrome === "seller"
              ? "Store payments & COD"
              : "Payments",
      };
    }
    if (pathname.startsWith("/payments/")) {
      return {
        title: "Payment",
        hint: chrome === "admin" ? "Refund & details" : "Payment details",
      };
    }
    if (pathname === "/stores") {
      return { title: "Stores", hint: "Verify & suspend" };
    }
    if (pathname.startsWith("/stores/manage/")) {
      return { title: "Store", hint: "Moderation" };
    }

    return { title: "Store" };
  }, [pathname, chrome]);
}
