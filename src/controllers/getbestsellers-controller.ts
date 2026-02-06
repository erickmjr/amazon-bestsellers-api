import * as getBestsellersServices from "../services/getbestsellers-service";
import { HttpResponse } from "../helpers/httpResponse";
import { APIGatewayProxyEventV2 } from "aws-lambda";

export const getAllBestsellersController = async (): Promise<HttpResponse> => {
    try {
        const response = await getBestsellersServices.getAllBestsellersService();

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
};

export const getBestsellersByCategoryController = async (event: APIGatewayProxyEventV2): Promise<HttpResponse> => {
    try {

        const category = event?.pathParameters?.category;

        if (!category) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Not found.' })
            }
        }

        const response = await getBestsellersServices.getBestsellersByCategoryService(category);

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
};

export const getFirstTopBestsellersController = async () => {
    try {

        const response = await getBestsellersServices.getFirstTopBestsellersService();

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
};