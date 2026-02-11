import { ProductsByCategory } from "./product.model";

export type OverviewModel = {
    categoryOrder: string[];
    updatedAt: string;
    totalProducts: number;
    stars: {
        min: number | null;
        max: number | null;
        avg: number | null;
        count: number;
    }
    price: {
        min: number | null;
        max: number | null;
        avg: number | null;
        count: number;
    }
    reviews: {
        min: number | null;
        max: number | null;
        avg: number | null;
        count: number;
    }
}

export type BestsellersSnapshot = {
    categories: ProductsByCategory;
    categoryOrder: string[];
    updatedAt: string;
    sourceUrl: string;
}