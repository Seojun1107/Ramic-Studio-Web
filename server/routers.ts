import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createNotice, listNotices } from "./db";

const fallbackNotices = [
  { id: 1, category: "STUDIO", title: "라믹 스튜디오가 새로운 세계를 만들기 시작했습니다.", body: "게임을 제품이 아닌 장소처럼 느끼게 만드는 일에 대한 팀의 이야기입니다.", publishedAt: new Date("2026-09-18") },
  { id: 2, category: "NEON VEIL", title: "첫 번째 신호를 공개합니다.", body: "우리가 만들고 있는 다음 세계의 조각을 지금 확인해보세요.", publishedAt: new Date("2026-08-29") },
  { id: 3, category: "CAREERS", title: "함께 미지의 세계를 만들 동료를 찾습니다.", body: "아티스트, 디자이너, 엔지니어, 프로듀서를 기다리고 있습니다.", publishedAt: new Date("2026-07-11") },
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
