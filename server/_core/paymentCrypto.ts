import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { ENV } from "./env";

function key() {
  if (!ENV.paymentEncryptionKey)
    throw new Error("PAYMENT_DATA_ENCRYPTION_KEY가 설정되지 않았습니다.");
  return createHash("sha256").update(ENV.paymentEncryptionKey).digest();
}

export function encryptPaymentData(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptPaymentData(value: string) {
  const [ivRaw, tagRaw, dataRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !dataRaw)
    throw new Error("암호화 데이터 형식이 올바르지 않습니다.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivRaw, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function lookupHash(value: string) {
  return createHmacLike(value.trim().toLowerCase());
}

function createHmacLike(value: string) {
  return createHash("sha256")
    .update(`${ENV.paymentEncryptionKey}:${value}`)
    .digest("hex");
}
