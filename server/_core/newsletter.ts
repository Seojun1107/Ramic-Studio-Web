import { createHash, createHmac } from "crypto";
import { ENV } from "./env";
import { getDb } from "../db";
import type { Notice } from "../../shared/types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function subscribersCollection() {
  const db = await getDb();
  if (!db) return null;
  const collection = db.collection("newsletter_subscribers");
  await collection.createIndex({ email: 1 }, { unique: true });
  await collection.createIndex({ active: 1 });
  return collection;
}

async function saveSubscription(email: string, unsubscribeTokenHash: string) {
  const c = await subscribersCollection();
  if (!c) return { success: false, active: false, created: false, returning: false, welcomePending: false } as const;
  const existing = await c.findOne({ email });
  if (existing?.active === true)
    return { success: true, active: true, created: false, returning: false, welcomePending: !existing.welcomeSentAt } as const;
  const now = new Date();
  await c.updateOne(
    { email },
    { $set: { email, active: true, unsubscribeTokenHash, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  return { success: true, active: true, created: !existing, returning: Boolean(existing), welcomePending: true } as const;
}

async function markWelcomeSent(email: string) {
  const c = await subscribersCollection();
  if (!c) return;
  await c.updateOne({ email }, { $set: { welcomeSentAt: new Date(), updatedAt: new Date() } });
}

async function disableSubscription(unsubscribeTokenHash: string) {
  const c = await subscribersCollection();
  if (!c) return false;
  const result = await c.updateOne(
    { unsubscribeTokenHash, active: true },
    { $set: { active: false, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

async function activeSubscribers() {
  const c = await subscribersCollection();
  if (!c) return [];
  return (await c.find({ active: true }).sort({ createdAt: 1 }).toArray()).map(d => ({ email: String(d.email) }));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function tokenForEmail(email: string) {
  const secret = ENV.newsletterTokenSecret || ENV.cookieSecret;
  return createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex");
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function bodyToHtml(body: string) {
  return escapeHtml(body)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:12px;" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");
}

function publicUrl(path: string) {
  return `${ENV.publicBaseUrl.replace(/\/$/, "")}${path}`;
}

async function sendEmail(to: string, subject: string, html: string, idempotencyKey: string) {
  if (!ENV.resendApiKey) {
    return { sent: false, skipped: true, message: "RESEND_API_KEY가 설정되지 않았습니다." };
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: ENV.newsletterFrom,
      to: [to],
      subject,
      html,
      tags: [
        { name: "category", value: "newsletter" },
        { name: "source", value: "ramic-studio" },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend ${response.status}: ${detail.slice(0, 500)}`);
  }

  return { sent: true, skipped: false, message: "전송 완료" };
}

async function sendWelcomeEmail(email: string, returning: boolean) {
  const unsubscribeUrl = publicUrl(`/api/newsletter/unsubscribe?token=${tokenForEmail(email)}`);
  const eyebrow = returning ? "WELCOME BACK / RAMIC STUDIO" : "WELCOME / RAMIC STUDIO";
  const title = returning ? "다시 돌아와 주셔서\n고맙습니다." : "구독해 주셔서\n고맙습니다.";
  const intro = returning
    ? "잠시 멀리 있었던 소식함에 다시 라믹 스튜디오를 들여주셔서 감사합니다. 새로운 장면과 이야기로 다시 인사드릴 수 있어 기쁩니다."
    : "라믹 스튜디오의 새로운 소식과 우리가 만드는 세계의 다음 장면을 가장 먼저 전해드릴게요.";
  const subject = returning ? "다시 돌아와 주셔서 감사합니다 — Ramic Studio" : "라믹 스튜디오 소식 구독을 환영합니다";
  const html = `<!doctype html>
<html lang="ko">
  <body style="margin:0;background:#ecebe7;color:#171717;font-family:Arial,'Noto Sans KR',sans-serif;">
    <div style="max-width:720px;margin:0 auto;padding:24px 16px 48px;">
      <div style="display:flex;justify-content:space-between;padding:12px 6px 22px;font-size:11px;letter-spacing:.2em;color:#777;text-transform:uppercase;">
        <span>RAMIC STUDIO</span><span>LETTER 001</span>
      </div>
      <div style="overflow:hidden;background:#141414;border-radius:26px;color:#fff;box-shadow:0 18px 45px rgba(20,20,20,.13);">
        <div style="padding:54px 46px 58px;background:radial-gradient(circle at 90% 0%,#49503b 0,#252823 26%,#141414 62%);">
          <div style="font-size:11px;letter-spacing:.2em;color:#c7c9bf;text-transform:uppercase;margin-bottom:56px;">${eyebrow}</div>
          <div style="font-size:13px;letter-spacing:.12em;color:#d8ff61;margin-bottom:16px;">새로운 세계를 만드는 스튜디오</div>
          <h1 style="font-size:46px;line-height:1.1;font-weight:500;letter-spacing:-.055em;margin:0 0 24px;white-space:pre-line;">${title.replace("\n", "<br />")}</h1>
          <p style="max-width:500px;color:#d5d7d2;font-size:16px;line-height:1.85;margin:0;">${intro}</p>
        </div>
        <div style="height:7px;background:#d8ff61;"></div>
      </div>
      <div style="background:#fff;border:1px solid #e1dfd9;border-radius:0 0 26px 26px;padding:42px 46px 38px;">
        <div style="font-size:11px;letter-spacing:.17em;color:#85857f;text-transform:uppercase;margin-bottom:18px;">A NOTE FROM RAMIC STUDIO</div>
        <p style="font-size:20px;line-height:1.65;letter-spacing:-.03em;margin:0 0 20px;color:#222;">안녕하세요. 라믹 스튜디오입니다.</p>
        <p style="font-size:15px;line-height:2;margin:0;color:#555;">우리는 플레이어의 하루에 오래 남는 장면과, 아직 가보지 않은 세계를 만들고 있습니다. 앞으로 게임과 프로젝트의 소식, 제작 과정에서 발견한 작은 영감, 스튜디오가 준비하는 다음 이야기를 천천히 그리고 정성껏 전해드리겠습니다.</p>
        <div style="margin:34px 0;padding:22px 24px;background:#f4f4ef;border-left:4px solid #d8ff61;">
          <div style="font-size:11px;letter-spacing:.14em;color:#777;text-transform:uppercase;margin-bottom:9px;">WHAT YOU CAN EXPECT</div>
          <div style="font-size:14px;line-height:1.9;color:#3d3d3a;">새로운 공지 · 프로젝트 업데이트 · 만드는 사람들의 이야기</div>
        </div>
        <div style="height:1px;background:#e9e7e2;margin:30px 0;"></div>
        <p style="font-size:13px;line-height:1.8;color:#777;margin:0;">이 메일은 <strong style="color:#333;">${escapeHtml(email)}</strong> 주소의 구독 신청에 따라 발송되었습니다.</p>
      </div>
      <div style="padding:22px 4px;font-size:12px;line-height:1.8;color:#888;">
        새로운 소식을 더 이상 받고 싶지 않다면
        <a href="${unsubscribeUrl}" style="color:#666;">구독 취소</a>를 눌러주세요.
        <br />Ramic Studio · ramicstudio.com · Seoul / KR
      </div>
    </div>
  </body>
</html>`;
  try {
    return await sendEmail(
      email,
      subject,
      html,
      `welcome/${returning ? "returning" : "new"}/${createHash("sha256").update(email).digest("hex")}`
    );
  } catch (error) {
    console.error("[Newsletter] welcome email failed:", email, error instanceof Error ? error.message : error);
    return { sent: false, skipped: false, failed: true, message: "환영 메일 전송에 실패했습니다." };
  }
}

export async function subscribeToNewsletter(email: string) {
  const normalized = normalizeEmail(email);
  const token = tokenForEmail(normalized);
  const result = await saveSubscription(normalized, tokenHash(token));
  if (!result.success || !result.welcomePending) return result;
  const welcome = await sendWelcomeEmail(normalized, result.returning);
  if (welcome.sent) await markWelcomeSent(normalized);
  return { ...result, welcome };
}

export async function unsubscribeFromNewsletter(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return false;
  return disableSubscription(tokenHash(token));
}

export async function sendNoticeNewsletter(notice: Notice) {
  const subscribers = await activeSubscribers();
  if (!subscribers.length) {
    return { sent: 0, failed: 0, skipped: true, total: 0, message: "활성 구독자가 없습니다." };
  }
  if (!ENV.resendApiKey) {
    return { sent: 0, failed: 0, skipped: true, total: subscribers.length, message: "RESEND_API_KEY가 설정되지 않아 이메일을 보내지 않았습니다." };
  }

  const noticeUrl = publicUrl(`/news/${encodeURIComponent(notice.id)}`);
  let sent = 0;
  let failed = 0;

  const sendOne = async (email: string) => {
    const unsubscribeUrl = publicUrl(`/api/newsletter/unsubscribe?token=${tokenForEmail(email)}`);
    const html = `<!doctype html>
<html lang="ko">
  <body style="margin:0;background:#f4f3ef;color:#151515;font-family:Arial,'Noto Sans KR',sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:48px 20px;">
      <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:28px;">RAMIC STUDIO / NEWS</div>
      <div style="background:#fff;padding:36px 32px;border:1px solid #e6e4df;border-radius:18px;">
        <div style="font-size:12px;letter-spacing:.12em;color:#777;margin-bottom:12px;">${escapeHtml(notice.category)}</div>
        <h1 style="font-size:30px;line-height:1.25;margin:0 0 22px;">${escapeHtml(notice.title)}</h1>
        <div style="font-size:15px;line-height:1.8;color:#444;">${bodyToHtml(notice.body)}</div>
        <p style="margin:30px 0 0;">
          <a href="${noticeUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 18px;border-radius:999px;">공지사항 보기 ↗</a>
        </p>
      </div>
      <div style="padding:22px 4px;font-size:12px;line-height:1.7;color:#888;">
        새로운 세계와 라믹 스튜디오 소식을 가끔 보내드립니다.<br />
        더 이상 소식을 받고 싶지 않다면
        <a href="${unsubscribeUrl}" style="color:#666;">구독 취소</a>를 눌러주세요.
      </div>
    </div>
  </body>
</html>`;

    try {
      await sendEmail(
        email,
        `[Ramic Studio] ${notice.title}`,
        html,
        `newsletter/${notice.id}/${createHash("sha256").update(email).digest("hex")}`
      );
      sent++;
    } catch (error) {
      failed++;
      console.error("[Newsletter] send failed:", email, error instanceof Error ? error.message : error);
    }
  };

  const concurrency = 5;
  for (let i = 0; i < subscribers.length; i += concurrency) {
    await Promise.all(subscribers.slice(i, i + concurrency).map(s => sendOne(s.email)));
  }

  return {
    sent,
    failed,
    skipped: false,
    total: subscribers.length,
    message: `이메일 ${sent}건 전송 완료${failed ? `, ${failed}건 실패` : ""}.`,
  };
}
