import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRODUCT_VARIANT,
  mapFormVariantsToPayload,
  mapProductImagesToRetainPaths,
  mapProductVariantsToFormValues,
  parseCategoryId,
  sortCategoriesByName,
} from "./product-form";

describe("product-form helpers", () => {
  it("maps product variants to form values", () => {
    const result = mapProductVariantsToFormValues([
      {
        id: "1",
        sku: "SKU-1",
        name: "Large Navy",
        productId: "10",
        stock: 5,
        price: 49.99,
        options: { size: "L", color: "Navy" },
      },
    ]);

    expect(result).toEqual([
      { size: "L", color: "Navy", sku: "SKU-1", stock: 5, price: 49.99 },
    ]);
  });

  it("maps form variants to API payload with trimmed strings", () => {
    const result = mapFormVariantsToPayload([
      {
        ...DEFAULT_PRODUCT_VARIANT,
        sku: "  SKU-1  ",
        size: " M ",
        color: " Black ",
      },
    ]);

    expect(result).toEqual([
      {
        sku: "SKU-1",
        size: "M",
        color: "Black",
        stock: DEFAULT_PRODUCT_VARIANT.stock,
        price: DEFAULT_PRODUCT_VARIANT.price,
      },
    ]);
  });

  it("parses valid category ids and rejects invalid values", () => {
    expect(parseCategoryId("12")).toBe(12);
    expect(parseCategoryId("0")).toBeNull();
    expect(parseCategoryId("abc")).toBeNull();
  });

  it("sorts categories by name", () => {
    const sorted = sortCategoriesByName([
      { id: 2, name: "Zeta" },
      { id: 1, name: "Alpha" },
    ]);

    expect(sorted.map((c) => c.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("maps image URLs to retain paths", () => {
    expect(
      mapProductImagesToRetainPaths([
        "http://localhost:3001/uploads/products/a.jpg",
        "/uploads/products/b.jpg",
      ])
    ).toEqual(["/uploads/products/a.jpg", "/uploads/products/b.jpg"]);
  });
});
