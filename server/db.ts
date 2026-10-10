import {
  MongoClient,
  type Collection,
  type Db,
  type Document,
  ObjectId,
} from "mongodb";
import type {
  Game,
  Faq,
  InsertNotice,
  Notice,
  SiteSettings,
  TeamMember,
  User,
  InsertUser,
  SocialLink,
  PaymentOrder,
  SteamKeyInventory,
} from "../shared/types";
import { ENV } from "./_core/env";
import { signedPreviewUrl } from "./_core/previewAccess";
type AnyDoc = Document & Record<string, any>;
let client: MongoClient | null = null;
let database: Db | null = null;
let connecting: Promise<Db | null> | null = null;
export async function getDb(): Promise<Db | null> {
  if (database) return database;
  if (!ENV.mongoUri) return null;
  if (!connecting)
    connecting = (async () => {
      try {
        client = new MongoClient(ENV.mongoUri, {
          serverSelectionTimeoutMS: 3000,
        });
        await client.connect();
        database = client.db(ENV.mongoDb);
        await Promise.all([
          database
            .collection("users")
            .createIndex({ openId: 1 }, { unique: true }),
          database
            .collection("users")
            .createIndex({ username: 1 }, { unique: true, sparse: true }),
          database.collection("notices").createIndex({ publishedAt: -1 }),
          database.collection("faqs").createIndex({ sortOrder: 1, createdAt: -1 }),
          database.collection("games").createIndex({ createdAt: -1 }),
          database.collection("team").createIndex({ sortOrder: 1 }),
          database.collection("security_logs").createIndex({ createdAt: -1 }),
          database.collection("payment_orders").createIndex({ orderId: 1 }, { unique: true }),
          database.collection("payment_orders").createIndex({ createdAt: -1 }),
          database.collection("payment_orders").createIndex({ customerEmailHash: 1 }),
          database.collection("steam_keys").createIndex({ gameId: 1, status: 1 }),
          database.collection("steam_keys").createIndex({ orderId: 1 }, { sparse: true }),
        ]);
        return database;
      } catch (error) {
        console.warn(
          "[MongoDB] unavailable:",
          error instanceof Error ? error.message : error
        );
        await client?.close().catch(() => undefined);
        client = null;
        return null;
      } finally {
        connecting = null;
      }
    })();
  return connecting;
}
async function col<T extends AnyDoc>(
  name: string
): Promise<Collection<T> | null> {
  const db = await getDb();
  return db ? db.collection<T>(name) : null;
}
const date = (v: any) => (v instanceof Date ? v : new Date(v));
function id(v: any) {
  return String(v?._id ?? v?.id ?? "");
}
export function normalizeMongoUser(d: AnyDoc): User {
  return {
    id: id(d),
    openId: d.openId,
    name: d.name ?? null,
    email: d.email ?? null,
    loginMethod: d.loginMethod ?? null,
    role: d.role === "admin" ? "admin" : "user",
    createdAt: date(d.createdAt),
    updatedAt: date(d.updatedAt),
    lastSignedIn: date(d.lastSignedIn),
  };
}
const normalizeFaq = (d: AnyDoc): Faq => ({
  id: id(d),
  question: d.question ?? "",
  answer: d.answer ?? "",
  category: d.category ?? "GENERAL",
  sortOrder: Number(d.sortOrder ?? 0),
  isPublished: d.isPublished !== false,
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
const normalizeNotice = (d: AnyDoc): Notice => ({
  id: id(d),
  category: d.category,
  title: d.title,
  body: d.body,
  coverUrl: d.coverUrl ?? null,
  publishedAt: date(d.publishedAt),
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
export function createNoticeDocument(input: InsertNotice) {
  const now = new Date();
  return {
    category: input.category,
    title: input.title.trim(),
    body: input.body.trim(),
    coverUrl: input.coverUrl ?? null,
    publishedAt: input.publishedAt ?? now,
    createdAt: now,
    updatedAt: now,
  };
}
const normalizeGame = (d: AnyDoc, protectPreview = false): Game => ({
  id: id(d),
  code: d.code,
  title: d.title,
  description: d.description ?? "",
  genre: d.genre ?? "",
  status: d.status ?? "개발 중",
  imageUrl: d.imageUrl ?? "",
  videoUrl: d.videoUrl ?? null,
  externalUrl: d.externalUrl ?? null,
  externalLabel: d.externalLabel ?? "STEAM",
  isNew: Boolean(d.isNew),
  previewUrl: protectPreview
    ? signedPreviewUrl(d.previewUrl)
    : (d.previewUrl ?? null),
  priceKRW: d.priceKRW == null ? null : Number(d.priceKRW),
  isPurchasable: Boolean(d.isPurchasable && Number(d.priceKRW) > 0),
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
const normalizeTeam = (d: AnyDoc): TeamMember => ({
  id: id(d),
  name: d.name,
  role: d.role,
  bio: d.bio ?? "",
  imageUrl: d.imageUrl ?? null,
  sortOrder: d.sortOrder ?? 0,
  isPublic: d.isPublic !== false,
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
export async function getUserByOpenId(openId: string) {
  const c = await col("users");
  const d = await c?.findOne({ openId });
  return d ? normalizeMongoUser(d) : undefined;
}
export async function upsertUser(user: InsertUser) {
  const c = await col("users");
  if (!c) return;
  const now = new Date();
  await c.updateOne(
    { openId: user.openId },
    {
      $set: { ...user, updatedAt: now, lastSignedIn: user.lastSignedIn ?? now },
      $setOnInsert: { createdAt: now, role: user.role ?? "user" },
    },
    { upsert: true }
  );
}
export async function getAdminByUsername(username: string) {
  const c = await col("users");
  return (await c?.findOne({ username, role: "admin" })) ?? null;
}
export async function ensureAdminAccount(
  username: string,
  passwordHash: string
) {
  const c = await col("users");
  if (!c) return;
  const now = new Date();
  await c.updateOne(
    { username },
    {
      $setOnInsert: {
        username,
        passwordHash,
        role: "admin",
        name: "Ramic Studio Admin",
        openId: `admin:${username}`,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      },
    },
    { upsert: true }
  );
}
export async function listNotices() {
  const c = await col("notices");
  return c
    ? (await c.find({}).sort({ publishedAt: -1 }).limit(100).toArray()).map(
        normalizeNotice
      )
    : [];
}
export async function getNotice(idValue: string) {
  const c = await col("notices");
  const d = c
    ? await c.findOne({
        _id: ObjectId.isValid(idValue) ? new ObjectId(idValue) : idValue,
      } as any)
    : null;
  return d ? normalizeNotice(d) : null;
}
export async function createNotice(input: InsertNotice) {
  const c = await col("notices");
  if (!c) return null;
  const d = createNoticeDocument(input);
  const r = await c.insertOne(d);
  return normalizeNotice({ ...d, _id: r.insertedId });
}
function documentId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : value;
}
export async function updateNotice(idValue: string, input: InsertNotice) {
  const c = await col("notices");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    {
      $set: {
        category: input.category,
        title: input.title.trim(),
        body: input.body.trim(),
        coverUrl: input.coverUrl ?? null,
        publishedAt: input.publishedAt ?? new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  return result ? normalizeNotice(result) : null;
}
export async function deleteNotice(idValue: string) {
  const c = await col("notices");
  if (!c) return false;
  return (
    (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0
  );
}
export async function listFaqs(publicOnly = false) {
  const c = await col("faqs");
  if (!c) return [];
  const filter = publicOnly ? { isPublished: { $ne: false } } : {};
  return (await c.find(filter).sort({ sortOrder: 1, createdAt: -1 }).limit(200).toArray()).map(normalizeFaq);
}
export async function createFaq(input: Omit<Faq, "id" | "createdAt" | "updatedAt">) {
  const c = await col("faqs");
  if (!c) return null;
  const now = new Date();
  const d = { ...input, question: input.question.trim(), answer: input.answer.trim(), createdAt: now, updatedAt: now };
  const r = await c.insertOne(d);
  return normalizeFaq({ ...d, _id: r.insertedId });
}
export async function updateFaq(idValue: string, input: Omit<Faq, "id" | "createdAt" | "updatedAt">) {
  const c = await col("faqs");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    { $set: { ...input, question: input.question.trim(), answer: input.answer.trim(), updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? normalizeFaq(result) : null;
}
export async function deleteFaq(idValue: string) {
  const c = await col("faqs");
  if (!c) return false;
  return (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0;
}
export async function listGames(protectPreview = false) {
  const c = await col("games");
  return c
    ? (await c.find({}).sort({ createdAt: -1 }).toArray()).map(d =>
        normalizeGame(d, protectPreview)
      )
    : [];
}
function singleGameMedia(input: Omit<Game, "id" | "createdAt" | "updatedAt">) {
  return input.videoUrl
    ? { ...input, imageUrl: "", videoUrl: input.videoUrl }
    : { ...input, imageUrl: input.imageUrl ?? "", videoUrl: null };
}
export async function createGame(
  input: Omit<Game, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("games");
  if (!c) return null;
  const now = new Date();
  const d = { ...singleGameMedia(input), createdAt: now, updatedAt: now };
  const r = await c.insertOne(d);
  return normalizeGame({ ...d, _id: r.insertedId });
}
export async function updateGame(
  idValue: string,
  input: Omit<Game, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("games");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    { $set: { ...singleGameMedia(input), updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? normalizeGame(result) : null;
}
export async function deleteGame(idValue: string) {
  const c = await col("games");
  if (!c) return false;
  return (
    (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0
  );
}
export async function listTeam() {
  const c = await col("team");
  return c
    ? (
        await c
          .find({ isPublic: { $ne: false } })
          .sort({ sortOrder: 1 })
          .toArray()
      ).map(normalizeTeam)
    : [];
}
export async function createTeam(
  input: Omit<TeamMember, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("team");
  if (!c) return null;
  const now = new Date();
  const d = { ...input, createdAt: now, updatedAt: now };
  const r = await c.insertOne(d);
  return normalizeTeam({ ...d, _id: r.insertedId });
}
export async function listAllTeam() {
  const c = await col("team");
  return c
    ? (await c.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray()).map(
        normalizeTeam
      )
    : [];
}
export async function updateTeam(
  idValue: string,
  input: Omit<TeamMember, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("team");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? normalizeTeam(result) : null;
}
export async function deleteTeam(idValue: string) {
  const c = await col("team");
  if (!c) return false;
  return (
    (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0
  );
}
function legacySocialLinks(d: AnyDoc | null | undefined): SocialLink[] {
  return [
    { label: "인스타그램", url: d?.instagramUrl ?? "" },
    { label: "유튜브", url: d?.youtubeUrl ?? "" },
    { label: "디스코드", url: d?.discordUrl ?? "" },
    { label: "스팀", url: d?.steamUrl ?? "" },
  ].filter(link => link.url);
}
export async function getSettings(): Promise<SiteSettings> {
  const c = await col("settings");
  const d = await c?.findOne({ _id: "site" } as any);
  return {
    id: "site",
    logoUrl: d?.logoUrl ?? "/assets/RamicStudio.svg",
    instagramUrl: d?.instagramUrl ?? "",
    youtubeUrl: d?.youtubeUrl ?? "",
    discordUrl: d?.discordUrl ?? "",
    steamUrl: d?.steamUrl ?? "",
    socialLinks: Array.isArray(d?.socialLinks)
      ? d.socialLinks
          .map((link: any) => ({
            label: String(link.label ?? "").trim(),
            url: String(link.url ?? "").trim(),
          }))
          .filter((link: SocialLink) => link.label && link.url)
      : legacySocialLinks(d),
    footerText: d?.footerText ?? "© 2026 RAMIC STUDIO. 호기심으로 만듭니다.",
    updatedAt: date(d?.updatedAt ?? new Date()),
  };
}
export async function saveSettings(input: Partial<SiteSettings>) {
  const c = await col("settings");
  if (!c) return getSettings();
  const now = new Date();
  await c.updateOne(
    { _id: "site" } as any,
    { $set: { ...input, updatedAt: now } },
    { upsert: true }
  );
  return getSettings();
}
export async function addAdmin(
  username: string,
  passwordHash: string,
  name: string
) {
  const c = await col("users");
  if (!c) return;
  const now = new Date();
  await c.updateOne(
    { username },
    {
      $set: { username, passwordHash, name, role: "admin", updatedAt: now },
      $setOnInsert: {
        openId: `admin:${username}`,
        createdAt: now,
        lastSignedIn: now,
      },
    },
    { upsert: true }
  );
}
export async function changeAdminPassword(
  username: string,
  passwordHash: string
) {
  const c = await col("users");
  if (c)
    await c.updateOne(
      { username, role: "admin" },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
}
export type SecurityEvent = {
  event: string;
  username?: string;
  actor?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  detail?: string;
  createdAt: Date;
};
export async function writeSecurityLog(
  input: Omit<SecurityEvent, "createdAt">
) {
  const c = await col("security_logs");
  if (!c) return;
  await c.insertOne({ ...input, createdAt: new Date() });
}
export async function listSecurityLogs(limit = 100) {
  const c = await col("security_logs");
  if (!c) return [];
  return (
    await c
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 200))
      .toArray()
  ).map(d => ({
    id: id(d),
    event: String(d.event ?? "unknown"),
    username: d.username ?? "",
    actor: d.actor ?? "",
    ip: d.ip ?? "",
    userAgent: d.userAgent ?? "",
    path: d.path ?? "",
    detail: d.detail ?? "",
    createdAt: date(d.createdAt),
  }));
}

function normalizePaymentOrder(d: AnyDoc) {
  return {
    id: id(d),
    orderId: String(d.orderId),
    gameId: String(d.gameId),
    gameTitle: String(d.gameTitle ?? ""),
    amount: Number(d.amount ?? 0),
    status: d.status ?? "PENDING",
    customerName: String(d.customerName ?? ""),
    customerEmail: String(d.customerEmail ?? ""),
    customerPhone: String(d.customerPhone ?? ""),
    customerEmailHash: String(d.customerEmailHash ?? ""),
    paymentKey: d.paymentKey ?? null,
    paymentMethod: d.paymentMethod ?? null,
    steamKey: d.steamKey ?? null,
    failureCode: d.failureCode ?? null,
    createdAt: date(d.createdAt),
    paidAt: d.paidAt ? date(d.paidAt) : null,
    fulfilledAt: d.fulfilledAt ? date(d.fulfilledAt) : null,
  };
}

export async function getGameForPurchase(idValue: string) {
  const c = await col("games");
  if (!c) return null;
  const d = await c.findOne({ _id: documentId(idValue) } as any);
  if (!d) return null;
  const game = normalizeGame(d);
  return game;
}

export async function createPaymentOrder(input: {
  orderId: string;
  gameId: string;
  gameTitle: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerEmailHash: string;
}) {
  const c = await col("payment_orders");
  if (!c) return null;
  const now = new Date();
  const d = { ...input, status: "PENDING", createdAt: now, updatedAt: now };
  const result = await c.insertOne(d);
  return normalizePaymentOrder({ ...d, _id: result.insertedId });
}

export async function getPaymentOrderByOrderId(orderId: string) {
  const c = await col("payment_orders");
  const d = await c?.findOne({ orderId });
  return d ? normalizePaymentOrder(d) : null;
}

export async function getPaymentOrder(idValue: string) {
  const c = await col("payment_orders");
  const d = await c?.findOne({ _id: documentId(idValue) } as any);
  return d ? normalizePaymentOrder(d) : null;
}

export async function updatePaymentOrder(orderId: string, patch: Record<string, unknown>) {
  const c = await col("payment_orders");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { orderId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? normalizePaymentOrder(result) : null;
}

export async function allocateSteamKey(gameId: string, orderId: string) {
  const c = await col("steam_keys");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { gameId, status: "AVAILABLE" },
    { $set: { status: "SOLD", orderId, soldAt: new Date(), updatedAt: new Date() } },
    { sort: { createdAt: 1 }, returnDocument: "after" }
  );
  return result ? { ...result, encryptedKey: String(result.encryptedKey) } : null;
}

export async function createSteamKey(input: { gameId: string; encryptedKey: string }) {
  const c = await col("steam_keys");
  if (!c) return null;
  const now = new Date();
  const d = { gameId: input.gameId, encryptedKey: input.encryptedKey, status: "AVAILABLE", createdAt: now, updatedAt: now };
  const result = await c.insertOne(d);
  return { id: String(result.insertedId), gameId: d.gameId, status: d.status, createdAt: now };
}

export async function listSteamKeys() {
  const c = await col("steam_keys");
  if (!c) return [];
  const games = await col("games");
  const gameDocs = games ? await games.find({}).project({ title: 1 }).toArray() : [];
  const titles = new Map(gameDocs.map(g => [String(g._id), String(g.title ?? "")]));
  return (await c.find({}).sort({ createdAt: -1 }).limit(1000).toArray()).map(d => ({
    id: id(d), gameId: String(d.gameId), gameTitle: titles.get(String(d.gameId)) ?? "", status: d.status,
    encryptedKey: String(d.encryptedKey), orderId: d.orderId ?? null, createdAt: date(d.createdAt), soldAt: d.soldAt ? date(d.soldAt) : null,
  }));
}

export async function updateSteamKey(idValue: string, input: { gameId?: string; encryptedKey?: string; status?: "AVAILABLE" | "SOLD" | "REVOKED" }) {
  const c = await col("steam_keys");
  if (!c) return null;
  const patch = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
  const result = await c.findOneAndUpdate({ _id: documentId(idValue) } as any, { $set: { ...patch, updatedAt: new Date() } }, { returnDocument: "after" });
  return result ? { id: id(result), gameId: String(result.gameId), status: result.status, encryptedKey: String(result.encryptedKey) } : null;
}

export async function deleteSteamKey(idValue: string) {
  const c = await col("steam_keys");
  if (!c) return false;
  return (await c.deleteOne({ _id: documentId(idValue), status: "AVAILABLE" } as any)).deletedCount > 0;
}

export async function listPaymentOrders() {
  const c = await col("payment_orders");
  if (!c) return [];
  return (await c.find({}).sort({ createdAt: -1 }).limit(500).toArray()).map(normalizePaymentOrder);
}

export async function listPaymentStats() {
  const c = await col("payment_orders");
  if (!c) return { total: 0, paid: 0, fulfilled: 0, revenue: 0, pending: 0, daily: [] };
  const [summary, daily] = await Promise.all([
    c.aggregate([{ $group: { _id: null, total: { $sum: 1 }, paid: { $sum: { $cond: [{ $in: ["$status", ["PAID", "FULFILLED"]] }, 1, 0] } }, fulfilled: { $sum: { $cond: [{ $eq: ["$status", "FULFILLED"] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $in: ["$status", ["PAID", "FULFILLED"]] }, "$amount", 0] } }, pending: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } } } }]).toArray(),
    c.aggregate([{ $match: { status: { $in: ["PAID", "FULFILLED"] } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } }, { $sort: { _id: 1 } }, { $limit: 31 }]).toArray(),
  ]);
  return { ...(summary[0] ?? { total: 0, paid: 0, fulfilled: 0, revenue: 0, pending: 0 }), daily: daily.map(d => ({ date: d._id, orders: d.orders, revenue: d.revenue })) };
}
