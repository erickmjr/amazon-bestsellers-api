import type {
  BestsellersData,
  Product,
  ProductsByCategory,
} from "../models/product.model";

export type ExtractCategoriesResult =
  | { ok: true; categories: ProductsByCategory }
  | { ok: false; message: string };

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Product>;
  return (
    typeof candidate.rank === "number" &&
    Number.isFinite(candidate.rank) &&
    typeof candidate.title === "string" &&
    candidate.title.length > 0 &&
    typeof candidate.href === "string" &&
    candidate.href.length > 0
  );
};

const isProductsByCategory = (value: unknown): value is ProductsByCategory => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  return Object.values(record).every(
    (products) => Array.isArray(products) && products.every(isProduct)
  );
};

const groupTopProductsByCategory = (
  products: Product[],
  limit: number
): ProductsByCategory => {
  const grouped: ProductsByCategory = {};

  for (const product of products) {
    const category = product.category;
    if (!category) continue;

    (grouped[category] ??= []).push(product);
  }

  for (const category of Object.keys(grouped)) {
    grouped[category] = grouped[category]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);
  }

  return grouped;
};

export const extractCategoriesFromRefreshPayload = (
  payload: unknown,
  limit: number
): ExtractCategoriesResult => {
  if (Array.isArray(payload)) {
    if (!payload.every(isProduct)) {
      return {
        ok: false,
        message: "Body array must contain valid products.",
      };
    }

    return {
      ok: true,
      categories: groupTopProductsByCategory(payload, limit),
    };
  }

  const data = payload as Partial<BestsellersData> | null;
  if (!data?.categories || !isProductsByCategory(data.categories)) {
    return {
      ok: false,
      message: "Body must contain a valid 'categories' object.",
    };
  }

  return {
    ok: true,
    categories: data.categories,
  };
};

