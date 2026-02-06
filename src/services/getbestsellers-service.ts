import { HttpResponse } from "../helpers/httpResponse";
import { getAllBestsellers, getBestsellersByCategory } from "../repositories/bestsellers-repository";

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

export const getBestsellersByCategoryService = async (category: string) => {
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