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
import {
  getDeployStatus,
  receiveGitHubPush,
  startDeployment,
  verifyGitHubSignature,
} from "./deploy";
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
  const activePublicRoot =
    process.env.NODE_ENV === "production"
      ? path.resolve(process.cwd(), "dist/public")
      : path.resolve(process.cwd(), "client/public");
  const legacyPublicRoot = path.resolve(process.cwd(), "client/public");
  const uploadRoot = path.join(activePublicRoot, "uploads");
  // Keep previously uploaded files readable while new deployments write to the directory served by Express.
  app.use("/uploads", express.static(uploadRoot, { fallthrough: true }));
  if (legacyPublicRoot !== activePublicRoot)
    app.use(
      "/uploads",
      express.static(path.join(legacyPublicRoot, "uploads"), {
        fallthrough: true,
      })
    );
  app.post(
    "/api/github/webhook",
    express.raw({ type: "*/*", limit: "2mb" }),
    (req, res) => {
      if (req.header("x-github-event") !== "push") {
        res
          .status(202)
          .json({ accepted: false, message: "push 이벤트만 처리합니다." });
        return;
      }
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
      if (!verifyGitHubSignature(rawBody, req.header("x-hub-signature-256"))) {
        res
          .status(401)
          .json({ accepted: false, message: "웹훅 서명이 올바르지 않습니다." });
        return;
      }
      try {
        const result = receiveGitHubPush(JSON.parse(rawBody.toString("utf8")));
        res.status(result.accepted ? 202 : 200).json(result);
      } catch {
        res
          .status(400)
          .json({
            accepted: false,
            message: "웹훅 payload를 읽을 수 없습니다.",
          });
      }
    }
  );
  // Preview ZIPs use a binary upload route below; JSON only needs to cover ordinary CMS media.
  app.use(express.json({ limit: "80mb" }));
  app.use(express.urlencoded({ limit: "80mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerAdminAuthRoutes(app);
  app.get("/api/admin/deploy/status", async (req, res) => {
    if (!(await getAdminFromRequest(req))) {
      res.status(401).json({ message: "관리자 로그인이 필요합니다." });
      return;
    }
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.json(await getDeployStatus());
  });
  app.post("/api/admin/deploy/update", async (req, res) => {
    if (!(await getAdminFromRequest(req))) {
      res.status(401).json({ message: "관리자 로그인이 필요합니다." });
      return;
    }
    res.status(202).json(await startDeployment());
  });
  app.post("/api/admin/upload-media", async (req, res) => {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      res.status(401).json({ message: "관리자 로그인이 필요합니다." });
      return;
    }
    const dataUrl =
      typeof req.body?.dataUrl === "string" ? req.body.dataUrl : "";
    const mimeType =
      typeof req.body?.mimeType === "string" ? req.body.mimeType : "";
    const allowed =
      /^(image\/(jpeg|png|gif|webp|svg\+xml)|video\/(mp4|webm|quicktime))$/i.test(
        mimeType
      );
    if (
      !allowed ||
      !dataUrl.startsWith(`data:${mimeType};base64,`) ||
      dataUrl.length > 70_000_000
    ) {
      res
        .status(400)
        .json({
          message:
            "지원하지 않는 미디어 형식이거나 파일이 너무 큽니다. (최대 50MB)",
        });
      return;
    }
    const extension = mimeType
      .split("/")[1]
      .replace("svg+xml", "svg")
      .replace("quicktime", "mov");
    const targetDir = path.join(uploadRoot, "media");
    const fileName = `${randomUUID()}.${extension}`;
    const target = path.join(targetDir, fileName);
    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(
        target,
        Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64")
      );
      res.json({ url: `/uploads/media/${fileName}` });
    } catch {
      res.status(500).json({ message: "미디어를 저장할 수 없습니다." });
    }
  });
  app.post(
    "/api/admin/upload-preview",
    express.raw({
      type: ["application/zip", "application/octet-stream"],
      limit: "500mb",
    }),
    async (req, res) => {
      const admin = await getAdminFromRequest(req);
      if (!admin) {
        res.status(401).json({ message: "관리자 로그인이 필요합니다." });
        return;
      }
      const body = req.body as Buffer | { zipBase64?: string } | undefined;
      const archive = Buffer.isBuffer(body)
        ? body
        : typeof body?.zipBase64 === "string"
          ? Buffer.from(
              body.zipBase64.replace(/^data:application\/zip;base64,/, ""),
              "base64"
            )
          : null;
      if (!archive?.byteLength || archive.byteLength > 500 * 1024 * 1024) {
        res
          .status(400)
          .json({ message: "ZIP 파일은 500MB 이하만 업로드할 수 있습니다." });
        return;
      }
      const temp = path.join(os.tmpdir(), `ramic-${randomUUID()}.zip`);
      const slug = randomUUID();
      const target = path.join(uploadRoot, "previews", slug);
      try {
        await fs.mkdir(target, { recursive: true });
        await fs.writeFile(temp, archive);
        const listing = (
          await execFileAsync("unzip", ["-Z1", temp], {
            maxBuffer: 12 * 1024 * 1024,
            timeout: 120_000,
          })
        ).stdout
          .split(/\r?\n/)
          .map(name => name.trim())
          .filter(Boolean);
        if (listing.length > 100_000)
          throw new Error("archive has too many files");
        if (
          listing.some(
            name => path.isAbsolute(name) || name.split(/[\\/]/).includes("..")
          )
        )
          throw new Error("unsafe archive");
        let indexPath = listing.find(
          name =>
            name.toLowerCase() === "index.html" ||
            name.toLowerCase().endsWith("/index.html") ||
            name.toLowerCase().endsWith("\\index.html")
        );
        if (!indexPath) {
          const loaderPath = listing.find(name =>
            /(^|[\\/])[^\\/]+\.loader\.js$/i.test(name)
          );
          if (!loaderPath) throw new Error("index.html missing");
          const normalizedLoader = loaderPath.replaceAll("\\", "/");
          const loaderFile = normalizedLoader.split("/").pop()!;
          const base = loaderFile.replace(/\.loader\.js$/i, "");
          const dir = normalizedLoader.includes("/")
            ? normalizedLoader.slice(0, normalizedLoader.lastIndexOf("/"))
            : ".";
          const files = new Set(
            listing.map(name => name.replaceAll("\\", "/").toLowerCase())
          );
          const file = (name: string) =>
            `${dir === "." ? "" : `${dir}/`}${name}`.toLowerCase();
          if (
            !files.has(file(`${base}.data`)) ||
            !files.has(file(`${base}.framework.js`)) ||
            !files.has(file(`${base}.wasm`))
          )
            throw new Error("index.html missing");
          const generated = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ramic Studio Web Preview</title><style>html,body{margin:0;width:100%;height:100%;background:#08090d;overflow:hidden}#unity-container,#unity-canvas{width:100%;height:100%;display:block}#loading{position:fixed;inset:auto 24px 24px;color:#cbff4d;font:12px monospace;z-index:2}</style></head><body><div id="unity-container"><canvas id="unity-canvas" tabindex="-1"></canvas></div><div id="loading">LOADING WEB PREVIEW</div><script src="${loaderFile}"></script><script>createUnityInstance(document.querySelector("#unity-canvas"),{dataUrl:"${base}.data",frameworkUrl:"${base}.framework.js",codeUrl:"${base}.wasm",streamingAssetsUrl:"StreamingAssets",companyName:"Ramic Studio",productName:"Web Preview",productVersion:"1.0"},p=>{document.querySelector("#loading").textContent="LOADING WEB PREVIEW "+Math.round(p*100)+"%"}).then(()=>document.querySelector("#loading").remove()).catch(e=>{document.querySelector("#loading").textContent="WEB PREVIEW FAILED";console.error(e)});</script></body></html>`;
          await fs.mkdir(path.join(target, dir), { recursive: true });
          await fs.writeFile(
            path.join(target, dir, "index.html"),
            generated,
            "utf8"
          );
          indexPath = `${dir === "." ? "" : `${dir}/`}index.html`;
        }
        await execFileAsync("unzip", ["-q", temp, "-d", target], {
          timeout: 600_000,
          maxBuffer: 2 * 1024 * 1024,
        });
        const normalizedIndex = indexPath
          .replaceAll("\\", "/")
          .replace(/^\/+/, "");
        res.json({
          previewUrl: `/uploads/previews/${slug}/${normalizedIndex}`,
        });
      } catch (error) {
        await fs.rm(target, { recursive: true, force: true });
        const message =
          error instanceof Error && error.message === "index.html missing"
            ? "index.html 또는 Unity WebGL 빌드의 loader/data/framework/wasm 파일을 찾지 못했습니다."
            : "안전한 웹게임 ZIP만 업로드할 수 있습니다.";
        res.status(400).json({ message });
      } finally {
        await fs.rm(temp, { force: true });
      }
    }
  );
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
