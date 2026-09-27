import {
  ArrowLeft,
  Check,
  FileArchive,
  FileImage,
  FileVideo,
  Gamepad2,
  KeyRound,
  LayoutDashboard,
  Link2,
  LogOut,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type Tab = "overview" | "news" | "games" | "team" | "settings" | "security";
const emptyGame = {
  code: "R-04",
  title: "",
  description: "",
  genre: "",
  status: "개발 중",
  imageUrl: "",
  videoUrl: "",
  externalUrl: "",
  externalLabel: "STEAM",
  isNew: false,
  previewUrl: "",
};
const emptyNotice = {
  category: "STUDIO",
  title: "",
  body: "",
  discordNotify: false,
  newsletterNotify: true,
  discordMentionEveryone: false,
  discordMode: "same" as "same" | "custom",
  discordBody: "",
};
const emptyMember = {
  name: "",
  role: "",
  bio: "",
  imageUrl: "",
  sortOrder: 0,
  isPublic: true,
};

async function uploadMedia(file: File) {
  if (file.size > 50 * 1024 * 1024)
    throw new Error("이미지·동영상은 50MB 이하만 업로드할 수 있습니다.");
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/"))
    throw new Error("이미지 또는 동영상 파일만 업로드할 수 있습니다.");
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("파일을 읽을 수 없습니다."));
    r.readAsDataURL(file);
  });
  const res = await fetch("/api/admin/upload-media", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      dataUrl: data,
      fileName: file.name,
      mimeType: file.type,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "업로드에 실패했습니다.");
  return json.url as string;
}
async function uploadPreview(file: File, onProgress: (value: number) => void) {
  if (!file.name.toLowerCase().endsWith(".zip"))
    throw new Error("웹 체험판은 ZIP 파일만 업로드할 수 있습니다.");
  if (file.size > 500 * 1024 * 1024)
    throw new Error("웹 체험판 ZIP은 500MB 이하만 업로드할 수 있습니다.");
  return await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload-preview");
    xhr.withCredentials = true;
    xhr.setRequestHeader("content-type", "application/zip");
    xhr.upload.onprogress = event => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () =>
      reject(new Error("업로드 연결이 끊겼습니다. 다시 시도해 주세요."));
    xhr.ontimeout = () =>
      reject(
        new Error("업로드 시간이 초과되었습니다. ZIP 용량을 확인해 주세요.")
      );
    xhr.timeout = 15 * 60 * 1000;
    xhr.onload = () => {
      let json: any = {};
      try {
        json = JSON.parse(xhr.responseText || "{}");
      } catch {
        /* handled below */
      }
      if (xhr.status < 200 || xhr.status >= 300)
        reject(new Error(json.message || "체험판 업로드에 실패했습니다."));
      else resolve(json.previewUrl as string);
    };
    xhr.send(file);
  });
}
function UploadField({
  label,
  accept,
  value,
  onChange,
  help,
}: {
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  help: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function choose(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadMedia(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="upload-field">
      <div className="upload-heading">
        <span>{label}</span>
        <small>{help}</small>
      </div>
      <div className="upload-row">
        <label className="upload-button">
          <Upload size={15} /> {busy ? "업로드 중..." : "파일 선택"}
          <input
            type="file"
            accept={accept}
            disabled={busy}
            onChange={e => choose(e.target.files?.[0])}
          />
        </label>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="파일을 선택하면 자동으로 입력됩니다"
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      {value && (
        <div className="media-preview">
          {value.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
            <video src={value} controls />
          ) : (
            <img src={value} alt="업로드 미리보기" />
          )}
        </div>
      )}
    </div>
  );
}
function RepresentativeMediaField({
  value,
  isVideo,
  onChange,
}: {
  value: string;
  isVideo: boolean;
  onChange: (url: string, video: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function choose(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadMedia(file), file.type.startsWith("video/"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="upload-field representative-media">
      <div className="upload-heading">
        <span>
          대표 미디어 <b className="required-note">하나만 선택</b>
        </span>
        <small>
          대표 이미지 또는 대표 동영상 중 하나만 등록합니다 · 최대 50MB
        </small>
      </div>
      <div className="upload-row">
        <label className="upload-button">
          <Upload size={15} /> {busy ? "업로드 중..." : "이미지 / 동영상 선택"}
          <input
            type="file"
            accept="image/*,video/*"
            disabled={busy}
            onChange={e => choose(e.target.files?.[0])}
          />
        </label>
        <input
          value={value}
          onChange={e => onChange(e.target.value, isVideo)}
          placeholder="파일을 선택하면 자동으로 입력됩니다"
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      {value && (
        <div className="media-preview">
          {isVideo ? (
            <video src={value} controls />
          ) : (
            <img src={value} alt="대표 미디어 미리보기" />
          )}
        </div>
      )}
    </div>
  );
}
function PreviewZipField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  async function choose(file?: File) {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setError("");
    try {
      const url = await uploadPreview(file, setProgress);
      setProgress(100);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="upload-field">
      <div className="upload-heading">
        <span>웹 체험판 ZIP</span>
        <small>
          선택 사항 · index.html 또는 Unity WebGL 빌드 파일 · 최대 500MB
        </small>
      </div>
      <p className="field-help">
        Unity WebGL의 .loader.js, .data, .framework.js, .wasm 파일만 있어도 자동
        실행 페이지를 만들어 줍니다.
      </p>
      <label className="upload-button">
        <FileArchive size={15} />{" "}
        {busy
          ? progress >= 100
            ? "서버에서 압축 해제 중..."
            : `업로드 중 ${progress}%`
          : "ZIP 선택"}
        <input
          type="file"
          accept=".zip,application/zip"
          disabled={busy}
          onChange={e => choose(e.target.files?.[0])}
        />
      </label>
      {busy && (
        <div
          className="zip-progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
      {value && (
        <div className="success-note">
          <Check size={14} /> 업로드 완료 · 체험하기에 자동 연결
          <br />
          <code>{value}</code>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
function MediaInsert({ onInsert }: { onInsert: (markdown: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function choose(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadMedia(file);
      onInsert(
        file.type.startsWith("video/")
          ? `![video](${url})`
          : `![${file.name}](${url})`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="inline-media-tools">
      <span>본문에 직접 삽입</span>
      <label className="upload-button">
        <FileImage size={14} /> 이미지
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={e => choose(e.target.files?.[0])}
        />
      </label>
      <label className="upload-button">
        <FileVideo size={14} /> 동영상
        <input
          type="file"
          accept="video/*"
          disabled={busy}
          onChange={e => choose(e.target.files?.[0])}
        />
      </label>
      {busy && <small>업로드 중...</small>}
      {error && <small className="form-error">{error}</small>}
    </div>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [notice, setNotice] = useState(emptyNotice);
  const [noticeFeedback, setNoticeFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [editingNotice, setEditingNotice] = useState<string | null>(null);
  const [game, setGame] = useState(emptyGame);
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [member, setMember] = useState(emptyMember);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [socials, setSocials] = useState({
    logoUrl: "/assets/RamicStudio.svg",
    instagramUrl: "",
    youtubeUrl: "",
    discordUrl: "",
    steamUrl: "",
    socialLinks: [] as Array<{ label: string; url: string }>,
    footerText: "",
  });
  const [adminForm, setAdminForm] = useState({
    username: "",
    password: "",
    name: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [deploy, setDeploy] = useState<any>(null);
  const [deployBusy, setDeployBusy] = useState(false);
  const [deployWatch, setDeployWatch] = useState(false);
  const [deployBaseSha, setDeployBaseSha] = useState("");
  const utils = trpc.useUtils();
  const settings = trpc.site.settings.useQuery();
  const notices = trpc.admin.notices.useQuery(undefined, {
    enabled: authorized,
  });
  const games = trpc.admin.games.useQuery(undefined, { enabled: authorized });
  const team = trpc.admin.team.useQuery(undefined, { enabled: authorized });
  const securityLogs = trpc.admin.securityLogs.useQuery(undefined, {
    enabled: authorized && tab === "security",
  });
  useEffect(() => {
    if (settings.data)
      setSocials({
        logoUrl: settings.data.logoUrl,
        instagramUrl: settings.data.instagramUrl ?? "",
        youtubeUrl: settings.data.youtubeUrl ?? "",
        discordUrl: settings.data.discordUrl ?? "",
        steamUrl: settings.data.steamUrl ?? "",
        socialLinks:
          settings.data.socialLinks ??
          [
            ["인스타그램", settings.data.instagramUrl ?? ""],
            ["유튜브", settings.data.youtubeUrl ?? ""],
            ["디스코드", settings.data.discordUrl ?? ""],
            ["스팀", settings.data.steamUrl ?? ""],
          ]
            .filter(([, url]) => url)
            .map(([label, url]) => ({ label, url })),
        footerText: settings.data.footerText ?? "",
      });
  }, [settings.data]);
  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(async r => {
        if (!r.ok) {
          navigate("/admin/login");
          return;
        }
        setAuthorized(true);
      })
      .catch(() => navigate("/admin/login"));
  }, [navigate]);
  useEffect(() => {
    if (!authorized) return;
    let active = true;
    const check = async () => {
      try {
        const r = await fetch(`/api/admin/deploy/status?check=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok || !active) return;
        const next = await r.json();
        if (
          deployWatch &&
          next.currentSha &&
          next.currentSha === next.remoteSha &&
          next.currentSha !== deployBaseSha
        ) {
          setDeploy({
            ...next,
            state: "success",
            hasUpdate: false,
            message: "업데이트와 서비스 재시작이 완료되었습니다.",
          });
          setDeployWatch(false);
          setDeployBusy(false);
        } else setDeploy(next);
      } catch {
        if (active && deployWatch)
          setDeploy((current: any) => ({
            ...(current ?? {}),
            state: "updating",
            message: "서버가 재시작 중입니다. 연결을 다시 확인하는 중...",
          }));
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void check();
    };
    void check();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    const timer = window.setInterval(check, deployWatch ? 3000 : 10000);
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [authorized, deployWatch, deployBaseSha]);
  const publish = trpc.news.publish.useMutation({
    onSuccess: result => {
      setNotice(emptyNotice);
      setNoticeFeedback({
        tone: result.discord.sent ? "success" : "success",
        message: [result.newsletter?.message, result.discord.message]
          .filter(Boolean)
          .join(" · "),
      });
      void utils.admin.notices.invalidate();
    },
    onError: error =>
      setNoticeFeedback({
        tone: "error",
        message: `공지 발행 실패: ${error.message}`,
      }),
  });
  const updateNotice = trpc.news.update.useMutation({
    onSuccess: result => {
      setNotice(emptyNotice);
      setEditingNotice(null);
      setNoticeFeedback({
        tone: result.discord.sent ? "success" : "success",
        message: result.discord.message,
      });
      void utils.admin.notices.invalidate();
    },
    onError: error =>
      setNoticeFeedback({
        tone: "error",
        message: `공지 수정 실패: ${error.message}`,
      }),
  });
  const removeNotice = trpc.news.remove.useMutation({
    onSuccess: () => void utils.admin.notices.invalidate(),
  });
  const createGame = trpc.admin.createGame.useMutation({
    onSuccess: () => {
      setGame(emptyGame);
      void utils.admin.games.invalidate();
    },
  });
  const updateGame = trpc.admin.updateGame.useMutation({
    onSuccess: () => {
      setGame(emptyGame);
      setEditingGame(null);
      void utils.admin.games.invalidate();
    },
  });
  const removeGame = trpc.admin.deleteGame.useMutation({
    onSuccess: () => void utils.admin.games.invalidate(),
  });
  const createTeam = trpc.admin.createTeam.useMutation({
    onSuccess: () => {
      setMember(emptyMember);
      void utils.admin.team.invalidate();
    },
  });
  const updateTeam = trpc.admin.updateTeam.useMutation({
    onSuccess: () => {
      setMember(emptyMember);
      setEditingMember(null);
      void utils.admin.team.invalidate();
    },
  });
  const removeTeam = trpc.admin.deleteTeam.useMutation({
    onSuccess: () => void utils.admin.team.invalidate(),
  });
  const saveSettings = trpc.admin.saveSettings.useMutation();
  const addAdmin = trpc.admin.addAdmin.useMutation({
    onSuccess: () => setAdminForm({ username: "", password: "", name: "" }),
  });
  const changePassword = trpc.admin.changePassword.useMutation({
    onSuccess: () => setNewPassword(""),
  });
  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    navigate("/admin/login");
  }
  async function checkDeploymentNow() {
    setDeployBusy(true);
    try {
      const r = await fetch(`/api/admin/deploy/status?manual=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!r.ok) throw new Error("업데이트 상태를 확인할 수 없습니다.");
      const next = await r.json();
      setDeploy({
        ...next,
        state: next.hasUpdate ? next.state : "idle",
        message: !next.webhookConfigured
          ? "GitHub 웹훅이 아직 연결되지 않았습니다."
          : next.hasUpdate
            ? "새로운 GitHub 커밋이 있습니다."
            : "웹훅으로 새 커밋을 기다리는 중입니다.",
      });
    } catch (error) {
      setDeploy((current: any) => ({
        ...(current ?? {}),
        state: "failed",
        message:
          error instanceof Error
            ? error.message
            : "업데이트 상태 확인에 실패했습니다.",
      }));
    } finally {
      setDeployBusy(false);
    }
  }
  async function startUpdate() {
    const base = deploy?.currentSha ?? "";
    setDeployBaseSha(base);
    setDeployWatch(true);
    setDeployBusy(true);
    setDeploy((current: any) => ({
      ...(current ?? {}),
      state: "updating",
      message:
        "서버 업데이트를 시작했습니다. 재시작 후 완료 여부를 확인합니다.",
    }));
    try {
      const r = await fetch("/api/admin/deploy/update", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (r.ok) {
        const next = await r.json();
        setDeploy(next);
        if (!next.accepted && next.message)
          setNoticeFeedback({ tone: "error", message: next.message });
      }
    } catch {
      setDeploy((current: any) => ({
        ...(current ?? {}),
        state: "updating",
        message: "서버가 재시작 중입니다. 연결을 다시 확인하는 중...",
      }));
    }
  }
  function confirmDelete(kind: "notice" | "game" | "team", id: string) {
    if (
      !window.confirm(
        kind === "notice"
          ? "이 공지사항을 삭제할까요? 삭제 후 복구할 수 없습니다."
          : kind === "game"
            ? "이 게임을 삭제할까요? 삭제 후 복구할 수 없습니다."
            : "이 직원을 삭제할까요? 삭제 후 복구할 수 없습니다."
      )
    )
      return;
    if (kind === "notice") removeNotice.mutate({ id });
    else if (kind === "game") removeGame.mutate({ id });
    else removeTeam.mutate({ id });
  }
  function insertMedia(markdown: string) {
    setNotice(current => ({
      ...current,
      body: `${current.body}${current.body.trim() ? "\n\n" : ""}${markdown}\n\n`,
    }));
  }
  if (!authorized)
    return <div className="admin-loading">관리자 콘솔 확인 중...</div>;
  const menu: [Tab, string, any][] = [
    ["overview", "대시보드", LayoutDashboard],
    ["news", "공지사항", Newspaper],
    ["games", "게임 콘텐츠", Gamepad2],
    ["team", "팀 / 직원", Users],
    ["settings", "사이트 설정", Settings2],
    ["security", "보안 / 계정", KeyRound],
  ];
  const formTitle = editingNotice ? "공지사항 수정" : "공지사항 발행";
  return (
    <>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link className="brand" href="/">
            <img
              src={socials.logoUrl || "/assets/RamicStudio.svg"}
              alt="Ramic Studio"
            />
          </Link>
          <nav className="admin-nav">
            {menu.map(([key, label, Icon]) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>
          <button className="back-link admin-logout" onClick={logout}>
            <LogOut size={14} /> 로그아웃
          </button>
          <Link className="back-link" href="/">
            <ArrowLeft size={14} /> 사이트 보기
          </Link>
        </aside>
        <main className="admin-main">
          <header className="admin-top">
            <div>
              <p className="eyebrow">RAMIC / PRIVATE CONSOLE</p>
              <h1>
                콘텐츠를
                <br />
                <em>움직입니다.</em>
              </h1>
            </div>
            <div className="admin-user">
              MONGODB CMS
              <br />
              <strong>SECURE SESSION</strong>
              <button
                className="admin-update-button"
                onClick={() =>
                  deploy?.hasUpdate ? startUpdate() : checkDeploymentNow()
                }
                disabled={deployBusy}
              >
                {deployBusy
                  ? "확인 중..."
                  : deploy?.hasUpdate
                    ? "새 버전 업데이트"
                    : "웹 업데이트 확인"}
                <RefreshCw size={13} />
              </button>
            </div>
          </header>
          {tab === "overview" && (
            <section>
              <div className="admin-stats">
                <div>
                  <span>공지사항</span>
                  <strong>{notices.data?.length ?? 0}</strong>
                </div>
                <div>
                  <span>게임 콘텐츠</span>
                  <strong>{games.data?.length ?? 0}</strong>
                </div>
                <div>
                  <span>관리자 인증</span>
                  <strong>12H</strong>
                </div>
              </div>
              <div className="admin-panel-grid">
                <button onClick={() => setTab("news")}>
                  <Newspaper />
                  <b>공지사항 관리</b>
                  <small>현재 글을 보고 발행·수정·삭제합니다.</small>
                </button>
                <button onClick={() => setTab("games")}>
                  <Gamepad2 />
                  <b>게임 콘텐츠 관리</b>
                  <small>등록된 게임을 한눈에 관리합니다.</small>
                </button>
                <button onClick={() => setTab("team")}>
                  <Users />
                  <b>팀원 소개</b>
                  <small>구성원 프로필을 추가합니다.</small>
                </button>
              </div>
            </section>
          )}
          {tab === "news" && (
            <section className="notice-editor">
              <div className="content-head">
                <div>
                  <p className="eyebrow">CONTENT / NEWS</p>
                  <h2>{formTitle}</h2>
                </div>
                <button
                  className="subtle-button"
                  onClick={() => void notices.refetch()}
                >
                  <RefreshCw size={14} /> 목록 새로고침
                </button>
              </div>
              <div className="cms-list">
                {notices.isLoading ? (
                  <p className="empty-state">공지사항을 불러오는 중...</p>
                ) : notices.data?.length ? (
                  notices.data.map(item => (
                    <article className="cms-item" key={item.id}>
                      <div>
                        <span className="news-tag">{item.category}</span>
                        <h3>{item.title}</h3>
                        <small>
                          {new Date(item.publishedAt).toLocaleDateString(
                            "ko-KR"
                          )}
                        </small>
                      </div>
                      <div className="cms-actions">
                        <button
                          onClick={() => {
                            setEditingNotice(item.id);
                            setNotice({
                              category: item.category,
                              title: item.title,
                              body: item.body,
                              discordNotify: false,
                              newsletterNotify: false,
                              discordMentionEveryone: false,
                              discordMode: "same",
                              discordBody: "",
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil size={14} /> 수정
                        </button>
                        <button
                          className="danger"
                          onClick={() => confirmDelete("notice", item.id)}
                        >
                          <Trash2 size={14} /> 삭제
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">
                    아직 저장된 공지사항이 없습니다.
                  </p>
                )}
              </div>
              <div className="editor-divider">
                <span>
                  {editingNotice
                    ? "EDIT / 선택한 공지사항"
                    : "NEW / 새 공지사항"}
                </span>
                {editingNotice && (
                  <button
                    className="subtle-button"
                    onClick={() => {
                      setEditingNotice(null);
                      setNotice(emptyNotice);
                    }}
                  >
                    새 글로 전환
                  </button>
                )}
              </div>
              <p className="editor-intro">
                본문 안에서 이미지와 동영상을 직접 업로드해 삽입합니다. 대표
                이미지 URL은 사용하지 않습니다.
              </p>
              <div className="syntax-card">
                <code>이미지 → 업로드 후 ![설명](자동 생성 경로)</code>
                <code>동영상 → 업로드 후 ![video](자동 생성 경로)</code>
                <code>**강조** · [링크 이름](https://...)</code>
              </div>
              {noticeFeedback && (
                <div
                  className={`notice-feedback notice-feedback-${noticeFeedback.tone}`}
                  role={noticeFeedback.tone === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {noticeFeedback.message}
                  <button
                    type="button"
                    aria-label="알림 닫기"
                    onClick={() => setNoticeFeedback(null)}
                  >
                    닫기
                  </button>
                </div>
              )}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const input = { ...notice, coverUrl: null };
                  if (editingNotice)
                    updateNotice.mutate({ id: editingNotice, ...input });
                  else publish.mutate(input);
                }}
              >
                <label>
                  분류
                  <select
                    value={notice.category}
                    onChange={e =>
                      setNotice({ ...notice, category: e.target.value })
                    }
                  >
                    <option>STUDIO</option>
                    <option>GAME</option>
                    <option>CAREERS</option>
                    <option>COMMUNITY</option>
                  </select>
                </label>
                <label>
                  제목
                  <input
                    required
                    value={notice.title}
                    onChange={e =>
                      setNotice({ ...notice, title: e.target.value })
                    }
                  />
                </label>
                <MediaInsert onInsert={insertMedia} />
                <label>
                  본문
                  <textarea
                    required
                    rows={16}
                    value={notice.body}
                    onChange={e =>
                      setNotice({ ...notice, body: e.target.value })
                    }
                    placeholder="## 업데이트 소식\n\n본문에 들어갈 내용을 작성하세요."
                  />
                </label>
                <fieldset className="discord-options">
                  <legend>EMAIL 뉴스레터</legend>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={notice.newsletterNotify}
                      onChange={e =>
                        setNotice({
                          ...notice,
                          newsletterNotify: e.target.checked,
                        })
                      }
                    />
                    발행 시 이메일 구독자에게 공지 보내기
                  </label>
                  <p className="field-help">
                    현재 활성화된 뉴스레터 구독자에게 이 공지가 이메일로 전송됩니다. 공지 수정 시에는 다시 발송하지 않습니다.
                  </p>
                </fieldset>
                <fieldset className="discord-options">
                  <legend>DISCORD 공지 옵션</legend>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={notice.discordNotify}
                      onChange={e =>
                        setNotice({
                          ...notice,
                          discordNotify: e.target.checked,
                        })
                      }
                    />
                    Discord에도 같은 공지를 전송
                  </label>
                  {notice.discordNotify && (
                    <>
                      <label>
                        Discord 전송 내용
                        <select
                          value={notice.discordMode}
                          onChange={e =>
                            setNotice({
                              ...notice,
                              discordMode: e.target.value as "same" | "custom",
                            })
                          }
                        >
                          <option value="same">웹 공지 그대로 보내기</option>
                          <option value="custom">Discord 전용 문구 사용</option>
                        </select>
                      </label>
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={notice.discordMentionEveryone}
                          onChange={e =>
                            setNotice({
                              ...notice,
                              discordMentionEveryone: e.target.checked,
                            })
                          }
                        />
                        맨 위에 @everyone 추가
                      </label>
                      {notice.discordMode === "custom" && (
                        <label>
                          Discord용 공지 문구
                          <textarea
                            rows={6}
                            value={notice.discordBody}
                            onChange={e =>
                              setNotice({
                                ...notice,
                                discordBody: e.target.value,
                              })
                            }
                            placeholder="Discord에만 보낼 문구를 입력하세요."
                            required
                          />
                        </label>
                      )}
                    </>
                  )}
                </fieldset>
                <button className="publish-button">
                  {editingNotice ? <Pencil size={16} /> : <Plus size={16} />}{" "}
                  {editingNotice ? "공지사항 수정" : "공지사항 발행"}
                </button>
              </form>
            </section>
          )}
          {tab === "games" && (
            <section className="notice-editor">
              <div className="content-head">
                <div>
                  <p className="eyebrow">CONTENT / GAMES</p>
                  <h2>{editingGame ? "게임 수정" : "게임 추가"}</h2>
                </div>
                <button
                  className="subtle-button"
                  onClick={() => void games.refetch()}
                >
                  <RefreshCw size={14} /> 목록 새로고침
                </button>
              </div>
              <div className="cms-list">
                {games.isLoading ? (
                  <p className="empty-state">게임을 불러오는 중...</p>
                ) : games.data?.length ? (
                  games.data.map(item => (
                    <article className="cms-item" key={item.id}>
                      <div className="cms-item-game">
                        {item.imageUrl && <img src={item.imageUrl} alt="" />}
                        <div>
                          <span className="news-tag">
                            {item.code} · {item.status}
                          </span>
                          <h3>
                            {item.title}
                            {item.isNew && <b className="new-badge">NEW</b>}
                          </h3>
                          <small>
                            {item.genre || "장르 미지정"} ·{" "}
                            {item.previewUrl ? "체험판 있음" : "체험판 없음"}
                          </small>
                        </div>
                      </div>
                      <div className="cms-actions">
                        <button
                          onClick={() => {
                            setEditingGame(item.id);
                            setGame({
                              code: item.code,
                              title: item.title,
                              description: item.description,
                              genre: item.genre,
                              status: item.status,
                              imageUrl: item.videoUrl
                                ? ""
                                : (item.imageUrl ?? ""),
                              videoUrl: item.videoUrl ?? "",
                              externalUrl: item.externalUrl ?? "",
                              externalLabel: item.externalLabel ?? "STEAM",
                              isNew: item.isNew,
                              previewUrl: item.previewUrl ?? "",
                            });
                            setTab("games");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil size={14} /> 수정
                        </button>
                        <button
                          className="danger"
                          onClick={() => confirmDelete("game", item.id)}
                        >
                          <Trash2 size={14} /> 삭제
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">아직 저장된 게임이 없습니다.</p>
                )}
              </div>
              <div className="editor-divider">
                <span>
                  {editingGame ? "EDIT / 선택한 게임" : "NEW / 새 게임"}
                </span>
                {editingGame && (
                  <button
                    className="subtle-button"
                    onClick={() => {
                      setEditingGame(null);
                      setGame(emptyGame);
                    }}
                  >
                    새 게임으로 전환
                  </button>
                )}
              </div>
              <p className="editor-intro">
                이미지·영상·체험판은 파일 선택으로 등록됩니다. 외부 플레이
                주소가 있으면 버튼은 “플레이”, 웹 체험판은 “체험하기”로
                표시됩니다.
              </p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const input = {
                    ...game,
                    imageUrl: game.imageUrl || "/assets/hama.png",
                    videoUrl: game.videoUrl || null,
                    externalUrl: game.externalUrl || null,
                    previewUrl: game.previewUrl || null,
                  };
                  if (editingGame)
                    updateGame.mutate({ id: editingGame, ...input });
                  else createGame.mutate(input);
                }}
              >
                <div className="editor-grid">
                  <label>
                    코드
                    <input
                      value={game.code}
                      onChange={e => setGame({ ...game, code: e.target.value })}
                    />
                  </label>
                  <label>
                    게임명
                    <input
                      required
                      value={game.title}
                      onChange={e =>
                        setGame({ ...game, title: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  한 줄 소개
                  <textarea
                    rows={4}
                    value={game.description}
                    onChange={e =>
                      setGame({ ...game, description: e.target.value })
                    }
                  />
                </label>
                <div className="editor-grid">
                  <label>
                    장르
                    <input
                      value={game.genre}
                      onChange={e =>
                        setGame({ ...game, genre: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    상태
                    <select
                      value={game.status}
                      onChange={e =>
                        setGame({ ...game, status: e.target.value })
                      }
                    >
                      <option>개발 중</option>
                      <option>출시 예정</option>
                      <option>출시</option>
                      <option>서비스 종료</option>
                    </select>
                  </label>
                </div>
                <RepresentativeMediaField
                  value={game.videoUrl || game.imageUrl}
                  isVideo={Boolean(game.videoUrl)}
                  onChange={(url, video) =>
                    setGame({
                      ...game,
                      imageUrl: video ? "" : url,
                      videoUrl: video ? url : "",
                    })
                  }
                />
                <div className="link-group">
                  <label>
                    외부 플레이 주소 (선택)
                    <span className="field-help">
                      Steam 또는 STOVE 페이지 주소
                    </span>
                    <input
                      type="url"
                      value={game.externalUrl}
                      onChange={e =>
                        setGame({ ...game, externalUrl: e.target.value })
                      }
                      placeholder="https://store.steampowered.com/..."
                    />
                  </label>
                  <label>
                    외부 플랫폼
                    <select
                      value={game.externalLabel}
                      onChange={e =>
                        setGame({ ...game, externalLabel: e.target.value })
                      }
                    >
                      <option>STEAM</option>
                      <option>STOVE</option>
                      <option>OTHER</option>
                    </select>
                  </label>
                </div>
                <PreviewZipField
                  value={game.previewUrl}
                  onChange={url => setGame({ ...game, previewUrl: url })}
                />
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={game.isNew}
                    onChange={e =>
                      setGame({ ...game, isNew: e.target.checked })
                    }
                  />{" "}
                  NEW 배지 표시
                </label>
                <button className="publish-button">
                  {editingGame ? <Pencil size={16} /> : <Gamepad2 size={16} />}{" "}
                  {editingGame ? "게임 수정" : "게임 저장"}
                </button>
              </form>
            </section>
          )}
          {tab === "team" && (
            <section className="notice-editor">
              <div className="content-head">
                <div>
                  <p className="eyebrow">CONTENT / TEAM</p>
                  <h2>{editingMember ? "직원 소개 수정" : "직원 소개 추가"}</h2>
                </div>
                <button
                  className="subtle-button"
                  onClick={() => void team.refetch()}
                >
                  <RefreshCw size={14} /> 목록 새로고침
                </button>
              </div>
              <div className="cms-list">
                {team.isLoading ? (
                  <p className="empty-state">직원 목록을 불러오는 중...</p>
                ) : team.data?.length ? (
                  team.data.map(item => (
                    <article className="cms-item" key={item.id}>
                      <div className="cms-item-game">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" />
                        ) : (
                          <div className="team-list-placeholder">R</div>
                        )}
                        <div>
                          <span className="news-tag">{item.role}</span>
                          <h3>{item.name}</h3>
                          <small>
                            {item.isPublic ? "공개" : "비공개"} · 정렬{" "}
                            {item.sortOrder}
                          </small>
                        </div>
                      </div>
                      <div className="cms-actions">
                        <button
                          onClick={() => {
                            setEditingMember(item.id);
                            setMember({
                              name: item.name,
                              role: item.role,
                              bio: item.bio,
                              imageUrl: item.imageUrl ?? "",
                              sortOrder: item.sortOrder,
                              isPublic: item.isPublic,
                            });
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Pencil size={14} /> 수정
                        </button>
                        <button
                          className="danger"
                          onClick={() => confirmDelete("team", item.id)}
                        >
                          <Trash2 size={14} /> 삭제
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">
                    아직 저장된 직원이 없습니다. 아래 폼으로 추가하세요.
                  </p>
                )}
              </div>
              <div className="editor-divider">
                <span>
                  {editingMember ? "EDIT / 선택한 직원" : "NEW / 새 직원"}
                </span>
                {editingMember && (
                  <button
                    className="subtle-button"
                    onClick={() => {
                      setEditingMember(null);
                      setMember(emptyMember);
                    }}
                  >
                    새 직원으로 전환
                  </button>
                )}
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const input = {
                    ...member,
                    imageUrl: member.imageUrl || null,
                  };
                  if (editingMember)
                    updateTeam.mutate({ id: editingMember, ...input });
                  else createTeam.mutate(input);
                }}
              >
                <div className="editor-grid">
                  <label>
                    이름
                    <input
                      required
                      value={member.name}
                      onChange={e =>
                        setMember({ ...member, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    직책
                    <input
                      required
                      value={member.role}
                      onChange={e =>
                        setMember({ ...member, role: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  소개
                  <textarea
                    rows={6}
                    value={member.bio}
                    onChange={e =>
                      setMember({ ...member, bio: e.target.value })
                    }
                  />
                </label>
                <div className="editor-grid">
                  <label>
                    정렬 순서
                    <input
                      type="number"
                      min="0"
                      value={member.sortOrder}
                      onChange={e =>
                        setMember({
                          ...member,
                          sortOrder: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={member.isPublic}
                      onChange={e =>
                        setMember({ ...member, isPublic: e.target.checked })
                      }
                    />{" "}
                    공개
                  </label>
                </div>
                <UploadField
                  label="프로필 이미지"
                  accept="image/*"
                  value={member.imageUrl}
                  onChange={url => setMember({ ...member, imageUrl: url })}
                  help="정사각형 이미지를 권장합니다"
                />
                {(createTeam.error || updateTeam.error) && (
                  <p className="form-error">
                    {(createTeam.error || updateTeam.error)?.message ||
                      "직원 저장에 실패했습니다."}
                  </p>
                )}
                <button className="publish-button">
                  {editingMember ? <Pencil size={16} /> : <Users size={16} />}{" "}
                  {editingMember ? "직원 수정" : "직원 저장"}
                </button>
              </form>
            </section>
          )}
          {tab === "settings" && (
            <section className="notice-editor">
              <p className="eyebrow">SYSTEM / SETTINGS</p>
              <h2>SNS와 사이트 설정</h2>
              <p className="editor-intro">
                브라우저 탭 아이콘과 사이트 헤더·푸터 로고에 함께 사용됩니다.
              </p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  saveSettings.mutate(socials);
                }}
              >
                <UploadField
                  label="사이트 로고 파일"
                  accept="image/*"
                  value={socials.logoUrl}
                  onChange={url => setSocials({ ...socials, logoUrl: url })}
                  help="SVG, PNG, JPG 파일을 업로드하면 헤더·푸터·파비콘에 함께 적용됩니다"
                />
                <label>
                  사이트 로고 URL (직접 입력)
                  <input
                    value={socials.logoUrl}
                    onChange={e =>
                      setSocials({ ...socials, logoUrl: e.target.value })
                    }
                    placeholder="/assets/RamicStudio.svg"
                  />
                </label>
                <div className="social-editor">
                  <div className="social-editor-head">
                    <div>
                      <span className="field-title">푸터 SNS 링크</span>
                      <small>
                        표시할 이름과 URL을 자유롭게 추가하거나 삭제할 수
                        있습니다.
                      </small>
                    </div>
                    <button
                      type="button"
                      className="upload-button"
                      onClick={() =>
                        setSocials({
                          ...socials,
                          socialLinks: [
                            ...socials.socialLinks,
                            { label: "새 링크", url: "" },
                          ],
                        })
                      }
                    >
                      <Plus size={14} /> 링크 추가
                    </button>
                  </div>
                  <div className="social-editor-list">
                    {socials.socialLinks.map((link, index) => (
                      <div
                        className="social-editor-row"
                        key={`${index}-${link.label}`}
                      >
                        <input
                          aria-label={`SNS ${index + 1} 이름`}
                          value={link.label}
                          onChange={e =>
                            setSocials({
                              ...socials,
                              socialLinks: socials.socialLinks.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, label: e.target.value }
                                    : item
                              ),
                            })
                          }
                          placeholder="표시 이름"
                        />
                        <input
                          aria-label={`SNS ${index + 1} URL`}
                          value={link.url}
                          onChange={e =>
                            setSocials({
                              ...socials,
                              socialLinks: socials.socialLinks.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, url: e.target.value }
                                    : item
                              ),
                            })
                          }
                          placeholder="https://..."
                          type="url"
                        />
                        <button
                          type="button"
                          className="icon-danger-button"
                          aria-label={`${link.label || "SNS 링크"} 삭제`}
                          onClick={() =>
                            setSocials({
                              ...socials,
                              socialLinks: socials.socialLinks.filter(
                                (_, itemIndex) => itemIndex !== index
                              ),
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <label>
                  푸터 문구
                  <input
                    value={socials.footerText}
                    onChange={e =>
                      setSocials({ ...socials, footerText: e.target.value })
                    }
                  />
                </label>
                <button className="publish-button">
                  <Link2 size={16} /> 설정 저장
                </button>
              </form>
            </section>
          )}
          {tab === "security" && (
            <section className="notice-editor">
              <p className="eyebrow">SECURITY / ACCESS</p>
              <h2>관리자 계정 관리</h2>
              <div className="security-log-heading">
                <h3>최근 보안 이벤트</h3>
                <button
                  type="button"
                  className="subtle-button"
                  onClick={() => void securityLogs.refetch()}
                >
                  <RefreshCw size={14} /> 새로고침
                </button>
              </div>
              <div className="security-log-list" aria-live="polite">
                {securityLogs.isLoading ? (
                  <p className="empty-state">보안 로그를 불러오는 중...</p>
                ) : securityLogs.data?.length ? (
                  securityLogs.data.slice(0, 30).map(log => (
                    <article className="security-log-item" key={log.id}>
                      <div>
                        <strong>{log.event}</strong>
                        <span>
                          {log.path || log.detail || "관리자 보안 이벤트"}
                        </span>
                      </div>
                      <time dateTime={new Date(log.createdAt).toISOString()}>
                        {new Date(log.createdAt).toLocaleString("ko-KR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </time>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">기록된 보안 이벤트가 없습니다.</p>
                )}
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  addAdmin.mutate(adminForm);
                }}
              >
                <h3>회사 직원 관리자 추가</h3>
                <div className="editor-grid">
                  <label>
                    아이디
                    <input
                      required
                      value={adminForm.username}
                      onChange={e =>
                        setAdminForm({ ...adminForm, username: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    이름
                    <input
                      required
                      value={adminForm.name}
                      onChange={e =>
                        setAdminForm({ ...adminForm, name: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  임시 비밀번호 (8자 이상)
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={adminForm.password}
                    onChange={e =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                  />
                </label>
                <button className="publish-button">
                  <Plus size={16} /> 관리자 추가
                </button>
              </form>
              <hr />
              <form
                onSubmit={e => {
                  e.preventDefault();
                  changePassword.mutate({ password: newPassword });
                }}
              >
                <h3>내 비밀번호 변경</h3>
                <label>
                  새 비밀번호 (8자 이상)
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </label>
                <button className="publish-button">
                  <KeyRound size={16} /> 비밀번호 변경
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
      {createPortal(
        <>
          {deploy?.hasUpdate && deploy.state !== "updating" && (
            <div
              className="deploy-modal-backdrop"
              role="dialog"
              aria-modal="true"
            >
              <section className="deploy-modal">
                <p className="eyebrow">GITHUB / UPDATE READY</p>
                <h2>
                  새로운 커밋이
                  <br />
                  <em>도착했습니다.</em>
                </h2>
                <p>GitHub main의 새 버전을 서버에 반영합니다.</p>
                <small>
                  {deploy.currentSha?.slice(0, 7)} →{" "}
                  {deploy.remoteSha?.slice(0, 7)} · PORT {deploy.port}
                </small>
                <div className="deploy-modal-actions">
                  <button
                    className="back-link"
                    onClick={() => setDeploy({ ...deploy, hasUpdate: false })}
                  >
                    나중에
                  </button>
                  <button
                    className="publish-button"
                    onClick={startUpdate}
                    disabled={deployBusy}
                  >
                    {deployBusy ? "업데이트 중..." : "지금 업데이트"}
                  </button>
                </div>
              </section>
            </div>
          )}
          {deploy?.state === "updating" && (
            <div className="deploy-toast" role="status">
              <b>서버 업데이트 중</b>
              <span>{deploy.message}</span>
            </div>
          )}
          {deploy?.state === "success" && (
            <div className="deploy-toast deploy-success" role="status">
              <b>업데이트 완료</b>
              <span>{deploy.message}</span>
            </div>
          )}
          {deploy?.state === "failed" && (
            <div className="deploy-toast deploy-failed" role="alert">
              <b>업데이트 실패</b>
              <span>{deploy.message}</span>
              <button
                onClick={() =>
                  setDeploy({ ...deploy, state: "idle", hasUpdate: true })
                }
              >
                다시 시도
              </button>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
