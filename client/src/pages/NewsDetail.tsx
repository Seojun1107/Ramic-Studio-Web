import { ArrowLeft, ArrowUpRight, Bell } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

function RichBody({ source }: { source: string }) {
  return <div className="detail-body">{source.split(/\n{2,}/).map((block, i) => {
    const trimmed = block.trim(); if (!trimmed) return null;
    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/); const video = trimmed.match(/^!\[video\]\(([^)]+)\)$/i);
    if (video) return <video key={i} className="detail-media" src={video[1]} controls />;
    if (image) return <img key={i} className="detail-media" src={image[2]} alt={image[1]} />;
    if (trimmed.startsWith("### ")) return <h3 key={i}>{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith("## ")) return <h2 key={i}>{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith("# ")) return <h2 key={i}>{trimmed.slice(2)}</h2>;
    const html = trimmed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>').replace(/\n/g, "<br />");
    return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  })}</div>;
}
export default function NewsDetail() { const [, params] = useRoute("/news/:id"); const { data, isLoading } = trpc.news.detail.useQuery({ id: params?.id ?? "" }); if (isLoading) return <div className="admin-loading">기록을 불러오는 중...</div>; if (!data) return <main className="news-main"><Link href="/news" className="back-link"><ArrowLeft size={15} /> 목록으로</Link><h1>기록을 찾을 수 없습니다.</h1></main>; return <div className="studio-site news-page"><header className="site-header"><Link className="brand" href="/"><img src="/assets/RamicStudio.svg" alt="Ramic Studio" /></Link></header><main className="news-main news-detail"><Link href="/news" className="back-link"><ArrowLeft size={15} /> 공지사항 목록</Link><p className="eyebrow"><Bell size={14} /> {data.category}</p><h1>{data.title}</h1><time>{new Date(data.publishedAt).toLocaleDateString("ko-KR")}</time>{data.coverUrl && <img className="detail-cover" src={data.coverUrl} alt="" />}<RichBody source={data.body} /><Link href="/news" className="text-link">다른 기록 보기 <ArrowUpRight size={16} /></Link></main></div>; }
