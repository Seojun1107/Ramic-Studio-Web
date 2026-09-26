import { ArrowLeft, ArrowUpRight, Bell, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const fallback = [
  { id: 1, category: "STUDIO", title: "Ramic Studio enters a new chapter of world-building.", body: "A note from the team on making games that feel like places — not products.", publishedAt: new Date("2026-09-18") },
  { id: 2, category: "NEON VEIL", title: "The first transmission is live.", body: "A fragment from our next world is now broadcasting. Watch the reveal trailer.", publishedAt: new Date("2026-08-29") },
  { id: 3, category: "CAREERS", title: "We are looking for curious minds.", body: "Artists, designers, engineers, and producers — come build the unknown with us.", publishedAt: new Date("2026-07-11") },
  { id: 4, category: "COMMUNITY", title: "The Ramic signal is now on Discord.", body: "Join the conversation, share your theories, and get a little closer to the source.", publishedAt: new Date("2026-05-30") },
];
const accents = ["lime", "coral", "violet", "lime"];

export default function News() {
  const [filter, setFilter] = useState("ALL");
  const { data } = trpc.news.list.useQuery();
  const items = (data?.length ? data : fallback).map((item, index) => ({ ...item, accent: accents[index % accents.length] }));
  const filters = ["ALL", "STUDIO", "NEON VEIL", "CAREERS", "COMMUNITY"];
  const visible = filter === "ALL" ? items : items.filter((item) => item.category === filter);
  return <div className="studio-site news-page"><header className="site-header"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RAMIC<br /><small>STUDIO</small></span></Link><div className="header-actions"><span className="status-dot" /> <span className="status-copy">Seoul / Online</span></div></header><main className="news-main"><Link href="/" className="back-link"><ArrowLeft size={15} /> Return to studio</Link><div className="news-hero"><div><p className="eyebrow"><Bell size={14} /> NEWSROOM / 2026</p><h1>THE<br /><em>SIGNAL</em><br />LOG.</h1></div><p>Announcements, field notes, and fragments from the worlds we're building.</p></div><div className="filter-bar"><Filter size={15} />{filters.map((option) => <button key={option} onClick={() => setFilter(option)} className={filter === option ? "active" : ""}>{option}</button>)}<Link href="/admin" className="admin-link">Admin <ArrowUpRight size={14} /></Link></div><div className="news-list">{visible.map((item) => <article className={`news-item ${item.accent}`} key={item.id}><span className="news-date">{new Date(item.publishedAt).toISOString().slice(0, 10).replaceAll("-", ".")}</span><div><span className="news-tag">{item.category}</span><h2>{item.title}</h2><p>{item.body}</p></div><ArrowUpRight className="news-item-arrow" /></article>)}</div></main><footer className="site-footer"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RAMIC<br /><small>STUDIO</small></span></Link><span className="footer-copy">© 2026 RAMIC STUDIO. MADE WITH CURIOSITY.</span></footer></div>;
}
