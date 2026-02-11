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

        let starsSum = 0, starsCount = 0, starsLower: number | null = null, starsHigher: number | null = null;
        let priceSum = 0, priceCount = 0, priceLower: number | null = null, priceHigher: number | null = null;
        let reviewsSum = 0, reviewsCount = 0, reviewsLower: number | null = null, reviewsHigher: number | null = null;

        for (const products of Object.values(allBestsellers.categories)) {
            totalProducts += products.length;

            for (const product of products) {
                const stars = product.rating?.stars;
                if (typeof stars === "number") {
                    starsSum += stars;
                    starsCount++;
                    starsLower = starsLower === null ? stars : Math.min(starsLower, stars);
                    starsHigher = starsHigher === null ? stars : Math.max(starsHigher, stars);
                }

                const price = product.price?.value;
                if (typeof price === "number") {
                    priceSum += price;
                    priceCount++;
                    priceLower = priceLower === null ? price : Math.min(priceLower, price);
                    priceHigher = priceHigher === null ? price : Math.max(priceHigher, price);
                }

                const reviews = product.rating?.reviewsCount;
                if (typeof reviews === "number") {
                    reviewsSum += reviews;
                    reviewsCount++;
                    reviewsLower = reviewsLower === null ? reviews : Math.min(reviewsLower, reviews);
                    reviewsHigher = reviewsHigher === null ? reviews : Math.max(reviewsHigher, reviews);
                }
            }
        }

        const overviewBestsellers: OverviewModel = {
            categoryOrder: allBestsellers.categoryOrder,
            updatedAt: allBestsellers.updatedAt,
            totalProducts,
            stars: {
                lower: starsLower,
                higher: starsHigher,
                avg: starsCount ? Number((starsSum / starsCount).toFixed(2)) : null,
                sum: Number(starsSum.toFixed(2))
            },
            price: {
                lower: priceLower,
                higher: priceHigher,
                avg: priceCount ? Number((priceSum / priceCount).toFixed(2)) : null,
                sum: Number(priceSum.toFixed(2))
            },
            reviews: {
                lower: reviewsLower,
                higher: reviewsHigher,
                avg: reviewsCount ? Number((reviewsSum / reviewsCount).toFixed(2)) : null,
                sum: Number(reviewsSum.toFixed(2))
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
