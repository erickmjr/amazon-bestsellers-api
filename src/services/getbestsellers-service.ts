import { HttpResponse } from "../helpers/httpResponse";
import { getAllBestSellers } from "../repositories/bestsellers-repository";

export const getBestsellersService = async (): Promise<HttpResponse> => {

    try {
        const allBestsellers = await getAllBestSellers();

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