import express from "express";
import { healthRouter } from "./routes/health.js";
import { itemsRouter } from "./routes/items.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { metricsMiddleware } from "./middleware/metrics.js";
import { registry } from "./metrics.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  // Prometheus endpoint (outside metrics middlewares to avoid counting itself)
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", registry.contentType);
    res.send(await registry.metrics());
  });

  app.use(metricsMiddleware);
  app.use(healthRouter);
  app.use(itemsRouter);
  app.use(errorHandler);

  return app;
}