import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProductBySlug } from "@/modules/buyer/products/services/products.service";
import { ProductDetailView } from "@/modules/buyer/products/components/product-detail-view";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProductBySlug(slug);
    return {
      title: product.name,
      description: product.description?.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.description?.slice(0, 160),
        images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  try {
    const product = await fetchProductBySlug(slug);
    return <ProductDetailView product={product} />;
  } catch {
    notFound();
  }
}
