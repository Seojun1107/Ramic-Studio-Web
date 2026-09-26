import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));

function Loader({ compact = false }: { compact?: boolean }) {
  return <div className={`ramic-loader ${compact ? "ramic-loader-compact" : ""}`} role="status" aria-live="polite"><div className="loader-orbit loader-orbit-a" /><div className="loader-orbit loader-orbit-b" /><div className="loader-core"><span>R</span></div>{!compact && <><div className="loader-wordmark">RAMIC<span>STUDIO</span></div><div className="loader-caption">BUILDING WORLDS / LOADING SIGNAL</div></>}</div>;
}
function BootLoader({ onReady }: { onReady: () => void }) {
  const [progress, setProgress] = useState(8); const [phase, setPhase] = useState("SIGNAL / CONNECTING");
  useEffect(() => { let current = 8; const assets = ["/assets/RamicStudio.svg", "/assets/hama.png"].map(src => new Promise<void>(resolve => { const image = new Image(); image.onload = () => resolve(); image.onerror = () => resolve(); image.src = src; })); const pageReady = new Promise<void>(resolve => { if (document.readyState === "complete") resolve(); else window.addEventListener("load", () => resolve(), { once: true }); }); const timer = window.setInterval(() => { if (current < 88) { current += current < 55 ? 4 : 2; setProgress(current); setPhase(current < 35 ? "SIGNAL / CONNECTING" : current < 70 ? "ASSETS / SYNCING" : "WORLD / INITIALIZING"); } }, 70); Promise.all([Promise.all(assets), pageReady]).then(() => { window.clearInterval(timer); setPhase("RAMIC / READY"); setProgress(100); window.setTimeout(onReady, 520); }); return () => window.clearInterval(timer); }, [onReady]);
  return <div className="boot-loader"><Loader /><div className="loader-progress-wrap"><div className="loader-progress-meta"><span>{phase}</span><strong>{progress}%</strong></div><div className="loader-progress"><i style={{ width: `${progress}%` }} /></div></div></div>;
}
function Router() { return <Suspense fallback={<Loader compact />}><Switch><Route path="/" component={Home} /><Route path="/news/:id" component={NewsDetail} /><Route path="/news" component={News} /><Route path="/admin" component={Admin} /><Route path="/admin/login" component={AdminLogin} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></Suspense>; }
export default function App() { const [booted, setBooted] = useState(false); const ready = () => setBooted(true); return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster />{!booted && <BootLoader onReady={ready} />}<div className={booted ? "app-ready" : "app-hidden"}><Router /></div></TooltipProvider></ThemeProvider></ErrorBoundary>; }
