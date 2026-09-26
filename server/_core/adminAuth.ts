import { compare, hash } from "bcryptjs";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { ensureAdminAccount, getAdminByUsername, normalizeMongoUser, writeSecurityLog } from "../db";
import { ENV } from "./env";

export const ADMIN_SESSION_COOKIE = "ramic_admin_session";
const SESSION_TTL = 1000 * 60 * 60 * 12;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function requestMeta(req: Request) {
  return {
    ip: String(req.ip || req.socket.remoteAddress || "unknown").slice(0, 80),
    userAgent: String(req.get("user-agent") || "unknown").slice(0, 180),
    path: req.path,
  };
}

function isLoginRateLimited(req: Request) {
  const key = requestMeta(req).ip;
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 8;
}

function secret() {
  return new TextEncoder().encode(ENV.cookieSecret || "ramic-development-secret");
}
function cookieOptions(req: Request) {
  const secure = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
}

export async function createAdminSession(username: string) {
  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_TTL) / 1000))
    .sign(secret());
}

export async function getAdminFromRequest(req: Request) {
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  const token = cookies[ADMIN_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.role !== "admin" || typeof payload.username !== "string") return null;
    const admin = await getAdminByUsername(payload.username);
    return admin ? normalizeMongoUser(admin) : null;
  } catch {
    return null;
  }
}

export async function bootstrapAdmin() {
  if (!ENV.mongoUri || !ENV.adminUsername || !ENV.adminPassword) return;
  const passwordHash = await hash(ENV.adminPassword, 12);
  await ensureAdminAccount(ENV.adminUsername, passwordHash);
}

export function registerAdminAuthRoutes(app: Express) {
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const meta = requestMeta(req);
    if (isLoginRateLimited(req)) {
      void writeSecurityLog({ ...meta, event: "login_rate_limited", username });
      res.setHeader("Retry-After", "60");
      res.status(429).json({ message: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." });
      return;
    }
    if (!username || !password) {
      void writeSecurityLog({ ...meta, event: "login_invalid_input", username });
      res.status(400).json({ message: "아이디와 비밀번호를 입력해 주세요." });
      return;
    }
    const admin = await getAdminByUsername(username);
    if (!admin?.passwordHash || !(await compare(password, admin.passwordHash))) {
      void writeSecurityLog({ ...meta, event: "login_failed", username });
      res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
      return;
    }
    const token = await createAdminSession(username);
    res.cookie(ADMIN_SESSION_COOKIE, token, { ...cookieOptions(req), maxAge: SESSION_TTL });
    void writeSecurityLog({ ...meta, event: "login_success", username });
    res.json({ user: normalizeMongoUser(admin) });
  });

  app.get("/api/admin/me", async (req, res) => {
    const user = await getAdminFromRequest(req);
    if (!user) {
      res.status(401).json({ message: "관리자 로그인이 필요합니다." });
      return;
    }
    res.json({ user });
  });

  app.post("/api/admin/logout", (req, res) => {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    void writeSecurityLog({ ...requestMeta(req), event: "logout", detail: cookies[ADMIN_SESSION_COOKIE] ? "session_cookie_present" : "no_session_cookie" });
    res.clearCookie(ADMIN_SESSION_COOKIE, { ...cookieOptions(req), maxAge: -1 });
    res.json({ success: true });
  });
}
