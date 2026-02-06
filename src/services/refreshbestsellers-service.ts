import { HttpResponse } from "../helpers/httpResponse";
import { saveLatestBestsellers } from "../repositories/bestsellers-repository";
import { extractCategoriesFromRefreshPayload } from "../utils/refresh-payload";

const MAX_PRODUCTS_PER_CATEGORY = 3;

export const refreshBestsellersService = async (
  body: unknown
): Promise<HttpResponse> => {
  const payloadResult = extractCategoriesFromRefreshPayload(
    body,
    MAX_PRODUCTS_PER_CATEGORY
  );

  if (payloadResult.ok === false) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: payloadResult.message }),
    };
  }

  try {
    await saveLatestBestsellers(payloadResult.categories);

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
