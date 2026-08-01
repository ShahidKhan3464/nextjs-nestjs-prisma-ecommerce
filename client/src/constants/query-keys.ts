export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.products.all, "list", filters] as const,
  },
  wishlist: {
    all: ["wishlist"] as const,
  },
  dashboard: {
    customer: ["dashboard", "customer"] as const,
    seller: ["dashboard", "seller"] as const,
  },
  sellerProfile: {
    me: ["seller-profile", "me"] as const,
  },
  store: {
    me: ["store", "me"] as const,
  },
  seller: {
    categories: ["seller", "categories"] as const,
    products: {
      all: ["seller", "products"] as const,
      detail: (id: string) => ["seller", "products", "detail", id] as const,
    },
    variants: {
      all: ["seller", "variants"] as const,
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
    products: ["admin", "products"] as const,
    analytics: ["admin", "analytics"] as const,
    categories: ["admin", "categories"] as const,
    order: (id: string) => ["admin", "orders", id] as const,
    category: (id: number) => ["admin", "categories", id] as const,
    userDetail: (id: string) => ["admin", "users", id, "detail"] as const,
  },
} as const;
