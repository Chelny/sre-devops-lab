import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("metrics endpoint", () => {
  it("exposes Prometheus metrics", async () => {
    const app = createApp();
    await request(app).get("/health"); // generates a metric
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("api_http_requests_total");
    expect(res.text).toContain("api_http_request_duration_seconds");
  });
});