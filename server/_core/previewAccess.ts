import crypto from "crypto";
import { parse } from "cookie";
import type { Request } from "express";

const TOKEN_TTL_SECONDS = 60 * 30;
const COOKIE_NAME = "ramic_preview_access";

function secret() {
  return process.env.JWT_SECRET || "ramic-development-secret";
}

function signature(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createPreviewToken(slug: string, now = Math.floor(Date.now() / 1000)) {
  const payload = `${slug}.${now + TOKEN_TTL_SECONDS}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyPreviewToken(token: string | undefined, slug: string, now = Math.floor(Date.now() / 1000)) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== slug) return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < now) return false;
  const expected = signature(`${parts[0]}.${parts[1]}`);
  const received = parts[2];
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function previewCookieName() {
  return COOKIE_NAME;
}

export function hasPreviewAccess(req: Request, slug: string) {
  const queryToken = typeof req.query.access === "string" ? req.query.access : undefined;
  const cookieToken = parse(req.headers.cookie ?? "")[COOKIE_NAME];
  return verifyPreviewToken(queryToken, slug) || verifyPreviewToken(cookieToken, slug);
}

export function signedPreviewUrl(rawUrl: string | null | undefined) {
  if (!rawUrl || !rawUrl.startsWith("/uploads/previews/")) return rawUrl ?? null;
  const match = rawUrl.match(/^\/uploads\/previews\/([^/]+)(\/.*)?$/);
  if (!match) return rawUrl;
  const token = createPreviewToken(match[1]);
  return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}access=${encodeURIComponent(token)}`;
}
