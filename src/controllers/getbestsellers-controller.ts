import { getBestsellersService } from "../services/getbestsellers-service";
import { HttpResponse } from "../helpers/httpResponse";

export const getBestsellersController = async (): Promise<HttpResponse> => {

    try {

        const response = await getBestsellersService();

        return {
            statusCode: response.statusCode,
            body: response.body
        }
        
    } catch {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error.' })
        }
    }

}