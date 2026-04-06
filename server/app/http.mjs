export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function isOriginAllowed(origin, config) {
  if (!origin) {
    return false;
  }

  if (config.corsOrigins.includes("*")) {
    return true;
  }

  return config.corsOrigins.includes(origin);
}

function applyCorsHeaders(headers, request, config) {
  const origin = request.headers.origin;
  if (!origin || !isOriginAllowed(origin, config)) {
    return;
  }

  headers["Access-Control-Allow-Origin"] = config.corsOrigins.includes("*") ? "*" : origin;
  headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Admin-Token";
  headers["Access-Control-Allow-Methods"] = "GET,POST,PATCH,PUT,DELETE,OPTIONS";
  headers.Vary = "Origin";
}

export function sendJson(response, request, config, statusCode, payload) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  applyCorsHeaders(headers, request, config);
  response.writeHead(statusCode, headers);
  const indent = config.prettyJson !== false ? 2 : undefined;
  response.end(`${JSON.stringify(payload, null, indent)}\n`);
}

export function sendNoContent(response, request, config) {
  const headers = {};
  applyCorsHeaders(headers, request, config);
  response.writeHead(204, headers);
  response.end();
}

export function sendError(response, request, config, statusCode, message, details) {
  const error = { message };
  if (details !== undefined) {
    error.details = details;
  }

  sendJson(response, request, config, statusCode, { error });
}

export async function readJsonBody(request, limitBytes) {
  const contentLength = Number(request.headers["content-length"] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > limitBytes) {
    throw new HttpError(413, `Request body exceeds ${limitBytes} bytes.`);
  }

  let totalBytes = 0;
  const chunks = [];

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > limitBytes) {
      throw new HttpError(413, `Request body exceeds ${limitBytes} bytes.`);
    }

    chunks.push(buffer);
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export function matchPath(pathname, pattern) {
  const actualParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);

  if (actualParts.length !== patternParts.length) {
    return null;
  }

  const params = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const actual = actualParts[index];
    const expected = patternParts[index];

    if (expected.startsWith(":")) {
      try {
        params[expected.slice(1)] = decodeURIComponent(actual);
      } catch {
        return null;
      }
      continue;
    }

    if (actual !== expected) {
      return null;
    }
  }

  return params;
}

function extractAdminToken(request) {
  const direct = request.headers["x-admin-token"];
  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const authorization = request.headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

export function handlePreflight(request, response, config) {
  if (request.method !== "OPTIONS") {
    return false;
  }

  const headers = {};
  applyCorsHeaders(headers, request, config);
  response.writeHead(204, headers);
  response.end();
  return true;
}

export class Router {
  constructor() {
    this.routes = [];
  }

  register(method, pattern, handler) {
    this.routes.push({ method, pattern, handler });
  }

  async handle(context) {
    for (const route of this.routes) {
      if (route.method !== context.request.method) {
        continue;
      }

      const params = matchPath(context.url.pathname, route.pattern);
      if (!params) {
        continue;
      }

      context.params = params;
      await route.handler(context);
      return true;
    }

    return false;
  }
}

export function createRequestContext({ request, response, config }) {
  const url = new URL(request.url, `http://${request.headers.host ?? "127.0.0.1"}`);

  return {
    request,
    response,
    config,
    url,
    params: {},
    readJson() {
      return readJsonBody(request, config.bodyLimitBytes);
    },
    sendJson(statusCode, payload) {
      sendJson(response, request, config, statusCode, payload);
    },
    sendNoContent() {
      sendNoContent(response, request, config);
    },
    sendError(statusCode, message, details) {
      sendError(response, request, config, statusCode, message, details);
    },
    assertAdminAuth() {
      if (!config.adminToken) {
        throw new HttpError(500, "ADMIN_TOKEN is not configured.");
      }

      const candidate = extractAdminToken(request);
      if (candidate !== config.adminToken) {
        throw new HttpError(401, "Unauthorized admin request.");
      }
    },
  };
}
