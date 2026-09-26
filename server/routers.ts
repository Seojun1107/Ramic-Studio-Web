import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addAdmin,
  changeAdminPassword,
  createGame,
  createNotice,
  createTeam,
  deleteGame,
  deleteNotice,
  deleteTeam,
  getNotice,
  getSettings,
  listAllTeam,
  listGames,
  listNotices,
  listTeam,
  saveSettings,
  updateGame,
  updateNotice,
  updateTeam,
} from "./db";
import { hash } from "bcryptjs";
import { publishDiscordNotice } from "./_core/discord";
const gameInput = z.object({
  code: z.string().min(1).max(20),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
  genre: z.string().max(120).default(""),
  status: z.string().max(80).default("개발 중"),
  imageUrl: z.string().max(2000).default(""),
  videoUrl: z.string().max(2000).nullable().optional(),
  externalUrl: z.string().url().max(2000).nullable().optional(),
  externalLabel: z.string().max(40).nullable().optional(),
  isNew: z.boolean().default(false),
  previewUrl: z.string().max(2000).nullable().optional(),
});
const noticeInput = z.object({
  category: z.string().min(1).max(40),
  title: z.string().min(3).max(255),
  body: z.string().min(3).max(100000),
  coverUrl: z.string().max(2000).nullable().optional(),
  publishedAt: z.date().optional(),
  discordNotify: z.boolean().default(false),
  discordMentionEveryone: z.boolean().default(false),
  discordBody: z.string().max(100000).optional(),
});
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),
  site: router({
    settings: publicProcedure.query(() => getSettings()),
    games: publicProcedure.query(async () => listGames()),
    team: publicProcedure.query(async () => listTeam()),
  }),
  news: router({
    list: publicProcedure.query(() => listNotices()),
    detail: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => getNotice(input.id)),
    publish: adminProcedure.input(noticeInput).mutation(async ({ input }) => {
      const { discordNotify, discordMentionEveryone, discordBody, ...notice } = input;
      const created = await createNotice({
        ...notice,
        publishedAt: notice.publishedAt ?? new Date(),
      });
      if (!created)
        return {
          notice: null,
          discord: { sent: false, message: "공지 저장에 실패했습니다." },
        };
      const discord = discordNotify
        ? await publishDiscordNotice({
            title: created.title,
            body: created.body,
            mentionEveryone: discordMentionEveryone,
            customBody: discordBody,
          })
        : {
            sent: false as const,
            skipped: true as const,
            message: "Discord 전송을 건너뛰었습니다.",
          };
      return { notice: created, discord };
    }),
    update: adminProcedure
      .input(noticeInput.extend({ id: z.string() }))
      .mutation(async ({ input }) => {
        const { id, discordNotify, discordMentionEveryone, discordBody, ...notice } = input;
        const updated = await updateNotice(id, notice);
        if (!updated)
          return {
            notice: null,
            discord: { sent: false, message: "공지 수정에 실패했습니다." },
          };
        const discord = discordNotify
          ? await publishDiscordNotice({
              title: updated.title,
              body: updated.body,
              mentionEveryone: discordMentionEveryone,
              customBody: discordBody,
            })
          : {
              sent: false as const,
              skipped: true as const,
              message: "Discord 전송을 건너뛰었습니다.",
            };
        return { notice: updated, discord };
      }),
    remove: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => deleteNotice(input.id)),
  }),
  admin: router({
    notices: adminProcedure.query(() => listNotices()),
    games: adminProcedure.query(() => listGames()),
    team: adminProcedure.query(() => listAllTeam()),
    createGame: adminProcedure
      .input(gameInput)
      .mutation(({ input }) => createGame(input)),
    updateGame: adminProcedure
      .input(gameInput.extend({ id: z.string() }))
      .mutation(({ input }) => {
        const { id, ...game } = input;
        return updateGame(id, game);
      }),
    deleteGame: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => deleteGame(input.id)),
    createTeam: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(120),
          role: z.string().min(1).max(120),
          bio: z.string().max(2000).default(""),
          imageUrl: z.string().max(2000).nullable().optional(),
          sortOrder: z.number().int().min(0).default(0),
          isPublic: z.boolean().default(true),
        })
      )
      .mutation(({ input }) => createTeam(input)),
    updateTeam: adminProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1).max(120),
          role: z.string().min(1).max(120),
          bio: z.string().max(2000).default(""),
          imageUrl: z.string().max(2000).nullable().optional(),
          sortOrder: z.number().int().min(0).default(0),
          isPublic: z.boolean().default(true),
        })
      )
      .mutation(({ input }) => {
        const { id, ...member } = input;
        return updateTeam(id, member);
      }),
    deleteTeam: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => deleteTeam(input.id)),
    saveSettings: adminProcedure
      .input(
        z.object({
          logoUrl: z.string().max(2000).optional(),
          instagramUrl: z.string().max(2000).optional(),
          youtubeUrl: z.string().max(2000).optional(),
          discordUrl: z.string().max(2000).optional(),
          steamUrl: z.string().max(2000).optional(),
          footerText: z.string().max(500).optional(),
        })
      )
      .mutation(({ input }) => saveSettings(input)),
    addAdmin: adminProcedure
      .input(
        z.object({
          username: z
            .string()
            .min(3)
            .max(60)
            .regex(/^[a-zA-Z0-9._-]+$/),
          password: z
            .string()
            .min(8, "비밀번호는 8자 이상이어야 합니다.")
            .max(200),
          name: z.string().min(1).max(120),
        })
      )
      .mutation(async ({ input }) => {
        await addAdmin(
          input.username,
          await hash(input.password, 12),
          input.name
        );
        return { success: true };
      }),
    changePassword: adminProcedure
      .input(
        z.object({
          password: z
            .string()
            .min(8, "비밀번호는 8자 이상이어야 합니다.")
            .max(200),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("관리자 인증이 필요합니다.");
        await changeAdminPassword(
          (ctx.user as any).openId.replace(/^admin:/, ""),
          await hash(input.password, 12)
        );
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
