import { HttpResponse } from "src/helpers/httpResponse";

export const health = async (): Promise<HttpResponse> => {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: "ok" }),
  };
};
