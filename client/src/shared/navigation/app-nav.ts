import { ROUTES } from "@/constants/routes";
import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/modules/auth";
import {
  isBuyer,
  isSeller,
  isSuperAdmin,
} from "@/modules/auth/utils/roles";
import {
  Heart,
  Star,
  Store,
  Users,
  Wallet,
  Package,
  UserRound,
  BadgeCheck,
  ShoppingBag,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react";

export type ShopChrome = "admin" | "seller" | "buyer";

export type AppNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles that may see this item when it appears in a chrome menu. */
  roles: UserRole[];
  /** Optional count badge (e.g. pending seller applications). */
  badge?: number;
};

const ADMIN_NAV: AppNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: ROUTES.dashboard,
    roles: ["SUPER_ADMIN"],
  },
  {
    id: "users",
    icon: Users,
    label: "Users",
    href: ROUTES.users,
    roles: ["SUPER_ADMIN"],
  },
  {
    icon: BadgeCheck,
    id: "seller-profiles",
    roles: ["SUPER_ADMIN"],
    href: ROUTES.sellerProfiles,
    label: "Seller applications",
  },
  {
    icon: Package,
    id: "categories",
    label: "Categories",
    roles: ["SUPER_ADMIN"],
    href: ROUTES.categories,
  },
  {
    icon: Store,
    id: "stores",
    label: "Stores",
    roles: ["SUPER_ADMIN"],
    href: ROUTES.adminStores,
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingCart,
    href: ROUTES.orders,
    roles: ["SUPER_ADMIN"],
  },
  {
    icon: Wallet,
    id: "payments",
    label: "Payments",
    href: ROUTES.payments,
    roles: ["SUPER_ADMIN"],
  },
  {
    icon: Star,
    id: "reviews",
    label: "Reviews",
    href: ROUTES.reviews,
    roles: ["SUPER_ADMIN"],
  },
];

const SELLER_NAV: AppNavItem[] = [
  {
    id: "dashboard",
    roles: ["SELLER"],
    label: "Dashboard",
    icon: LayoutDashboard,
    href: ROUTES.dashboard,
  },
  {
    id: "store",
    icon: Store,
    label: "Store",
    roles: ["SELLER"],
    href: ROUTES.store,
  },
  {
    icon: Package,
    id: "products",
    label: "Products",
    roles: ["SELLER"],
    href: ROUTES.products,
  },
  {
    id: "orders",
    label: "Orders",
    roles: ["SELLER"],
    icon: ShoppingCart,
    href: ROUTES.orders,
  },
  {
    icon: Wallet,
    id: "payments",
    label: "Payments",
    roles: ["SELLER"],
    href: ROUTES.payments,
  },
  {
    icon: Star,
    id: "reviews",
    label: "Reviews",
    roles: ["SELLER"],
    href: ROUTES.reviews,
  },
  {
    id: "profile",
    icon: UserRound,
    label: "Profile",
    roles: ["SELLER"],
    href: ROUTES.profile,
  },
];

const BUYER_NAV: AppNavItem[] = [
  {
    id: "dashboard",
    roles: ["BUYER"],
    label: "Dashboard",
    icon: LayoutDashboard,
    href: ROUTES.dashboard,
  },
  {
    id: "products",
    roles: ["BUYER"],
    label: "Products",
    icon: ShoppingBag,
    href: ROUTES.products,
  },
  {
    id: "cart",
    label: "Cart",
    roles: ["BUYER"],
    href: ROUTES.cart,
    icon: ShoppingCart,
  },
  {
    icon: Heart,
    id: "wishlist",
    roles: ["BUYER"],
    label: "Wishlist",
    href: ROUTES.wishlist,
  },
  {
    id: "orders",
    icon: Package,
    label: "Orders",
    roles: ["BUYER"],
    href: ROUTES.orders,
  },
  {
    icon: Store,
    roles: ["BUYER"],
    id: "become-seller",
    label: "Become a seller",
    href: ROUTES.becomeSeller,
  },
  {
    id: "profile",
    icon: UserRound,
    label: "Profile",
    roles: ["BUYER"],
    href: ROUTES.profile,
  },
];

/** Buyer shopping links sellers may also use when they hold BUYER. */
const SELLER_BUYER_EXTRA: AppNavItem[] = [
  {
    id: "shop",
    label: "Shop",
    roles: ["BUYER"],
    href: ROUTES.shop,
    icon: ShoppingBag,
  },
  {
    id: "cart",
    label: "Cart",
    roles: ["BUYER"],
    href: ROUTES.cart,
    icon: ShoppingCart,
  },
  {
    icon: Heart,
    id: "wishlist",
    roles: ["BUYER"],
    label: "Wishlist",
    href: ROUTES.wishlist,
  },
];

export function resolveShopChrome(roles: UserRole[]): ShopChrome {
  if (isSuperAdmin(roles)) return "admin";
  if (isSeller(roles)) return "seller";
  return "buyer";
}

export function shopChromeTitle(chrome: ShopChrome): string {
  switch (chrome) {
    case "admin":
      return "Admin Portal";
    case "seller":
      return "Seller Portal";
    default:
      return "My Account";
  }
}

function mergeUniqueNav(items: AppNavItem[]): AppNavItem[] {
  const seen = new Set<string>();
  const result: AppNavItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

/** Role-filtered sidebar / mobile nav for the active shop chrome. */
export function getNavForRoles(roles: UserRole[]): AppNavItem[] {
  const chrome = resolveShopChrome(roles);

  if (chrome === "admin") {
    return ADMIN_NAV;
  }

  if (chrome === "seller") {
    const extras = isBuyer(roles) ? SELLER_BUYER_EXTRA : [];
    const profileIdx = SELLER_NAV.findIndex((i) => i.id === "profile");
    if (profileIdx === -1 || extras.length === 0) {
      return mergeUniqueNav([...SELLER_NAV, ...extras]);
    }
    return mergeUniqueNav([
      ...SELLER_NAV.slice(0, profileIdx),
      ...extras,
      ...SELLER_NAV.slice(profileIdx),
    ]);
  }

  return BUYER_NAV;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard) {
    return pathname === ROUTES.dashboard || pathname === `${ROUTES.dashboard}/`;
  }
  // Admin store list must not match public `/stores/:slug`.
  if (href === ROUTES.adminStores) {
    return (
      pathname === ROUTES.adminStores ||
      pathname.startsWith(`${ROUTES.adminStores}/manage`)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
