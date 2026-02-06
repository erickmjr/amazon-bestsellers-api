import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { HttpResponse } from "src/helpers/httpResponse";
import { refreshBestsellersService } from "src/services/refreshbestsellers-service";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const getHeader = (
    headers: APIGatewayProxyEventV2["headers"] | undefined,
    headerName: string
): string => {
    
    if (!headers) return '';

    const target = headerName.toLocaleLowerCase();
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLocaleLowerCase() === target) return value ?? '';
    };

    return '';
};

export const refreshBestsellersController = async (
    event: APIGatewayProxyEventV2
): Promise<HttpResponse> => {
    if (!INTERNAL_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Missing API key.' })
        };
    };

    const apiKey = getHeader(event.headers, 'x-api-key');

    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Unauthorized.' })
        };
    };

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing request body.' })
        };
    };

    let bodyJson: unknown;
    
    try {

        bodyJson = JSON.parse(event.body);

        return await refreshBestsellersService(bodyJson);

    } catch {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON body.' })
        }
    }
}