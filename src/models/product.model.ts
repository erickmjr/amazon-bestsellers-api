export type Money = {
    value?: number;
    currency?: string;
    raw?: string;
};

export type Rating = {
    stars?: number;
    reviewsCount?: number;
    rawStarsText?: string;
};

export type Product = {
    rank: number;
    title: string;
    href: string;
    image?: string;
    category?: string;
    price?: Money;
    rating?: Rating;
};

export type ProductsByCategory = Record<string, Product[]>;

export type BestsellersData = {
    categories: ProductsByCategory;
    categoryOrder: string[];
};
