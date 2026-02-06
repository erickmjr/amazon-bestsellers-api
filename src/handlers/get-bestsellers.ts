import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAllBestsellersController, getBestsellersByCategoryController, getFirstTopBestsellersController } from "src/controllers/getbestsellers-controller"

export const getBestsellers = async () => {
  return getAllBestsellersController();
}

export const getFirstTopBestsellers = async () => {
  return getFirstTopBestsellersController();
}

export const getBestsellersByCategory = async(event: APIGatewayProxyEventV2) => {
  return getBestsellersByCategoryController(event);
}