export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.products.all, "list", filters] as const,
    categories: ["products", "categories"] as const,
  },
  stores: {
    all: ["stores"] as const,
    bySlug: (slug: string) => [...queryKeys.stores.all, "slug", slug] as const,
  },
  wishlist: {
    all: ["wishlist"] as const,
    list: (ids: string) => [...queryKeys.wishlist.all, ids] as const,
  },
  profile: {
    me: ["profile", "me"] as const,
  },
  addresses: {
    all: ["addresses"] as const,
  },
  cart: {
    all: ["cart"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, "list", filters ?? {}] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    product: (productId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.reviews.all, "product", productId, filters ?? {}] as const,
    summary: (productId: string) =>
      [...queryKeys.reviews.all, "summary", productId] as const,
    mine: ["reviews", "mine"] as const,
    seller: (filters?: Record<string, unknown>) =>
      [...queryKeys.reviews.all, "seller", filters ?? {}] as const,
    admin: (filters?: Record<string, unknown>) =>
      [...queryKeys.reviews.all, "admin", filters ?? {}] as const,
  },
  dashboard: {
    buyer: ["dashboard", "buyer"] as const,
    seller: ["dashboard", "seller"] as const,
  },
  sellerProfile: {
    me: ["seller-profile", "me"] as const,
  },
  store: {
    me: ["store", "me"] as const,
  },
  seller: {
    categories: (params?: { limit?: number }) =>
      ["seller", "categories", params ?? {}] as const,
    products: {
      all: ["seller", "products"] as const,
      detail: (id: string) => ["seller", "products", "detail", id] as const,
    },
    variants: {
      byProduct: (productId: string) =>
        ["seller", "variants", "product", productId] as const,
      detail: (id: string) => ["seller", "variants", "detail", id] as const,
    },
    orders: {
      all: ["seller", "orders"] as const,
      list: (filters?: Record<string, unknown>) =>
        ["seller", "orders", "list", filters ?? {}] as const,
      detail: (id: string) => ["seller", "orders", "detail", id] as const,
    },
    payments: {
      all: ["seller", "payments"] as const,
      list: (filters?: Record<string, unknown>) =>
        ["seller", "payments", "list", filters ?? {}] as const,
      detail: (id: string) => ["seller", "payments", "detail", id] as const,
    },
  },
  orders: {
    all: ["orders"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.orders.all, "list", filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },
  admin: {
    users: ["admin", "users"] as const,
    orders: (filters?: Record<string, unknown>) =>
      ["admin", "orders", filters ?? {}] as const,
    analytics: ["admin", "analytics"] as const,
    categories: ["admin", "categories"] as const,
    order: (id: string) => ["admin", "orders", id] as const,
    category: (id: number) => ["admin", "categories", id] as const,
    userDetail: (id: string) => ["admin", "users", id, "detail"] as const,
    sellerProfiles: ["admin", "seller-profiles"] as const,
    sellerProfile: (id: string) =>
      ["admin", "seller-profiles", "detail", id] as const,
    payments: {
      all: ["admin", "payments"] as const,
      list: (filters?: Record<string, unknown>) =>
        ["admin", "payments", "list", filters ?? {}] as const,
      detail: (id: string) => ["admin", "payments", "detail", id] as const,
    },
    stores: {
      all: ["admin", "stores"] as const,
      list: (filters?: Record<string, unknown>) =>
        ["admin", "stores", "list", filters ?? {}] as const,
      detail: (id: string) => ["admin", "stores", "detail", id] as const,
    },
  },
} as const;
