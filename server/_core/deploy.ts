import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import { ENV } from "./env";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(process.env.DEPLOY_ROOT ?? process.cwd());
const repo = process.env.GITHUB_REPO ?? "Seojun1107/Ramic-Studio-Web";
const branch = process.env.GITHUB_BRANCH ?? "main";
const remoteUrl = `https://github.com/${repo}.git`;
const pm2Name = process.env.DEPLOY_PM2_NAME ?? "ramic-studio";
const port = Number(process.env.PORT ?? "3000");

type DeployStatus = {
  state: "idle" | "checking" | "updating" | "success" | "failed";
  currentSha: string;
  remoteSha: string;
  message: string;
  source?: "webhook" | "manual";
  startedAt?: string;
  finishedAt?: string;
};

let status: DeployStatus = {
  state: "idle",
  currentSha: "",
  remoteSha: "",
  message: "배포 대기 중",
};
let running = false;

async function command(file: string, args: string[], timeout = 120_000) {
  return execFileAsync(file, args, {
    cwd: repoRoot,
    timeout,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, CI: "1", PORT: String(port) },
  });
}

async function packageManager(args: string[], timeout = 300_000) {
  try {
    return await command("pnpm", args, timeout);
  } catch (firstError) {
    try {
      return await command("corepack", ["pnpm", ...args], timeout);
    } catch {
      throw firstError;
    }
  }
}

async function localSha() {
  try {
    return (await command("git", ["rev-parse", "HEAD"], 15_000)).stdout.trim();
  } catch {
    return "";
  }
}

export function verifyGitHubSignature(
  rawBody: Buffer,
  signature: string | undefined
) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(
    `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`
  );
  const received = Buffer.from(signature);
  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

export function receiveGitHubPush(payload: unknown) {
  const event = payload as {
    ref?: string;
    after?: string;
    repository?: { full_name?: string };
    deleted?: boolean;
  };
  if (event.repository?.full_name && event.repository.full_name !== repo)
    return { accepted: false, message: "다른 저장소의 웹훅입니다." };
  if (
    event.ref !== `refs/heads/${branch}` ||
    event.deleted ||
    !event.after ||
    /^0+$/.test(event.after)
  )
    return { accepted: false, message: "main 브랜치 push 이벤트가 아닙니다." };
  status = {
    ...status,
    state: "idle",
    remoteSha: event.after,
    source: "webhook",
    message: "새로운 GitHub 커밋을 받았습니다. 업데이트할 수 있습니다.",
  };
  return { accepted: true, sha: event.after };
}

export async function getDeployStatus() {
  const currentSha = await localSha();
  status = { ...status, currentSha };
  return {
    ...status,
    hasUpdate: Boolean(
      status.remoteSha && currentSha && status.remoteSha !== currentSha
    ),
    webhookConfigured: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
    repo,
    branch,
    pm2Name,
    port,
  };
}

export async function startDeployment() {
  if (running)
    return {
      ...status,
      accepted: false,
      message: "이미 업데이트가 진행 중입니다.",
    };
  running = true;
  status = {
    state: "updating",
    currentSha: await localSha(),
    remoteSha: "",
    message: "서버 업데이트를 시작했습니다.",
    startedAt: new Date().toISOString(),
  };
  void runDeployment();
  return { ...status, accepted: true };
}

async function runDeployment() {
  const backupRef = await localSha();
  try {
    const remote = status.remoteSha;
    if (!remote) throw new Error("GitHub 웹훅으로 받은 커밋이 없습니다.");
    status = {
      ...status,
      message: "웹훅으로 받은 커밋을 동기화합니다.",
    };
    await command("git", ["fetch", "--no-tags", remoteUrl, branch]);
    const fetched = (
      await command("git", ["rev-parse", "FETCH_HEAD"], 15_000)
    ).stdout.trim();
    if (fetched !== remote)
      throw new Error(
        "웹훅 커밋과 GitHub 최신 커밋이 다릅니다. 다시 시도해 주세요."
      );
    await command("git", ["reset", "--hard", "FETCH_HEAD"]);
    status = { ...status, message: "소스 동기화 완료. 의존성을 설치합니다." };
    if (await fileExists("pnpm-lock.yaml"))
      await packageManager(["install", "--frozen-lockfile", "--force"]);
    else if (await fileExists("package-lock.json"))
      await command("npm", ["ci"], 300_000);
    else await command("npm", ["install"], 300_000);
    status = {
      ...status,
      message: "의존성 설치 완료. 프론트엔드와 백엔드를 빌드합니다.",
    };
    await packageManager(["build"]).catch(async () =>
      command("npm", ["run", "build"], 300_000)
    );
    status = { ...status, message: "빌드 완료. 서비스를 재시작합니다." };
    await command("pm2", ["restart", pm2Name, "--update-env"], 60_000);
    status = {
      state: "success",
      currentSha: fetched,
      remoteSha: fetched,
      message: "업데이트와 서비스 재시작이 완료되었습니다.",
      startedAt: status.startedAt,
      finishedAt: new Date().toISOString(),
    };
  } catch (error) {
    try {
      if (backupRef)
        await command("git", ["reset", "--hard", backupRef], 30_000);
    } catch {
      /* preserve original error */
    }
    status = {
      ...status,
      state: "failed",
      message:
        error instanceof Error ? error.message : "업데이트에 실패했습니다.",
      finishedAt: new Date().toISOString(),
    };
  } finally {
    running = false;
  }
}

async function fileExists(name: string) {
  try {
    await fs.access(path.join(repoRoot, name));
    return true;
  } catch {
    return false;
  }
}
