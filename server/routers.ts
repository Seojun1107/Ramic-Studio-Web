import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createNotice, listNotices } from "./db";

const fallbackNotices = [
  { id: 1, category: "STUDIO", title: "Ramic Studio enters a new chapter of world-building.", body: "A note from the team on making games that feel like places — not products.", publishedAt: new Date("2026-09-18") },
  { id: 2, category: "NEON VEIL", title: "The first transmission is live.", body: "A fragment from our next world is now broadcasting.", publishedAt: new Date("2026-08-29") },
  { id: 3, category: "CAREERS", title: "We are looking for curious minds.", body: "Artists, designers, engineers, and producers — come build the unknown with us.", publishedAt: new Date("2026-07-11") },
];

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  news: router({
    list: publicProcedure.query(async () => { const rows = await listNotices(); return rows.length ? rows : fallbackNotices; }),
    publish: adminProcedure.input(z.object({ category: z.enum(["STUDIO", "NEON VEIL", "CAREERS", "COMMUNITY"]), title: z.string().min(3).max(255), body: z.string().min(3), publishedAt: z.date().optional() })).mutation(({ input }) => createNotice({ ...input, publishedAt: input.publishedAt ?? new Date() })),
  }),
});
export type AppRouter = typeof appRouter;
