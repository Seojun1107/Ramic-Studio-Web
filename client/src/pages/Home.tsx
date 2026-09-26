import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Disc3, Menu, MousePointer2, Play, Sparkles, X } from "lucide-react";
import { Link } from "wouter";

const games = [
  { code: "R-01", title: "NEON VEIL", meta: "Narrative action · PC / Console", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1400&q=85", tone: "lime" },
  { code: "R-02", title: "ECHOES OF ASTRA", meta: "Co-op exploration · In development", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85", tone: "coral" },
  { code: "R-03", title: "SILT / SIGNAL", meta: "Experimental short · 2027", image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=85", tone: "violet" },
];

const notices = [
  { date: "2026.09.18", tag: "STUDIO", title: "Ramic Studio enters a new chapter of world-building." },
  { date: "2026.08.29", tag: "NEON VEIL", title: "The first transmission is live. Watch the reveal trailer." },
  { date: "2026.07.11", tag: "CAREERS", title: "We are looking for artists, designers, and curious minds." },
];

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={`reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</div>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [activeGame, setActiveGame] = useState(0);

  useEffect(() => {
    const onMove = (event: MouseEvent) => setCursor({ x: (event.clientX / window.innerWidth - 0.5) * 2, y: (event.clientY / window.innerHeight - 0.5) * 2 });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return <div className="studio-site">
    <div className="noise" aria-hidden="true" />
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Ramic Studio home"><span className="brand-mark">R</span><span>RAMIC<br /><small>STUDIO</small></span></a>
      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
        <a href="#games" onClick={() => setMenuOpen(false)}>Games</a><a href="#studio" onClick={() => setMenuOpen(false)}>Studio</a><Link href="/news" onClick={() => setMenuOpen(false)}>News</Link><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
      </nav>
      <div className="header-actions"><span className="status-dot" /> <span className="status-copy">Seoul / Online</span><button className="icon-button menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"}>{menuOpen ? <X /> : <Menu />}</button></div>
    </header>

    <main id="top">
      <section className="hero" style={{ "--mx": `${cursor.x * 18}px`, "--my": `${cursor.y * 18}px` } as React.CSSProperties}>
        <div className="hero-grid" />
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="hero-meta"><span>EST. 2021</span><span>SEOUL · KR</span></div>
        <div className="hero-copy">
          <Reveal><p className="eyebrow"><Sparkles size={14} /> STORIES WITH A SIGNAL</p></Reveal>
          <Reveal delay={80}><h1>MAKE<br /><em>WORLDS</em><br />WORTH<br />GETTING LOST IN.</h1></Reveal>
          <Reveal delay={170}><p className="hero-lede">Ramic Studio is an independent game company creating strange, beautiful places for curious people.</p></Reveal>
          <Reveal delay={240}><a className="pill-button" href="#games">Explore our worlds <ArrowUpRight size={16} /></a></Reveal>
        </div>
        <div className="hero-art" aria-label="Abstract atmosphere artwork">
          <div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-core" /><div className="art-figure" style={{ transform: `translate3d(var(--mx), var(--my), 0)` }} />
          <span className="art-caption">NO. 001 / THE FIRST TRANSMISSION</span>
        </div>
        <div className="hero-bottom"><span className="scroll-label"><MousePointer2 size={14} /> Scroll to enter</span><span className="hero-index">01 <span>/ 04</span></span><ChevronDown className="bounce" /></div>
      </section>

      <section className="signal-strip"><div><span className="mono">CURRENTLY BROADCASTING</span><strong>NEON VEIL <i>—</i> FIRST LOOK</strong></div><a href="#games">Watch trailer <Play size={13} fill="currentColor" /></a></section>

      <section className="section games-section" id="games">
        <div className="section-heading"><div><p className="eyebrow">01 / OUR WORLDS</p><h2>PLAY<br /><em>THE UNKNOWN.</em></h2></div><p className="section-note">From midnight cities to impossible planets, we build games that leave a trace.</p></div>
        <div className="game-stage">
          <div className="game-feature-image" style={{ backgroundImage: `url(${games[activeGame].image})` }}><div className="game-overlay" /><span className="feature-code">{games[activeGame].code}</span><span className="feature-status">IN PROGRESS <i /></span><div className="feature-title"><span>PROJECT</span><h3>{games[activeGame].title}</h3><p>{games[activeGame].meta}</p></div><button className="play-button" aria-label="Play trailer"><Play fill="currentColor" size={22} /></button></div>
          <div className="game-list">{games.map((game, index) => <button className={`game-row ${activeGame === index ? "active" : ""}`} key={game.code} onClick={() => setActiveGame(index)}><span>{game.code}</span><strong>{game.title}</strong><span className="row-meta">{game.meta}</span><ArrowUpRight size={17} /></button>)}<div className="game-list-foot"><Disc3 size={18} /><span>3 worlds in orbit</span><span className="line" /></div></div>
        </div>
      </section>

      <section className="manifesto" id="studio"><div className="manifesto-orbit" /><div className="manifesto-inner"><p className="eyebrow">02 / THE STUDIO</p><h2>WE MAKE<br /><span>FEELING</span><br />PLAYABLE.</h2><p className="manifesto-copy">The best games are not destinations. They are small doors into a larger life. We make those doors — with care, curiosity, and a little bit of beautiful weirdness.</p><a className="text-link" href="#contact">Meet the team <ArrowUpRight size={16} /></a></div><div className="manifesto-stamp">PLAY<br />CURIOUS<br /><span>◎</span></div></section>

      <section className="section news-section" id="news"><div className="section-heading"><div><p className="eyebrow">03 / LATEST SIGNALS</p><h2>FROM<br /><em>THE FIELD.</em></h2></div><Link className="text-link" href="/news">All news <ArrowUpRight size={16} /></Link></div><div className="news-grid">{notices.map((notice, index) => <Link href="/news" className={`news-card card-${index}`} key={notice.date}><span className="news-date">{notice.date}</span><span className="news-tag">{notice.tag}</span><h3>{notice.title}</h3><span className="news-arrow"><ArrowUpRight size={18} /></span></Link>)}</div></section>

      <section className="contact-section" id="contact"><div className="contact-glow" /><p className="eyebrow">04 / KEEP IN TOUCH</p><h2>STAY<br /><em>CURIOUS.</em></h2><p>New worlds, studio notes, and occasional transmissions. No noise.</p><form className="signup" onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="email">Email address</label><input id="email" type="email" placeholder="your@email.com" required /><button type="submit">Subscribe <ArrowUpRight size={16} /></button></form></section>
    </main>
    <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark">R</span><span>RAMIC<br /><small>STUDIO</small></span></a><span className="footer-copy">© 2026 RAMIC STUDIO. MADE WITH CURIOSITY.</span><div className="footer-links"><a href="#contact">Instagram</a><a href="#contact">Discord</a><a href="#contact">Press kit</a></div></footer>
  </div>;
}
