"use client";

import Image from "next/image";
import { toast } from "sonner";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cartAddItem } from "@/lib/cart-actions";
import type { Product, ProductVariant } from "../types";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import { useWishlistHydrate } from "@/shared/hooks/use-wishlist-hydrate";
import {
  formatVariantLabel,
  findVariantForSize,
  findVariantForColor,
  findVariantByOptions,
  uniqueVariantOptionValues,
  hasUniqueVariantOptionMatrix,
} from "../lib/variant-label";

type Props = {
  product: Product;
};

function collectGalleryImages(
  product: Product,
  variant?: ProductVariant
): string[] {
  const urls = [...(product.images ?? [])].filter(Boolean);
  if (variant?.image && !urls.includes(variant.image)) {
    urls.unshift(variant.image);
  }
  return urls.length > 0 ? [...new Set(urls)] : ["/placeholder.svg"];
}

function OptionPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (next: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "min-w-11 cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-all",
                "hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductDetailView({ product }: Props) {
  useWishlistHydrate();
  const recordView = useRecentlyViewedStore((s) => s.recordView);

  const sizes = React.useMemo(
    () => uniqueVariantOptionValues(product.variants, "size"),
    [product.variants]
  );
  const colors = React.useMemo(
    () => uniqueVariantOptionValues(product.variants, "color"),
    [product.variants]
  );

  const useOptionPickers =
    (sizes.length > 0 || colors.length > 0) &&
    hasUniqueVariantOptionMatrix(product.variants) &&
    product.variants.length > 1;

  const defaultVariant = product.variants[0];
  const [variantId, setVariantId] = React.useState(defaultVariant?.id ?? "");
  const [selectedSize, setSelectedSize] = React.useState(
    defaultVariant?.options?.size?.trim() ?? sizes[0]
  );
  const [selectedColor, setSelectedColor] = React.useState(
    defaultVariant?.options?.color?.trim() ?? colors[0]
  );

  React.useEffect(() => {
    recordView(product.slug ?? product.id);
  }, [product.slug, product.id, recordView]);

  function applyVariant(match: ProductVariant) {
    setVariantId(match.id);
    if (sizes.length > 0) {
      setSelectedSize(match.options?.size?.trim() ?? sizes[0]);
    }
    if (colors.length > 0) {
      setSelectedColor(match.options?.color?.trim() ?? colors[0]);
    }
  }

  function handleSizeChange(size: string) {
    const match =
      findVariantByOptions(product.variants, size, selectedColor) ??
      findVariantForSize(product.variants, size, selectedColor);
    if (match) applyVariant(match);
  }

  function handleColorChange(color: string) {
    const match =
      findVariantByOptions(product.variants, selectedSize, color) ??
      findVariantForColor(product.variants, color, selectedSize);
    if (match) applyVariant(match);
  }

  const variant: ProductVariant | undefined = product.variants.find(
    (v) => v.id === variantId
  );

  const galleryImages = React.useMemo(
    () => collectGalleryImages(product, variant),
    [product, variant]
  );

  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];

  React.useEffect(() => {
    setActiveIndex(0);
  }, [variantId, galleryImages.length]);

  const [adding, setAdding] = React.useState(false);

  async function handleAddToCart() {
    if (!variant || adding) return;
    setAdding(true);
    try {
      await cartAddItem({
        variantId: variant.id,
        productId: product.id,
        slug: product.slug ?? product.id,
        name: product.name,
        variantLabel: formatVariantLabel(variant),
        price: variant.price,
        quantity: 1,
        image: variant.image ?? product.images[0],
        maxQty: variant.stock,
      });
      toast.success("Added to bag");
    } finally {
      setAdding(false);
    }
  }

  const inStock = (variant?.stock ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto grid max-w-6xl gap-10 p-4 lg:grid-cols-2 lg:gap-14 lg:p-6"
    >
      {/* Gallery */}
      <div className="mx-auto w-full max-w-xl space-y-4 lg:mx-0">
        <div className="border-border relative aspect-4/5 w-full overflow-hidden rounded-2xl border bg-muted/30 shadow-sm">
          <Image
            fill
            priority
            src={activeImage}
            alt={product.name}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
          />
        </div>

        {galleryImages.length > 1 ? (
          <div
            role="listbox"
            aria-label="Product images"
            className="flex gap-2.5 overflow-x-auto pb-1"
          >
            {galleryImages.map((src, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  type="button"
                  role="option"
                  key={`${src}-${index}`}
                  aria-selected={selected}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1} of ${galleryImages.length}`}
                  className={cn(
                    "border-border relative cursor-pointer size-20 shrink-0 overflow-hidden rounded-lg border-2 bg-muted/40 transition-all",
                    "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected && "border-foreground ring-1 ring-foreground/20"
                  )}
                >
                  <Image
                    fill
                    alt=""
                    src={src}
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="flex flex-col justify-center gap-8">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {product.category}
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            {product.name}
          </h1>
          {product.description?.trim() ? (
            <p className="text-muted-foreground max-w-prose text-base leading-relaxed">
              {product.description}
            </p>
          ) : null}
        </header>

        <div className="border-border space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
            <motion.div layout>
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
                Price
              </p>
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                ${variant?.price.toFixed(2) ?? "—"}
              </p>
              {variant?.compareAtPrice ? (
                <p className="text-muted-foreground mt-1 text-sm line-through tabular-nums">
                  ${variant.compareAtPrice.toFixed(2)}
                </p>
              ) : null}
            </motion.div>
            <Badge
              variant={inStock ? "secondary" : "destructive"}
              className="text-xs font-medium"
            >
              {inStock ? `${variant?.stock ?? 0} in stock` : "Out of stock"}
            </Badge>
          </div>

          {product.variants.length > 0 ? (
            <div className="space-y-5">
              {useOptionPickers ? (
                <>
                  <OptionPills
                    label="Size"
                    options={sizes}
                    value={selectedSize}
                    onChange={handleSizeChange}
                  />
                  <OptionPills
                    label="Color"
                    options={colors}
                    value={selectedColor}
                    onChange={handleColorChange}
                  />
                </>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-sm font-medium">Options</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const selected = v.id === variantId;
                      const disabled = v.stock <= 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setVariantId(v.id)}
                          className={cn(
                            "rounded-md border px-4 py-2 text-sm font-medium transition-all",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background hover:border-foreground/40",
                            disabled && "cursor-not-allowed opacity-40"
                          )}
                        >
                          {formatVariantLabel(v)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {variant ? (
                <p className="text-muted-foreground text-xs">
                  Selected:{" "}
                  <span className="text-foreground font-medium">
                    {formatVariantLabel(variant)}
                  </span>
                  {variant.sku ? (
                    <>
                      {" "}
                      · SKU{" "}
                      <span className="font-mono text-[11px]">
                        {variant.sku}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          ) : null}

          <Button
            size="lg"
            type="button"
            onClick={() => void handleAddToCart()}
            disabled={!variant || !inStock || adding}
            className="h-12 w-full text-base font-semibold"
          >
            {adding ? "Adding…" : inStock ? "Add to bag" : "Out of stock"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
