import type { NextApiRequest, NextApiResponse } from "next";

const API_TARGET =
  process.env.API_PROXY_TARGET?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  (process.env.NODE_ENV === "production"
    ? "https://api.flowpilotgroup.com"
    : "http://localhost:4000");

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

function buildTargetUrl(pathParts: string[] = [], query: NextApiRequest["query"]) {
  const path = pathParts.map(encodeURIComponent).join("/");
  const url = new URL(`${API_TARGET}/${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (key === "path") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          url.searchParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string") {
      url.searchParams.append(key, value);
    }
  }

  return url.toString();
}

async function readRawBody(req: NextApiRequest): Promise<Buffer | undefined> {
  if (METHODS_WITHOUT_BODY.has(req.method || "GET")) {
    return undefined;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pathParts = Array.isArray(req.query.path) ? req.query.path : [];
  const targetUrl = buildTargetUrl(pathParts, req.query);

  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "undefined") continue;

    if (Array.isArray(value)) {
      headers.set(key, value.join(", "));
    } else {
      headers.set(key, value);
    }
  }

  headers.delete("host");
  headers.delete("content-length");

  const rawBody = await readRawBody(req);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: rawBody,
      redirect: "manual",
    });

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();

      if (lowerKey === "content-encoding") return;
      if (lowerKey === "transfer-encoding") return;
      if (lowerKey === "content-length") return;

      res.setHeader(key, value);
    });

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    res.status(502).json({
      error: "Bad Gateway",
      detail: error instanceof Error ? error.message : "Unknown proxy error",
      targetUrl,
    });
  }
}