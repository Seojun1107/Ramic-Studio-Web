import { compare, hash } from "bcryptjs";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { ensureAdminAccount, getAdminByUsername, normalizeMongoUser } from "../db";
import { ENV } from "./env";

export const ADMIN_SESSION_COOKIE = "ramic_admin_session";
const SESSION_TTL = 1000 * 60 * 60 * 12;

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
    if (!username || !password) {
      res.status(400).json({ message: "아이디와 비밀번호를 입력해 주세요." });
      return;
    }
    const admin = await getAdminByUsername(username);
    if (!admin?.passwordHash || !(await compare(password, admin.passwordHash))) {
      res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
      return;
    }
    const token = await createAdminSession(username);
    res.cookie(ADMIN_SESSION_COOKIE, token, { ...cookieOptions(req), maxAge: SESSION_TTL });
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
    res.clearCookie(ADMIN_SESSION_COOKIE, { ...cookieOptions(req), maxAge: -1 });
    res.json({ success: true });
  });
}
