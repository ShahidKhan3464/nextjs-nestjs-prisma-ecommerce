export const siteConfig = {
  name: "Atelier Commerce",
  description:
    "Premium minimalist storefront — curated essentials with intentional design.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: "en",
} as const;
