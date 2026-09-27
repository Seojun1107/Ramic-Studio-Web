import { createHash, createHmac } from "crypto";
import { ENV } from "./env";
import {
  listNewsletterSubscribers,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from "../db";
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
  if (!c) return { success: false, active: false, created: false } as const;
  const existing = await c.findOne({ email });
  if (existing?.active === true) return { success: true, active: true, created: false } as const;
  const now = new Date();
  await c.updateOne(
    { email },
    { $set: { email, active: true, unsubscribeTokenHash, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  return { success: true, active: true, created: !existing } as const;
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

export async function subscribeToNewsletter(email: string) {
  const normalized = normalizeEmail(email);
  const token = tokenForEmail(normalized);
  return saveSubscription(normalized, tokenHash(token));
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
