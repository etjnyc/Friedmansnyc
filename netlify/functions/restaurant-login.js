const crypto = require("crypto");

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
  if (!rawCredentials) {
    return json(503, { error: "Restaurant authentication has not been configured on this deployment" });
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    return json(500, { error: "Restaurant authentication configuration is invalid" });
  }

  if (!Array.isArray(credentials)) return json(500, { error: "Restaurant authentication configuration is invalid" });

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

  return json(200, {
    ok: true,
    user: {
      id: `restaurant:${record.restaurantId}`,
      name: record.loginId,
      role: "end_user",
      defaultRestaurantId: record.restaurantId,
      allowedRestaurantIds: [record.restaurantId],
    },
  });
};
