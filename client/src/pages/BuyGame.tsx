import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { trpc } from "@/lib/trpc";

function formatKRW(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function BuyGame() {
  const [, params] = useRoute("/buy/:gameId");
  const [, setLocation] = useLocation();
  const isSuccess = window.location.pathname === "/buy/success";
  const isFail = window.location.pathname === "/buy/fail";
  const query = new URLSearchParams(window.location.search);
  const gameId = params?.gameId ?? "";
  const gameQuery = trpc.site.games.useQuery(undefined, {
    enabled: Boolean(gameId),
  });
  const game = gameQuery.data?.find(item => item.id === gameId);
  const start = trpc.payments.start.useMutation({
    onSuccess: async result => {
      try {
        const toss = await loadTossPayments(result.clientKey);
        await toss.requestPayment("CARD", {
          amount: result.amount,
          orderId: result.orderId,
          orderName: `Ramic Studio · ${result.gameTitle}`.slice(0, 100),
          successUrl: `${window.location.origin}/buy/success`,
          failUrl: `${window.location.origin}/buy/fail`,
        });
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "결제창을 열지 못했습니다."
        );
      }
    },
    onError: error => setMessage(error.message),
  });
  const confirm = trpc.payments.confirm.useMutation();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!isSuccess || confirm.isSuccess || confirm.isPending) return;
    const paymentKey = query.get("paymentKey");
    const orderId = query.get("orderId");
    const amount = Number(query.get("amount"));
    if (paymentKey && orderId && Number.isFinite(amount))
      confirm.mutate({ paymentKey, orderId, amount });
  }, [confirm, isSuccess, window.location.search]);

  if (isSuccess)
    return (
      <Result
        title={
          confirm.isError
            ? "결제 승인에 실패했습니다."
            : "결제가 완료되었습니다."
        }
        body={
          confirm.isError
            ? confirm.error.message
            : "결제 확인과 스팀키 발송 상태를 준비하고 있습니다. 입력하신 이메일을 확인해 주세요."
        }
        orderId={query.get("orderId")}
      />
    );
  if (isFail)
    return (
      <Result
        title="결제가 완료되지 않았습니다."
        body={
          query.get("message") ||
          "결제가 취소되었거나 승인되지 않았습니다. 다시 시도해 주세요."
        }
        orderId={query.get("orderId")}
      />
    );
  if (gameQuery.isLoading)
    return (
      <main className="purchase-page">
        <p>게임 정보를 불러오는 중...</p>
      </main>
    );
  if (!game || !game.isPurchasable || !game.priceKRW)
    return (
      <main className="purchase-page">
        <Link href="/" className="back-link">
          <ArrowLeft size={14} /> 돌아가기
        </Link>
        <h1>현재 구매할 수 없는 게임입니다.</h1>
      </main>
    );

  return (
    <main className="purchase-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={14} /> RAMIC STUDIO / 게임 목록
      </Link>
      <section className="purchase-shell">
        <div className="purchase-intro">
          <p className="eyebrow">DIRECT PURCHASE / {game.code}</p>
          <h1>
            {game.title}
            <br />
            <em>PLAY DIRECT.</em>
          </h1>
          <p className="purchase-copy">
            라믹 스튜디오 공식 사이트에서 구매하고, 결제 완료 후 스팀 키를
            이메일로 받아보세요.
          </p>
          <div className="purchase-price">₩{formatKRW(game.priceKRW)}</div>
        </div>
        <form
          className="purchase-card"
          onSubmit={e => {
            e.preventDefault();
            setMessage("");
            start.mutate({ gameId, ...form });
          }}
        >
          <div className="purchase-card-head">
            <span>BUY / {game.title}</span>
            <ShieldCheck size={18} />
          </div>
          <label>
            이름
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="홍길동"
            />
          </label>
          <label>
            이메일
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label>
            전화번호
            <input
              required
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="010-0000-0000"
            />
          </label>
          <div className="purchase-consent">
            <LockKeyhole size={14} /> 결제와 스팀키 발송을 위해
            이름·이메일·전화번호를 암호화하여 보관합니다.
          </div>
          {message && <p className="form-error">{message}</p>}
          <button className="purchase-submit" disabled={start.isPending}>
            {start.isPending
              ? "결제창 준비 중..."
              : "토스페이먼츠로 결제하기 ↗"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Result({
  title,
  body,
  orderId,
}: {
  title: string;
  body: string;
  orderId: string | null;
}) {
  return (
    <main className="purchase-page purchase-result">
      <CheckCircle2 size={42} />
      <p className="eyebrow">PAYMENT / STATUS</p>
      <h1>{title}</h1>
      <p>{body}</p>
      {orderId && <small>주문번호 {orderId}</small>}
      <Link href="/" className="pill-button">
        홈으로 돌아가기 ↗
      </Link>
    </main>
  );
}
