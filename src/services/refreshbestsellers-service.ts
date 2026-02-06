import { HttpResponse } from "../helpers/httpResponse";
import { saveLatestBestsellers } from "../repositories/bestsellers-repository";
import { extractCategoriesFromRefreshPayload } from "../utils/refresh-payload";

export const refreshBestsellersService = async (
  body: unknown
): Promise<HttpResponse> => {
  const payloadResult = extractCategoriesFromRefreshPayload(body);

  if (payloadResult.ok === false) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request body.',
        detail: payloadResult.message
      }),
    };
  }

  try {
    await saveLatestBestsellers(payloadResult.categories, payloadResult.categoryOrder);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Bestsellers refreshed." }),
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }
};
