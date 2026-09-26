import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { writeSecurityLog } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      void writeSecurityLog({
        event: "admin_access_denied",
        path: opts.path,
        ip: String(ctx.req.ip || ctx.req.socket.remoteAddress || "unknown").slice(0, 80),
        userAgent: String(ctx.req.get("user-agent") || "unknown").slice(0, 180),
      });
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    if (opts.type === "mutation") {
      void writeSecurityLog({
        event: "admin_mutation",
        actor: ctx.user.openId,
        path: opts.path,
        ip: String(ctx.req.ip || ctx.req.socket.remoteAddress || "unknown").slice(0, 80),
        userAgent: String(ctx.req.get("user-agent") || "unknown").slice(0, 180),
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
