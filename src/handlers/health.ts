import { healthController } from "src/controllers/health-controller"

export const health = async () => {
  return healthController();
}