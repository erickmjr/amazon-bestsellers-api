import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { refreshBestsellersController } from "src/controllers/refreshbestsellers-controller";

export const refreshBestsellers = async (event: APIGatewayProxyEventV2) => {
  return refreshBestsellersController(event);
}