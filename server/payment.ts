import { randomUUID } from "crypto";
import { ENV } from "./_core/env";
import {
  decryptPaymentData,
  encryptPaymentData,
  lookupHash,
} from "./_core/paymentCrypto";
import {
  allocateSteamKey,
  createPaymentOrder,
  createSteamKey,
  deleteSteamKey,
  getGameForPurchase,
  getPaymentOrder,
  getPaymentOrderByOrderId,
  listPaymentOrders,
  listPaymentStats,
  listSteamKeys,
  updateSteamKey,
  updatePaymentOrder,
} from "./db";

const TOSS_API = "https://api.tosspayments.com/v1";

function tossHeaders() {
  if (!ENV.tossSecretKey)
    throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
  return {
    Authorization: `Basic ${Buffer.from(`${ENV.tossSecretKey}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

function validateCustomer(name: string, email: string, phone: string) {
  const normalized = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.replace(/[\s-]/g, ""),
  };
  if (normalized.name.length < 2 || normalized.name.length > 100)
    throw new Error("이름을 확인해 주세요.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email))
    throw new Error("이메일 주소를 확인해 주세요.");
  if (!/^01[016789]\d{7,8}$/.test(normalized.phone))
    throw new Error("휴대폰 번호를 확인해 주세요.");
  return normalized;
}

export async function startPayment(input: {
  gameId: string;
  name: string;
  email: string;
  phone: string;
}) {
  if (!ENV.tossClientKey || !ENV.tossSecretKey)
    throw new Error("토스 테스트 키가 아직 서버에 설정되지 않았습니다.");
  if (!ENV.paymentEncryptionKey)
    throw new Error("결제 데이터 암호화 키가 아직 서버에 설정되지 않았습니다.");
  const game = await getGameForPurchase(input.gameId);
  if (!game || !game.isPurchasable || !game.priceKRW)
    throw new Error("현재 구매할 수 없는 게임입니다.");
  const customer = validateCustomer(input.name, input.email, input.phone);
  const orderId = `RAMIC-${randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const order = await createPaymentOrder({
    orderId,
    gameId: game.id,
    gameTitle: game.title,
    amount: game.priceKRW,
    customerName: encryptPaymentData(customer.name),
    customerEmail: encryptPaymentData(customer.email),
    customerPhone: encryptPaymentData(customer.phone),
    customerEmailHash: lookupHash(customer.email),
  });
  if (!order) throw new Error("주문을 저장하지 못했습니다.");
  return {
    orderId,
    clientKey: ENV.tossClientKey,
    amount: game.priceKRW,
    gameTitle: game.title,
  };
}

export async function confirmPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  const order = await getPaymentOrderByOrderId(input.orderId);
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  if (order.status === "PAID" || order.status === "FULFILLED")
    return publicOrder(order);
  if (order.amount !== input.amount)
    throw new Error("결제 금액이 주문 금액과 일치하지 않습니다.");
  const response = await fetch(`${TOSS_API}/payments/confirm`, {
    method: "POST",
    headers: { ...tossHeaders(), "Idempotency-Key": input.orderId },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    await updatePaymentOrder(input.orderId, {
      status: "FAILED",
      failureCode: result.code ?? "TOSS_CONFIRM_FAILED",
    });
    throw new Error(result.message || "결제 승인에 실패했습니다.");
  }
  const updated = await updatePaymentOrder(input.orderId, {
    status: "PAID",
    paymentKey: result.paymentKey,
    paymentMethod: result.method ?? "CARD",
    paidAt: new Date(),
  });
  if (!updated) throw new Error("결제 상태 저장에 실패했습니다.");
  const key = await allocateSteamKey(order.gameId, input.orderId);
  if (key) {
    await updatePaymentOrder(input.orderId, {
      status: "FULFILLED",
      steamKey: key.encryptedKey,
      fulfilledAt: new Date(),
    });
    const delivery = await sendSteamKeyEmail({
      email: decryptPaymentData(order.customerEmail),
      name: decryptPaymentData(order.customerName),
      gameTitle: order.gameTitle,
      steamKey: decryptPaymentData(key.encryptedKey),
      orderId: order.orderId,
    });
    await updatePaymentOrder(input.orderId, {
      deliveryEmailStatus: delivery.sent ? "SENT" : "PENDING",
      deliveryError: delivery.sent ? null : delivery.message,
    });
  }
  return publicOrder({
    ...updated,
    status: key ? "FULFILLED" : "PAID",
    hasSteamKey: Boolean(key),
  });
}

async function sendSteamKeyEmail(input: {
  email: string;
  name: string;
  gameTitle: string;
  steamKey: string;
  orderId: string;
}) {
  if (!ENV.resendApiKey)
    return { sent: false, message: "RESEND_API_KEY가 설정되지 않았습니다." };
  const escape = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `steam-key/${input.orderId}`,
    },
    body: JSON.stringify({
      from: ENV.newsletterFrom,
      to: [input.email],
      subject: `[Ramic Studio] ${input.gameTitle} 스팀키가 도착했습니다`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:40px;color:#171717"><p style="letter-spacing:.15em;color:#777">RAMIC STUDIO / PURCHASE</p><h1>${escape(input.gameTitle)}<br/>STEAM KEY</h1><p>${escape(input.name)}님, 구매해 주셔서 감사합니다.</p><div style="padding:24px;background:#f2f4e9;border-left:4px solid #cbff4d;font:600 20px monospace;letter-spacing:.08em">${escape(input.steamKey)}</div><p style="color:#666;line-height:1.7">Steam 클라이언트에서 게임 추가를 선택한 뒤 키를 입력해 주세요.<br/>주문번호: ${escape(input.orderId)}</p></div>`,
    }),
  });
  if (!response.ok)
    return { sent: false, message: `이메일 발송 실패 (${response.status})` };
  return { sent: true, message: "이메일 발송 완료" };
}

function publicOrder(order: any) {
  return {
    orderId: order.orderId,
    gameTitle: order.gameTitle,
    amount: order.amount,
    status: order.status,
    hasSteamKey: Boolean(order.hasSteamKey || order.steamKey),
  };
}

export async function handleTossWebhook(payload: any) {
  if (payload?.eventType !== "PAYMENT_STATUS_CHANGED") return;
  const data = payload.data;
  if (!data?.orderId) return;
  const order = await getPaymentOrderByOrderId(String(data.orderId));
  if (!order) return;
  if (data.status === "CANCELED" || data.status === "ABORTED") {
    await updatePaymentOrder(order.orderId, {
      status: "CANCELED",
      failureCode: data.status,
    });
  }
}

export async function adminPaymentOrders() {
  const orders = await listPaymentOrders();
  return orders.map(order => ({
    ...order,
    name: decryptPaymentData(order.customerName),
    email: decryptPaymentData(order.customerEmail),
    phone: decryptPaymentData(order.customerPhone),
    steamKey: order.steamKey ? decryptPaymentData(order.steamKey) : "",
  }));
}

export {
  createSteamKey,
  deleteSteamKey,
  listPaymentStats,
  listSteamKeys,
  updateSteamKey,
};
