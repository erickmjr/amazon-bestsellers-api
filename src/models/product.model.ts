export type Product = {
    rank: number;
    title: string;
    href: string;
    image?: string;
    price?: {
        value?: number;
        currency?: string;
        raw?: string;
    };
    rating?: {
        stars?: number;
        reviewsCount?: number;
        rawStarsText?: string;
    };
};