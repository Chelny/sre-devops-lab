import client from "prom-client";

// Collect default metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ prefix: "api_" });

// HTTP requests counter (rate + status codes)
export const httpRequestsTotal = new client.Counter({
  name: "api_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"] as const,
});

// Latency histogram (P50, P95, P99)
export const httpRequestDuration = new client.Histogram({
  name: "api_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const registry = client.register;