import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function publicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("news.list", () => {
  it("returns a newsroom feed when the database is unavailable", async () => {
    const caller = appRouter.createCaller(publicContext());
    const result = await caller.news.list();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatchObject({ category: expect.any(String), title: expect.any(String), body: expect.any(String) });
  });
});
