import { FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ username, password }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "로그인에 실패했습니다.");
      navigate("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "로그인에 실패했습니다.");
    } finally {
      setPending(false);
    }
  }

  return <main className="admin-login-page">
    <div className="admin-login-glow" />
    <section className="admin-login-card" aria-labelledby="admin-login-title">
      <Link href="/" className="back-link"><ArrowLeft size={15} /> 스튜디오로 돌아가기</Link>
      <div className="admin-login-mark"><LockKeyhole size={20} /></div>
      <p className="eyebrow">RAMIC / PRIVATE CONSOLE</p>
      <h1 id="admin-login-title">관리자<br /><em>로그인.</em></h1>
      <p className="admin-login-copy">공지사항과 스튜디오 콘텐츠를 관리하는 전용 공간입니다.</p>
      <form onSubmit={submit} className="admin-login-form">
        <label>아이디<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="관리자 아이디" required /></label>
        <label>비밀번호<input autoComplete="current-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="비밀번호" required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="publish-button admin-login-button" disabled={pending}>{pending ? "확인 중..." : <>콘솔 입장 <LogIn size={16} /></>}</button>
      </form>
    </section>
  </main>;
}
