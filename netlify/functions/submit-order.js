function minutesUntil(neededBy) {
  if (!neededBy) return null;
  const target = Date.parse(neededBy);
  if (Number.isNaN(target)) return null;
  return Math.round((target - Date.now()) / 60000);
}

function priorityFor(job) {
  const dueInMinutes = minutesUntil(job.needed_by);
  let score = job.rush ? 100 : 0;

  if (dueInMinutes !== null) {
    if (dueInMinutes <= 0) score += 100;
    else if (dueInMinutes <= 240) score += 80;
    else if (dueInMinutes <= 720) score += 60;
    else if (dueInMinutes <= 1440) score += 40;
    else if (dueInMinutes <= 2880) score += 20;
  }

  const label = score >= 160 ? "CRITICAL" : score >= 100 ? "HIGH" : score >= 60 ? "ELEVATED" : "STANDARD";
  return { score, label, dueInMinutes };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  if (payload.source_system !== "friedmans_portal" || !Array.isArray(payload.productionJobs) || !payload.productionJobs.length) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "A Friedman portal payload with productionJobs is required" }),
    };
  }

  const receivedAt = new Date().toISOString();
  const productionJobs = payload.productionJobs.map((job) => {
    const priority = priorityFor(job);
    return {
      ...job,
      source: "Friedmans Portal",
      source_system: "friedmans_portal",
      priority_score: priority.score,
      priority_label: priority.label,
      due_in_minutes: priority.dueInMinutes,
      production_feed_received_at: receivedAt,
    };
  });

  const normalizedPayload = {
    ...payload,
    source: "Friedmans Portal",
    source_system: "friedmans_portal",
    productionJobs,
    production_feed_received_at: receivedAt,
  };

  const ingestUrl = process.env.PRODUCTION_BOARD_INGEST_URL;
  const ingestToken = process.env.PRODUCTION_BOARD_INGEST_TOKEN;
  let forwarded = false;
  let upstreamStatus = null;

  if (ingestUrl) {
    try {
      const response = await fetch(ingestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ingestToken ? { Authorization: `Bearer ${ingestToken}` } : {}),
        },
        body: JSON.stringify(normalizedPayload),
      });
      forwarded = response.ok;
      upstreamStatus = response.status;
    } catch (error) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accepted: true,
          forwarded: false,
          error: error instanceof Error ? error.message : "Production-board forwarding failed",
          orderId: payload.orderId,
          productionJobs,
        }),
      };
    }
  }

  return {
    statusCode: forwarded ? 202 : 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accepted: true,
      forwarded,
      upstreamStatus,
      configurationRequired: !ingestUrl,
      orderId: payload.orderId,
      productionJobs,
    }),
  };
};
