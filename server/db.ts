import { MongoClient, type Collection, type Db, type Document, ObjectId } from "mongodb";
import type { InsertNotice, InsertUser, Notice, User } from "../shared/types";
import { ENV } from "./_core/env";

type MongoUserDocument = Omit<User, "id"> & { _id?: ObjectId | string; passwordHash?: string };
type MongoNoticeDocument = Omit<Notice, "id"> & { _id?: ObjectId | string };

let client: MongoClient | null = null;
let database: Db | null = null;
let connecting: Promise<Db | null> | null = null;

export async function getDb(): Promise<Db | null> {
  if (database) return database;
  if (!ENV.mongoUri) return null;
  if (!connecting) {
    connecting = (async () => {
      try {
        client = new MongoClient(ENV.mongoUri, { serverSelectionTimeoutMS: 3000 });
        await client.connect();
        database = client.db(ENV.mongoDb);
        await database.collection<MongoUserDocument>("users").createIndex({ openId: 1 }, { unique: true });
        await database.collection<MongoUserDocument>("users").createIndex({ username: 1 }, { unique: true, sparse: true });
        await database.collection<MongoNoticeDocument>("notices").createIndex({ publishedAt: -1 });
        return database;
      } catch (error) {
        console.warn("[MongoDB] Connection unavailable; persistence is disabled until MONGODB_URI is configured.", error instanceof Error ? error.message : error);
        await client?.close().catch(() => undefined);
        client = null;
        return null;
      } finally {
        connecting = null;
      }
    })();
  }
  return connecting;
}

export function normalizeMongoUser(document: MongoUserDocument): User {
  return {
    id: String(document._id ?? document.openId),
    openId: document.openId,
    name: document.name ?? null,
    email: document.email ?? null,
    loginMethod: document.loginMethod ?? null,
    role: document.role === "admin" ? "admin" : "user",
    createdAt: new Date(document.createdAt),
    updatedAt: new Date(document.updatedAt),
    lastSignedIn: new Date(document.lastSignedIn),
  };
}

function normalizeNotice(document: MongoNoticeDocument): Notice {
  return {
    id: String(document._id ?? ""),
    category: document.category,
    title: document.title,
    body: document.body,
    publishedAt: new Date(document.publishedAt),
    createdAt: new Date(document.createdAt),
    updatedAt: new Date(document.updatedAt),
  };
}

export function createNoticeDocument(input: InsertNotice): MongoNoticeDocument {
  const now = new Date();
  return {
    category: input.category,
    title: input.title.trim(),
    body: input.body.trim(),
    publishedAt: input.publishedAt ?? now,
    createdAt: now,
    updatedAt: now,
  };
}

async function collection<T extends Document>(name: string): Promise<Collection<T> | null> {
  const db = await getDb();
  return db ? db.collection<T>(name) : null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const users = await collection<MongoUserDocument>("users");
  if (!users) return;
  const now = new Date();
  const set: Partial<MongoUserDocument> = { updatedAt: now, lastSignedIn: user.lastSignedIn ?? now };
  for (const field of ["name", "email", "loginMethod", "role"] as const) {
    if (user[field] !== undefined) set[field] = user[field] as never;
  }
  await users.updateOne(
    { openId: user.openId },
    { $set: set, $setOnInsert: { openId: user.openId, createdAt: now, role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user") } },
    { upsert: true },
  );
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const users = await collection<MongoUserDocument>("users");
  const document = await users?.findOne({ openId });
  return document ? normalizeMongoUser(document) : undefined;
}

export async function getAdminByUsername(username: string): Promise<MongoUserDocument | null> {
  const users = await collection<MongoUserDocument>("users");
  return (await users?.findOne({ username, role: "admin" })) ?? null;
}

export async function ensureAdminAccount(username: string, passwordHash: string): Promise<void> {
  const users = await collection<MongoUserDocument>("users");
  if (!users) return;
  const now = new Date();
  await users.updateOne(
    { username },
    { $setOnInsert: { username, passwordHash, role: "admin", name: "Ramic Studio Admin", openId: `admin:${username}`, createdAt: now, updatedAt: now, lastSignedIn: now } },
    { upsert: true },
  );
}

export async function listNotices(): Promise<Notice[]> {
  const notices = await collection<MongoNoticeDocument>("notices");
  if (!notices) return [];
  const documents = await notices.find({}).sort({ publishedAt: -1 }).limit(100).toArray();
  return documents.map(normalizeNotice);
}

export async function createNotice(input: InsertNotice): Promise<Notice | null> {
  const notices = await collection<MongoNoticeDocument>("notices");
  if (!notices) return null;
  const document = createNoticeDocument(input);
  const result = await notices.insertOne(document);
  return normalizeNotice({ ...document, _id: result.insertedId });
}

export async function countNotices(): Promise<number> {
  const notices = await collection<MongoNoticeDocument>("notices");
  return notices ? notices.countDocuments() : 0;
}
