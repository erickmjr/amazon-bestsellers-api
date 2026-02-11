import { ProductsByCategory } from "./product.model";

export type OverviewModel = {
    categoryOrder: string[];
    updatedAt: string;
    totalProducts: number;
    stars: {
        lower: number | null;
        higher: number | null;
        avg: number | null;
        sum: number;
    }
    price: {
        lower: number | null;
        higher: number | null;
        avg: number | null;
        sum: number;
    }
    reviews: {
        lower: number | null;
        higher: number | null;
        avg: number | null;
        sum: number;
    }
}

export type BestsellersSnapshot = {
    categories: ProductsByCategory;
    categoryOrder: string[];
    updatedAt: string;
    sourceUrl: string;
}
