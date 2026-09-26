import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { getAdminFromRequest } from "./adminAuth";
import { getDeployStatus, startDeployment } from "./deploy";
const execFileAsync = promisify(execFile);
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { bootstrapAdmin, registerAdminAuthRoutes } from "./adminAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Base64 adds overhead, so allow up to ~700 MB in the request while enforcing 500 MB after decoding.
  app.use(express.json({ limit: "700mb" }));
  app.use(express.urlencoded({ limit: "700mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerAdminAuthRoutes(app);
  app.get("/api/admin/deploy/status", async (req, res) => {
    if (!(await getAdminFromRequest(req))) { res.status(401).json({ message: "관리자 로그인이 필요합니다." }); return; }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.json(await getDeployStatus());
  });
  app.post("/api/admin/deploy/update", async (req, res) => {
    if (!(await getAdminFromRequest(req))) { res.status(401).json({ message: "관리자 로그인이 필요합니다." }); return; }
    res.status(202).json(await startDeployment());
  });
  app.post("/api/admin/upload-media", async (req, res) => {
    const admin = await getAdminFromRequest(req);
    if (!admin) { res.status(401).json({ message: "관리자 로그인이 필요합니다." }); return; }
    const dataUrl = typeof req.body?.dataUrl === "string" ? req.body.dataUrl : "";
    const mimeType = typeof req.body?.mimeType === "string" ? req.body.mimeType : "";
    const allowed = /^(image\/(jpeg|png|gif|webp|svg\+xml)|video\/(mp4|webm|quicktime))$/i.test(mimeType);
    if (!allowed || !dataUrl.startsWith(`data:${mimeType};base64,`) || dataUrl.length > 70_000_000) { res.status(400).json({ message: "지원하지 않는 미디어 형식이거나 파일이 너무 큽니다. (최대 50MB)" }); return; }
    const extension = mimeType.split("/")[1].replace("svg+xml", "svg").replace("quicktime", "mov");
    const targetDir = path.resolve(process.cwd(), "client/public/uploads/media"); const fileName = `${randomUUID()}.${extension}`; const target = path.join(targetDir, fileName);
    try { await fs.mkdir(targetDir, { recursive: true }); await fs.writeFile(target, Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64")); res.json({ url: `/uploads/media/${fileName}` }); }
    catch { res.status(500).json({ message: "미디어를 저장할 수 없습니다." }); }
  });
  app.post("/api/admin/upload-preview", async (req, res) => {
    const admin = await getAdminFromRequest(req);
    if (!admin) { res.status(401).json({ message: "관리자 로그인이 필요합니다." }); return; }
    const zipBase64 = typeof req.body?.zipBase64 === "string" ? req.body.zipBase64 : "";
    if (!zipBase64 || zipBase64.length > 700_000_000) { res.status(400).json({ message: "ZIP 파일은 500MB 이하만 업로드할 수 있습니다." }); return; }
    const temp = path.join(os.tmpdir(), `ramic-${randomUUID()}.zip`); const slug = randomUUID(); const target = path.resolve(process.cwd(), "client/public/uploads/previews", slug);
    try {
      const raw = zipBase64.replace(/^data:application\/zip;base64,/, ""); const archive = Buffer.from(raw, "base64");
      if (archive.byteLength > 500 * 1024 * 1024) throw new Error("archive too large");
      await fs.mkdir(target, { recursive: true }); await fs.writeFile(temp, archive);
      const listing = (await execFileAsync("unzip", ["-Z1", temp])).stdout.split(/\r?\n/).filter(Boolean);
      if (listing.some(name => path.isAbsolute(name) || name.split(/[\\/]/).includes(".."))) throw new Error("unsafe archive");
      await execFileAsync("unzip", ["-q", temp, "-d", target]);
      res.json({ previewUrl: `/uploads/previews/${slug}/index.html` });
    } catch { await fs.rm(target, { recursive: true, force: true }); res.status(400).json({ message: "안전한 웹게임 ZIP만 업로드할 수 있습니다." }); } finally { await fs.rm(temp, { force: true }); }
  });
  await bootstrapAdmin();
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
