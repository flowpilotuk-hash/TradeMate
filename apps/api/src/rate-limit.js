const buckets = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const socket = req.socket || req.connection;
  return socket?.remoteAddress || "unknown";
}

function rateLimit(req, res) {
  const ip = getClientIp(req);
  const now = Date.now();

  let entry = buckets.get(ip);

  if (!entry) {
    entry = {
      count: 0,
      windowStart: now,
    };
    buckets.set(ip, entry);
  }

  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    res.writeHead(429, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Too many requests. Please slow down.",
      })
    );

    return false;
  }

  return true;
}

module.exports = {
  rateLimit,
};