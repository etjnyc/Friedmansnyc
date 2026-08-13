const crypto = require("crypto");

const STANDALONE_TEST_RECORD = {
  loginId: "shulman-test",
  restaurantId: "casa-louie",
  salt: "Na92fhgUYff4DBy3XpiWlw==",
  hash: "8ozD5ZpAjkBzH7F2u09aR5UauJm5WbgqENG7NZmLBvn02B1OueDaSiU+gWVguRGEvpZ854TpPCUJ82LyUr/nJQ==",
  role: "admin",
};

// This key signs only the temporary standalone-test session. It does not grant
// access to a production-board endpoint because production transport is disabled.
const STANDALONE_TEST_SESSION_SECRET = "friedmans-standalone-design-test-2026-08";

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function signSession(record, standaloneTest = false) {
  const secret = standaloneTest ? STANDALONE_TEST_SESSION_SECRET : process.env.RESTAURANT_SESSION_SECRET;
  if (!secret) return null;
  const payload = {
    restaurantId: record.restaurantId,
    loginId: record.loginId,
    role: record.role || "end_user",
    mode: standaloneTest ? "standalone-test" : "restaurant",
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" }, { Allow: "POST" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const loginId = String(body.loginId || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!loginId || !password) return json(400, { error: "Login ID and password are required" });

  const rawCredentials = process.env.RESTAURANT_CREDENTIALS_JSON;
  let credentials;
  let standaloneTest = false;

  if (!rawCredentials) {
    credentials = [STANDALONE_TEST_RECORD];
    standaloneTest = true;
  } else {
    try {
      credentials = JSON.parse(rawCredentials);
    } catch {
      return json(500, { error: "Restaurant authentication configuration is invalid" });
    }
    if (!Array.isArray(credentials)) return json(500, { error: "Restaurant authentication configuration is invalid" });
  }

  const record = credentials.find((entry) => String(entry.loginId || "").toLowerCase() === loginId);
  if (!record?.salt || !record?.hash || !record?.restaurantId) {
    return json(401, { error: "Invalid login ID or password" });
  }

  try {
    const salt = Buffer.from(record.salt, "base64");
    const expected = Buffer.from(record.hash, "base64");
    const derived = crypto.scryptSync(password, salt, expected.length, {
      N: 16384,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    });
    if (derived.length !== expected.length || !crypto.timingSafeEqual(derived, expected)) {
      return json(401, { error: "Invalid login ID or password" });
    }
  } catch {
    return json(401, { error: "Invalid login ID or password" });
  }

  const sessionToken = signSession(record, standaloneTest);
  if (!sessionToken) return json(503, { error: "Restaurant session signing has not been configured on this deployment" });

  const role = standaloneTest ? "admin" : (record.role || "end_user");
  return json(200, {
    ok: true,
    standaloneTest,
    sessionToken,
    user: {
      id: standaloneTest ? "portal:standalone-test" : `restaurant:${record.restaurantId}`,
      name: standaloneTest ? "Shulman Portal Tester" : record.loginId,
      role,
      defaultRestaurantId: record.restaurantId,
      allowedRestaurantIds: role === "admin" ? [] : [record.restaurantId],
    },
  });
};