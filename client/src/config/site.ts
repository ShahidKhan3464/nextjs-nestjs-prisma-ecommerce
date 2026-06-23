export const siteConfig = {
  name: "Atelier Commerce",
  description:
    "Premium minimalist storefront — curated essentials with intentional design.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: "/og.jpg",
  links: {
    twitter: "https://twitter.com",
    github: "https://github.com",
  },
  locale: "en",
  supportedLocales: ["en"] as const,
} as const;
