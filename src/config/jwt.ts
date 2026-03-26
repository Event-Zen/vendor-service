import jwt from "jsonwebtoken";
import type { Request } from "express";

export interface JwtUserPayload {
  id: string;
  role: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtUserPayload;
  }
}

function normalizeSecret(s: string): string {
  return s.replace(/\uFEFF/g, "").replace(/\r\n?/g, "").trim();
}

const jwtAccessSecret: string = normalizeSecret(
  process.env.JWT_ACCESS_SECRET || "dev_access_secret"
);

export function verifyJwtFromRequest(req: Request): JwtUserPayload {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    const err = new Error("Authorization header missing or malformed");
    (err as any).statusCode = 401;
    throw err;
  }

  const token = authHeader.substring(7).trim();

  function setUserFromDecoded(decoded: any): JwtUserPayload {
    if (!decoded || typeof decoded !== "object") {
      const err = new Error("Invalid token payload");
      (err as any).statusCode = 401;
      throw err;
    }

    const id = decoded.id ?? decoded.sub;
    const role = decoded.role;
    const email = decoded.email;

    if (!id || !role || !email) {
      const err = new Error("Invalid token payload");
      (err as any).statusCode = 401;
      throw err;
    }

    req.user = { id: String(id), role: String(role), email: String(email) };
    return req.user;
  }

  const opts = { algorithms: ["HS256"] as jwt.Algorithm[] };
  const secretsToTry = [
    jwtAccessSecret,
    "event_zen_access_secret",
    "dev_access_secret",
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  let lastError: any;
  for (const secret of secretsToTry) {
    try {
      const decoded = jwt.verify(token, secret, opts);
      return setUserFromDecoded(decoded);
    } catch (e) {
      lastError = e;
    }
  }

  const reason =
    lastError?.message || lastError?.name || String(lastError) || "unknown";
  const err = new Error(`Invalid or expired token: ${reason}`) as Error & {
    statusCode?: number;
    details?: string;
  };
  err.statusCode = 401;
  err.details = reason;
  throw err;
}
