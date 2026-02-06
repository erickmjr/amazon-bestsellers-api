import * as getBestsellersService from "../services/getbestsellers-service";
import { HttpResponse } from "../helpers/httpResponse";
import { APIGatewayProxyEventV2 } from "aws-lambda";

export const getBestsellersController = async (event?: APIGatewayProxyEventV2): Promise<HttpResponse> => {

    try {

        const category = event?.pathParameters?.category;

        let response;

        if (category) {
            response = await getBestsellersService.getBestsellersByCategoryService(category);
        } else {
            response = await getBestsellersService.getAllBestsellersService();
        }

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