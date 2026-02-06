import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getBestsellersController } from "src/controllers/getbestsellers-controller"

export const getBestsellers = async (event: APIGatewayProxyEventV2) => {
  return getBestsellersController(event);
}