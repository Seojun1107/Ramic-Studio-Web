import { describe, expect, it } from "vitest";
import { createNoticeDocument, normalizeMongoUser } from "./db";

describe("MongoDB persistence helpers", () => {
  it("creates UTC notice documents without SQL-specific fields", () => {
    const document = createNoticeDocument({
      category: "STUDIO",
      title: "Mongo notice",
      body: "Stored as a document",
      publishedAt: new Date("2026-01-02T03:04:05.000Z"),
    });

    expect(document).toMatchObject({
      category: "STUDIO",
      title: "Mongo notice",
      body: "Stored as a document",
      publishedAt: new Date("2026-01-02T03:04:05.000Z"),
    });
    expect(document).not.toHaveProperty("openId");
    expect(document).not.toHaveProperty("autoincrement");
  });

  it("normalizes Mongo documents to the app user contract", () => {
    const user = normalizeMongoUser({
      _id: "mongo-id",
      openId: "open-123",
      name: "Admin",
      email: null,
      loginMethod: "admin",
      role: "admin",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(user).toMatchObject({ id: "mongo-id", openId: "open-123", role: "admin" });
    expect(user).not.toHaveProperty("passwordHash");
  });
});
