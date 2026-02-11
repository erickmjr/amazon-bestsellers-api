import { ProductsByCategory } from "src/models/product.model";
import { HttpResponse } from "../helpers/httpResponse";
import { getAllBestsellers, getBestsellersByCategory, getFirstBestsellers } from "../repositories/bestsellers-repository";
import { BestsellersSnapshot, OverviewModel } from "src/models/overview.model";

export const getAllBestsellersService = async (): Promise<HttpResponse> => {

    try {

        const allBestsellers = await getAllBestsellers();

        if (!allBestsellers) {
            return {
                statusCode: 204,
                body: JSON.stringify({ message: 'No content yet, run scraper.' })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(allBestsellers)
        }

    } catch {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error.' })
        }
    }
}

export const getBestsellersByCategoryService = async (category: string): Promise<HttpResponse> => {
    try {

        const bestsellers = await getBestsellersByCategory(category);

        if (!bestsellers) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Not found.' })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(bestsellers)
        }

    } catch {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error.' })
        }
    }
}

export const getFirstTopBestsellersService = async (): Promise<HttpResponse> => {
    try {

        const firstBestsellers = await getFirstBestsellers();

        if (!firstBestsellers) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Not found.' })
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(firstBestsellers)
        }

    } catch {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error.' })
        }
    }
}

export const getBestsellersOverviewService = async (): Promise<HttpResponse> => {
    try {
        const allBestsellers = await getAllBestsellers() as BestsellersSnapshot | undefined;

        if (!allBestsellers) {
            return {
                statusCode: 204,
                body: JSON.stringify({ message: 'No content yet, run scraper.' })
            }
        }

        let totalProducts = 0;

        let starsSum = 0, starsCount = 0, starsMin: number | null = null, starsMax: number | null = null;
        let priceSum = 0, priceCount = 0, priceMin: number | null = null, priceMax: number | null = null;
        let reviewsSum = 0, reviewsCount = 0, reviewsMin: number | null = null, reviewsMax: number | null = null;

        for (const products of Object.values(allBestsellers.categories)) {
            totalProducts += products.length;

            for (const product of products) {
                const stars = product.rating?.stars;
                if (typeof stars === "number") {
                    starsSum += stars;
                    starsCount++;
                    starsMin = starsMin === null ? stars : Math.min(starsMin, stars);
                    starsMax = starsMax === null ? stars : Math.max(starsMax, stars);
                }

                const price = product.price?.value;
                if (typeof price === "number") {
                    priceSum += price;
                    priceCount++;
                    priceMin = priceMin === null ? price : Math.min(priceMin, price);
                    priceMax = priceMax === null ? price : Math.max(priceMax, price);
                }

                const reviews = product.rating?.reviewsCount;
                if (typeof reviews === "number") {
                    reviewsSum += reviews;
                    reviewsCount++;
                    reviewsMin = reviewsMin === null ? reviews : Math.min(reviewsMin, reviews);
                    reviewsMax = reviewsMax === null ? reviews : Math.max(reviewsMax, reviews);
                }
            }
        }

        const overviewBestsellers: OverviewModel = {
            categoryOrder: allBestsellers.categoryOrder,
            updatedAt: allBestsellers.updatedAt,
            totalProducts,
            stars: {
                min: starsMin,
                max: starsMax,
                avg: starsCount ? Number((starsSum / starsCount).toFixed(2)) : null,
                count: starsCount
            },
            price: {
                min: priceMin,
                max: priceMax,
                avg: priceCount ? Number((priceSum / priceCount).toFixed(2)) : null,
                count: priceCount
            },
            reviews: {
                min: reviewsMin,
                max: reviewsMax,
                avg: reviewsCount ? Number((reviewsSum / reviewsCount).toFixed(2)) : null,
                count: reviewsCount
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(overviewBestsellers)
        }

    } catch {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error.' })
        }
    }
}
