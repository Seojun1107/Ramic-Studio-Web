import { ArrowLeft, ArrowUpRight, ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const KAKAO_URL = "http://pf.kakao.com/_VecrG";

export default function Faq() {
  const { data: items, isLoading } = trpc.faq.list.useQuery();
  const [openId, setOpenId] = useState<string | null>(null);
  const faqs = items ?? [];
  const categories = Array.from(new Set(faqs.map(item => item.category)));

  return (
    <main className="faq-page">
      <header className="faq-header">
        <Link className="brand" href="/" aria-label="라믹 스튜디오 홈">
          <img src="/assets/RamicStudio.svg" alt="Ramic Studio" />
        </Link>
        <Link className="back-link" href="/">
          <ArrowLeft size={14} /> 홈으로 돌아가기
        </Link>
      </header>
      <section className="faq-hero">
        <div>
          <p className="eyebrow">RAMIC / FREQUENTLY ASKED</p>
          <h1>궁금한 것을<br /><em>찾아보세요.</em></h1>
        </div>
        <p>라믹 스튜디오와 우리가 만드는 게임에 대해 자주 받는 질문을 모았습니다.</p>
      </section>
      <section className="faq-content" aria-label="자주 묻는 질문">
        <div className="faq-index">
          <span>FAQ / {String(faqs.length).padStart(2, "0")}</span>
          {categories.length > 0 && <span>{categories.join(" · ")}</span>}
        </div>
        {isLoading ? (
          <p className="empty-state">질문을 불러오는 중...</p>
        ) : faqs.length ? (
          <div className="faq-list">
            {faqs.map((item, index) => {
              const open = openId === item.id;
              return (
                <article className={`faq-item ${open ? "is-open" : ""}`} key={item.id}>
                  <button
                    type="button"
                    className="faq-question"
                    aria-expanded={open}
                    aria-controls={`faq-answer-${item.id}`}
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <span className="faq-number">{String(index + 1).padStart(2, "0")}</span>
                    <span className="faq-question-copy"><small>{item.category}</small><strong>{item.question}</strong></span>
                    <ChevronDown size={20} aria-hidden="true" />
                  </button>
                  <div id={`faq-answer-${item.id}`} className="faq-answer" hidden={!open}>
                    <p>{item.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="faq-empty"><span>아직 등록된 질문이 없습니다.</span><small>관리자 콘솔에서 FAQ를 추가해 주세요.</small></div>
        )}
      </section>
      <section className="faq-contact">
        <MessageCircle size={22} />
        <p className="eyebrow">STILL CURIOUS?</p>
        <h2>더 궁금하신<br /><em>사항이 있으시나요?</em></h2>
        <p>찾으시는 답이 없다면 카카오톡으로 편하게 문의해 주세요.</p>
        <a className="pill-button faq-contact-button" href={KAKAO_URL} target="_blank" rel="noopener noreferrer">
          카카오톡으로 문의하기 <ArrowUpRight size={16} />
        </a>
      </section>
      <footer className="site-footer faq-footer">
        <span className="footer-copy">© RAMIC STUDIO / FAQ SIGNAL</span>
        <Link className="footer-links" href="/">홈으로 돌아가기</Link>
      </footer>
    </main>
  );
}
