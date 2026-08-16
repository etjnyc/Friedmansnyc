const crypto = require("crypto");

let cachedCredentialsRaw = null;
let cachedCredentials = null;

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

function loadCredentials(rawCredentials) {
  if (cachedCredentials && cachedCredentialsRaw === rawCredentials) {
    return cachedCredentials;
  }

  const parsed = JSON.parse(rawCredentials);
  if (!Array.isArray(parsed)) throw new Error("Invalid credentials configuration");

  cachedCredentialsRaw = rawCredentials;
  cachedCredentials = parsed;
  return parsed;
}

function signSession(record) {
  const secret = process.env.RESTAURANT_SESSION_SECRET;
  if (!secret) return null;
  const payload = {
    restaurantId: record.restaurantId,
    loginId: record.loginId,
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
  if (!rawCredentials) {
    return json(503, { error: "Restaurant authentication has not been configured on this deployment" });
  }

  let credentials;
  try {
    credentials = loadCredentials(rawCredentials);
  } catch {
    return json(500, { error: "Restaurant authentication configuration is invalid" });
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

  const sessionToken = signSession(record);
  if (!sessionToken) return json(503, { error: "Restaurant session signing has not been configured on this deployment" });

  return json(200, {
    ok: true,
    sessionToken,
    user: {
      id: `restaurant:${record.restaurantId}`,
      name: record.loginId,
      role: "end_user",
      defaultRestaurantId: record.restaurantId,
      allowedRestaurantIds: [record.restaurantId],
    },
  });
};
