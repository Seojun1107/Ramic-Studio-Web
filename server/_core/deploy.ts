import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
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
let remoteCache: { sha: string; expiresAt: number } = { sha: "", expiresAt: 0 };

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

async function remoteSha(force = false) {
  if (!force && remoteCache.sha && remoteCache.expiresAt > Date.now())
    return remoteCache.sha;
  try {
    const output = await command(
      "git",
      ["ls-remote", remoteUrl, `refs/heads/${branch}`],
      30_000
    );
    const sha = output.stdout.trim().split(/\s+/)[0];
    if (!sha) throw new Error("원격 저장소에서 커밋 SHA를 찾지 못했습니다.");
    remoteCache = { sha, expiresAt: Date.now() + 8_000 };
    return sha;
  } catch (gitError) {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/commits/${encodeURIComponent(branch)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json",
          "Cache-Control": "no-cache",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      }
    );
    if (!response.ok) {
      const detail =
        gitError instanceof Error ? gitError.message : "git 조회 실패";
      throw new Error(`GitHub 커밋 조회 실패 (${response.status}) · ${detail}`);
    }
    const data = (await response.json()) as { sha?: string };
    if (!data.sha) throw new Error("GitHub 응답에 커밋 SHA가 없습니다.");
    remoteCache = { sha: data.sha, expiresAt: Date.now() + 8_000 };
    return data.sha;
  }
}

export async function getDeployStatus() {
  const currentSha = await localSha();
  let remote = status.remoteSha;
  try {
    remote = await remoteSha();
  } catch (error) {
    if (!remote)
      status.message =
        error instanceof Error ? error.message : "GitHub 확인 실패";
  }
  status = { ...status, currentSha, remoteSha: remote };
  return {
    ...status,
    hasUpdate: Boolean(remote && currentSha && remote !== currentSha),
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
    const remote = await remoteSha(true);
    status = {
      ...status,
      remoteSha: remote,
      message: "GitHub 최신 커밋을 확인했습니다. 파일을 동기화합니다.",
    };
    await command("git", ["fetch", "--no-tags", remoteUrl, branch]);
    const fetched = (
      await command("git", ["rev-parse", "FETCH_HEAD"], 15_000)
    ).stdout.trim();
    if (fetched !== remote)
      throw new Error(
        "GitHub 커밋이 동기화 중 변경되었습니다. 다시 시도해 주세요."
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
