import type {
  BestsellersData,
  Product,
  ProductsByCategory,
} from "../models/product.model";

export type ExtractCategoriesResult =
  | { ok: true; categories: ProductsByCategory; categoryOrder: string[] }
  | { ok: false; message: string };

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

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

export const extractCategoriesFromRefreshPayload = (
  payload: unknown
): ExtractCategoriesResult => {
  if (Array.isArray(payload)) {
    return {
      ok: false,
      message: "Body array is not supported. Send { categories, categoryOrder }.",
    };
  }

  const data = payload as Partial<BestsellersData> | null;

  if (!data?.categories || !isProductsByCategory(data.categories)) {
    return {
      ok: false,
      message: "Body must contain a valid 'categories' object.",
    };
  }

  if (!data.categoryOrder || !isStringArray(data.categoryOrder)) {
    return {
      ok: false,
      message: "Body must contain 'categoryOrder' string array.",
    };
  }

  return {
    ok: true,
    categories: data.categories,
    categoryOrder: data.categoryOrder,
  };
};


