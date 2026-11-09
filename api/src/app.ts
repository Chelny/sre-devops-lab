import express from "express";
import { healthRouter } from "./routes/health.js";
import { itemsRouter } from "./routes/items.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  app.use(itemsRouter);
  app.use(errorHandler);
  return app;
}