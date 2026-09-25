const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");

// Set environment before loading app
process.env.NODE_ENV = "test";
process.env.PORT = "0"; // Ephemeral port
process.env.JWT_SECRET = "test_jwt_secret_key_12345678901234567890";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prep_test";

const { app } = require("../server");

let server;
let baseUrl;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let payload = null;

    if (body) {
      payload = JSON.stringify(body);
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("Phase 1: Basic Root & Ping Endpoints", async () => {
  const rootRes = await makeRequest("GET", "/");
  assert.strictEqual(rootRes.statusCode, 200);
  assert.strictEqual(rootRes.body.name, "Prep API Platform");
  assert.strictEqual(rootRes.body.status, "running");

  const pingRes = await makeRequest("GET", "/ping");
  assert.strictEqual(pingRes.statusCode, 200);
  assert.strictEqual(pingRes.body.status, "ok");
});

test("Phase 1: Health Probes & Deep Health Check", async () => {
  const liveRes = await makeRequest("GET", "/health/live");
  assert.strictEqual(liveRes.statusCode, 200);
  assert.strictEqual(liveRes.body.status, "alive");

  const healthRes = await makeRequest("GET", "/health");
  assert.ok([200, 503].includes(healthRes.statusCode)); // 503 if mongo not running locally, 200 if connected
  assert.ok(healthRes.body.services);
  assert.ok(healthRes.body.services.mongodb);
  assert.ok(healthRes.body.system);
  assert.ok(healthRes.body.system.nodeVersion);
});

test("Phase 1: Security Headers & Correlation ID", async () => {
  const res = await makeRequest("GET", "/");
  assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
  assert.ok(res.headers["x-request-id"], "Response must include X-Request-Id header");
});

test("Phase 1: Global 404 Handler with Structured AppError Envelope", async () => {
  const res = await makeRequest("GET", "/api/undefined-endpoint-for-test");
  assert.strictEqual(res.statusCode, 404);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.status, "fail");
  assert.ok(res.body.message.includes("Route not found"));
  assert.ok(res.body.reqId);
});

test("Phase 1: Request Validation with Zod (Missing Fields on Register)", async () => {
  const res = await makeRequest("POST", "/api/auth/register", {});
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.status, "fail");
  assert.strictEqual(res.body.message, "Invalid request data");
  assert.ok(Array.isArray(res.body.details));

  const fields = res.body.details.map((d) => d.field);
  assert.ok(fields.includes("name"));
  assert.ok(fields.includes("email"));
  assert.ok(fields.includes("password"));
});

test("Phase 1: Authentication Guard on Protected Routes", async () => {
  const res = await makeRequest("POST", "/api/sessions/create", {
    role: "Backend Engineer",
    experience: 3,
    topicsToFocus: ["Node.js", "Redis"],
    questions: [{ question: "What is an event loop?" }],
  });
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes("Authentication required"));
});

test("Phase 1: Rate Limiter Headers", async () => {
  const res = await makeRequest("GET", "/api/auth/profile");
  // Rate limit header should be present
  assert.ok(res.headers["ratelimit-limit"] !== undefined);
  assert.ok(res.headers["ratelimit-remaining"] !== undefined);
});
