import { ArrowLeft, Check, LayoutDashboard, LogOut, Plus, Send } from "lucide-react";
import { Link, useLocation } from "wouter";
import { FormEvent, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
type AdminUser = { name: string | null; email: string | null };
export default function Admin() {
  const [, navigate] = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("STUDIO");
  const publish = trpc.news.publish.useMutation({ onSuccess: () => { setPublished(true); setTitle(""); setBody(""); } });
  useEffect(() => { fetch("/api/admin/me", { credentials: "include" }).then(async response => { if (!response.ok) { navigate("/admin/login"); return; } const payload = await response.json(); setAdmin(payload.user); setAuthorized(true); }).catch(() => navigate("/admin/login")); }, [navigate]);
  async function logout() { await fetch("/api/admin/logout", { method: "POST", credentials: "include" }); navigate("/admin/login"); }
  function submit(event: FormEvent) { event.preventDefault(); publish.mutate({ category: category as "STUDIO" | "NEON VEIL" | "CAREERS" | "COMMUNITY", title: title || "라믹 스튜디오의 새로운 소식입니다.", body: body || "스튜디오에서 새로운 신호를 보내드립니다." }); }
  if (!authorized) return <div className="admin-loading">관리자 콘솔 확인 중...</div>;
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RAMIC<br /><small>STUDIO</small></span></Link><div className="admin-nav"><span className="active"><LayoutDashboard size={15} /> 대시보드</span><span><Send size={15} /> 공지사항</span></div><button className="back-link admin-logout" onClick={logout}><LogOut size={14} /> 로그아웃</button><Link className="back-link" href="/"><ArrowLeft size={14} /> 관리자 나가기</Link></aside><main className="admin-main"><div className="admin-top"><div><p className="eyebrow">관리자 / 01</p><h1>좋은 아침입니다,<br /><em>크리에이터.</em></h1></div><div className="admin-user">관리자 권한<br /><strong>{admin?.name ?? "RAMIC STUDIO"}</strong></div></div><div className="admin-stats"><div><span>공개 공지</span><strong>LIVE</strong></div><div><span>데이터 저장소</span><strong>MONGO</strong></div><div><span>세션 상태</span><strong>SECURE</strong></div></div><section className="notice-editor"><div className="editor-head"><div><p className="eyebrow">새로운 신호 발행</p><h2>공지사항 작성</h2></div><span className="draft-badge">{published ? "공개됨" : "임시 저장"}</span></div><form onSubmit={submit}><label>제목<input value={title} onChange={event => setTitle(event.target.value)} placeholder="명확하고 궁금한 제목을 작성하세요..." /></label><div className="editor-grid"><label>분류<select value={category} onChange={event => setCategory(event.target.value)}><option value="STUDIO">스튜디오</option><option value="NEON VEIL">프로젝트</option><option value="CAREERS">채용</option><option value="COMMUNITY">커뮤니티</option></select></label><label>발행일<input type="date" defaultValue="2026-09-26" /></label></div><label>내용<textarea value={body} onChange={event => setBody(event.target.value)} placeholder="공지사항 내용을 작성하세요..." rows={6} /></label><button className="publish-button" disabled={publish.isPending}>{published ? <><Check size={16} /> 공지사항이 발행되었습니다</> : <><Plus size={16} /> {publish.isPending ? "발행 중..." : "공지사항 발행"}</>}</button></form>{publish.error && <p className="form-error">{publish.error.message}</p>}</section></main></div>;
}
