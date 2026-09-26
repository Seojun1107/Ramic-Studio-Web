import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../shared/types";
import { getAdminFromRequest } from "./adminAuth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const admin = await getAdminFromRequest(opts.req);
  if (admin) return { req: opts.req, res: opts.res, user: admin };
  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }
  return { req: opts.req, res: opts.res, user };
}
