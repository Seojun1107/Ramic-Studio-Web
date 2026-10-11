import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

function LegalBody({ body }: { body: string }) {
  return (
    <div className="legal-body">
      {body.split(/\n\s*\n/).map((block, index) => {
        const lines = block.split("\n");
        const first = lines[0] ?? "";
        const isHeading = /^(제\d+조|\d+\.|[0-9]+장)/.test(first.trim());
        return isHeading ? (
          <section key={index}>
            <h2>{first}</h2>
            <p>{lines.slice(1).join("\n")}</p>
          </section>
        ) : (
          <p key={index}>{block}</p>
        );
      })}
    </div>
  );
}

export default function Legal() {
  const [, terms] = useRoute("/terms");
  const settings = trpc.site.settings.useQuery();
  const title = terms ? settings.data?.termsTitle : settings.data?.privacyTitle;
  const body = terms ? settings.data?.termsBody : settings.data?.privacyBody;
  return (
    <main className="legal-page">
      <div className="legal-top">
        <Link href="/" className="back-link">
          <ArrowLeft size={14} /> RAMIC STUDIO
        </Link>
        <span className="eyebrow">LEGAL / {terms ? "TERMS" : "PRIVACY"}</span>
      </div>
      <header className="legal-header">
        <p className="eyebrow">RAMIC STUDIO / POLICY</p>
        <h1>{title || (terms ? "이용약관" : "개인정보처리방침")}</h1>
        <p>
          라믹 스튜디오 서비스 이용에 필요한 기준과 개인정보 보호 원칙을
          안내합니다.
        </p>
      </header>
      {body ? (
        <LegalBody body={body} />
      ) : (
        <p className="legal-loading">문서를 불러오는 중입니다.</p>
      )}
      <footer className="legal-footer">
        <Link href="/">홈으로 돌아가기</Link>
        <a
          href={
            settings.data?.businessInfo.verificationUrl ||
            "https://www.hometax.go.kr/"
          }
          target="_blank"
          rel="noreferrer"
        >
          사업자 정보 확인 <ExternalLink size={13} />
        </a>
      </footer>
    </main>
  );
}
