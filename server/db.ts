import {
  MongoClient,
  type Collection,
  type Db,
  type Document,
  ObjectId,
} from "mongodb";
import type {
  Game,
  Faq,
  InsertNotice,
  Notice,
  SiteSettings,
  TeamMember,
  User,
  InsertUser,
  SocialLink,
  BusinessInfo,
  PaymentOrder,
  SteamKeyInventory,
} from "../shared/types";
import { ENV } from "./_core/env";
import { signedPreviewUrl } from "./_core/previewAccess";
const defaultBusinessInfo: BusinessInfo = {
  businessName: "라믹 스튜디오",
  representative: "대표자명 입력 필요",
  businessNumber: "522-28-01731",
  ecommerceRegistration: "통신판매업 신고번호 입력 필요",
  address: "사업장 주소 입력 필요",
  phone: "전화번호 입력 필요",
  email: "이메일 입력 필요",
  verificationUrl: "https://www.hometax.go.kr/",
};
const defaultTermsBody = `제1조 (목적)
이 약관은 라믹 스튜디오(이하 "회사")가 제공하는 웹사이트, 게임, 디지털 콘텐츠 및 관련 서비스의 이용 조건과 절차를 규정합니다.

제2조 (서비스의 내용)
회사는 게임 콘텐츠, 웹 체험판, 공지사항, 문의 및 디지털 상품 판매 서비스를 제공합니다. 서비스의 내용과 운영 시간은 회사의 사정에 따라 변경될 수 있으며, 중요한 변경은 사이트를 통해 안내합니다.

제3조 (회원 및 이용자의 의무)
이용자는 관계 법령, 본 약관, 개인정보처리방침 및 서비스 안내를 준수해야 합니다. 타인의 정보를 도용하거나 서비스 운영을 방해하는 행위, 구매한 콘텐츠의 키를 무단으로 재판매·공유하는 행위는 금지됩니다.

제4조 (디지털 상품의 구매와 제공)
결제가 완료되고 승인되면 디지털 상품 또는 게임 키를 구매 시 입력한 이메일로 제공합니다. 이메일 주소 오기입, 스팸 차단 등 이용자의 사유로 수신하지 못한 경우 이용자가 고객센터로 문의해야 합니다.

제5조 (결제·취소·환불)
결제는 토스페이먼츠를 통해 처리됩니다. 환불 및 청약철회 가능 여부는 디지털 상품의 제공·사용 여부와 관계 법령 및 별도 환불정책에 따라 판단합니다. 환불 문의는 문의하기 채널로 접수해 주세요.

제6조 (서비스 이용 제한)
회사는 보안, 운영, 법령 준수를 위해 필요한 경우 사전 통지 후 또는 긴급한 경우 사후 통지로 서비스 이용을 제한할 수 있습니다.

제7조 (면책)
회사는 천재지변, 통신 장애 또는 회사가 합리적으로 통제하기 어려운 사유로 발생한 서비스 중단에 대해 고의 또는 중대한 과실이 없는 한 책임을 부담하지 않습니다.

제8조 (준거법 및 관할)
본 약관은 대한민국 법령에 따라 해석되며, 회사와 이용자 사이에 분쟁이 발생하면 관련 법령이 정하는 절차에 따릅니다.

시행일: 2026년 10월 11일
※ 사업자명, 대표자, 환불정책 및 실제 운영 정보는 관리자 설정에서 사업 개시 전에 확정해 주세요.`;
const defaultPrivacyBody = `라믹 스튜디오(이하 "회사")는 개인정보 보호법 등 관련 법령을 준수합니다. 본 개인정보처리방침은 회사가 운영하는 웹사이트와 게임 구매 서비스에 적용됩니다.

1. 수집하는 개인정보
게임 구매 시 이름, 이메일 주소, 전화번호를 필수로 수집합니다. 문의·뉴스레터 이용 시 이용자가 입력한 이메일 또는 문의 내용을 수집할 수 있습니다. 결제 과정은 토스페이먼츠가 처리하며, 회사는 결제 승인에 필요한 주문번호·결제키·결제금액·결제수단 상태를 보관합니다.

2. 이용 목적
수집한 정보는 주문 확인, 결제 승인, 디지털 상품 및 스팀키 발송, 문의 응대, 환불·분쟁 처리, 부정 이용 방지와 서비스 운영을 위해 사용합니다.

3. 보유 및 이용 기간
구매·결제 기록은 전자상거래 관련 법령이 정하는 기간 동안 보관합니다. 그 외 개인정보는 이용 목적이 달성되거나 이용자의 삭제 요청이 처리되면 지체 없이 파기합니다. 법령에 따라 보관이 필요한 경우 해당 기간 동안 안전하게 분리 보관합니다.

4. 처리 및 보호 조치
이름·이메일·전화번호와 스팀키는 서버에서 암호화하여 저장하고, 관리자 인증을 거친 운영자만 필요한 범위에서 조회할 수 있습니다. 전송 구간은 HTTPS 사용을 원칙으로 하며, 접근 기록과 권한을 관리합니다.

5. 제3자 제공 및 처리위탁
결제 처리를 위해 토스페이먼츠에 결제 관련 정보가 전달될 수 있으며, 이메일 발송을 위해 회사가 사용하는 이메일 발송 서비스에 수신자 이메일과 발송 내용이 전달될 수 있습니다. 각 서비스의 개인정보 처리방침과 국외 이전 여부는 실제 계약·설정에 따라 최신 정보로 갱신합니다.

6. 이용자의 권리
이용자는 개인정보 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다. 요청은 문의하기 채널 또는 관리자 설정에 등록된 이메일로 접수하며, 본인 확인 후 관련 법령에 따라 처리합니다.

7. 개인정보 보호책임자
사업자명, 대표자, 개인정보 보호책임자 이름·연락처는 관리자 설정에서 실제 운영 정보로 입력해야 합니다. 현재 공개된 사업자 정보와 연락처가 비어 있으면 서비스 운영 전에 반드시 보완해 주세요.

시행일: 2026년 10월 11일`;
type AnyDoc = Document & Record<string, any>;
let client: MongoClient | null = null;
let database: Db | null = null;
let connecting: Promise<Db | null> | null = null;
export async function getDb(): Promise<Db | null> {
  if (database) return database;
  if (!ENV.mongoUri) return null;
  if (!connecting)
    connecting = (async () => {
      try {
        client = new MongoClient(ENV.mongoUri, {
          serverSelectionTimeoutMS: 3000,
        });
        await client.connect();
        database = client.db(ENV.mongoDb);
        await Promise.all([
          database
            .collection("users")
            .createIndex({ openId: 1 }, { unique: true }),
          database
            .collection("users")
            .createIndex({ username: 1 }, { unique: true, sparse: true }),
          database.collection("notices").createIndex({ publishedAt: -1 }),
          database
            .collection("faqs")
            .createIndex({ sortOrder: 1, createdAt: -1 }),
          database.collection("games").createIndex({ createdAt: -1 }),
          database.collection("team").createIndex({ sortOrder: 1 }),
          database.collection("security_logs").createIndex({ createdAt: -1 }),
          database
            .collection("payment_orders")
            .createIndex({ orderId: 1 }, { unique: true }),
          database.collection("payment_orders").createIndex({ createdAt: -1 }),
          database
            .collection("payment_orders")
            .createIndex({ customerEmailHash: 1 }),
          database
            .collection("steam_keys")
            .createIndex({ gameId: 1, status: 1 }),
          database
            .collection("steam_keys")
            .createIndex({ orderId: 1 }, { sparse: true }),
        ]);
        return database;
      } catch (error) {
        console.warn(
          "[MongoDB] unavailable:",
          error instanceof Error ? error.message : error
        );
        await client?.close().catch(() => undefined);
        client = null;
        return null;
      } finally {
        connecting = null;
      }
    })();
  return connecting;
}
async function col<T extends AnyDoc>(
  name: string
): Promise<Collection<T> | null> {
  const db = await getDb();
  return db ? db.collection<T>(name) : null;
}
const date = (v: any) => (v instanceof Date ? v : new Date(v));
function id(v: any) {
  return String(v?._id ?? v?.id ?? "");
}
export function normalizeMongoUser(d: AnyDoc): User {
  return {
    id: id(d),
    openId: d.openId,
    name: d.name ?? null,
    email: d.email ?? null,
    loginMethod: d.loginMethod ?? null,
    role: d.role === "admin" ? "admin" : "user",
    createdAt: date(d.createdAt),
    updatedAt: date(d.updatedAt),
    lastSignedIn: date(d.lastSignedIn),
  };
}
const normalizeFaq = (d: AnyDoc): Faq => ({
  id: id(d),
  question: d.question ?? "",
  answer: d.answer ?? "",
  category: d.category ?? "GENERAL",
  sortOrder: Number(d.sortOrder ?? 0),
  isPublished: d.isPublished !== false,
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
const normalizeNotice = (d: AnyDoc): Notice => ({
  id: id(d),
  category: d.category,
  title: d.title,
  body: d.body,
  coverUrl: d.coverUrl ?? null,
  publishedAt: date(d.publishedAt),
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
export function createNoticeDocument(input: InsertNotice) {
  const now = new Date();
  return {
    category: input.category,
    title: input.title.trim(),
    body: input.body.trim(),
    coverUrl: input.coverUrl ?? null,
    publishedAt: input.publishedAt ?? now,
    createdAt: now,
    updatedAt: now,
  };
}
const normalizeGame = (d: AnyDoc, protectPreview = false): Game => ({
  id: id(d),
  code: d.code,
  title: d.title,
  description: d.description ?? "",
  genre: d.genre ?? "",
  status: d.status ?? "개발 중",
  imageUrl: d.imageUrl ?? "",
  videoUrl: d.videoUrl ?? null,
  externalUrl: d.externalUrl ?? null,
  externalLabel: d.externalLabel ?? "STEAM",
  isNew: Boolean(d.isNew),
  previewUrl: protectPreview
    ? signedPreviewUrl(d.previewUrl)
    : (d.previewUrl ?? null),
  priceKRW: d.priceKRW == null ? null : Number(d.priceKRW),
  isPurchasable: Boolean(d.isPurchasable && Number(d.priceKRW) > 0),
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
const normalizeTeam = (d: AnyDoc): TeamMember => ({
  id: id(d),
  name: d.name,
  role: d.role,
  bio: d.bio ?? "",
  imageUrl: d.imageUrl ?? null,
  sortOrder: d.sortOrder ?? 0,
  isPublic: d.isPublic !== false,
  createdAt: date(d.createdAt),
  updatedAt: date(d.updatedAt),
});
export async function getUserByOpenId(openId: string) {
  const c = await col("users");
  const d = await c?.findOne({ openId });
  return d ? normalizeMongoUser(d) : undefined;
}
export async function upsertUser(user: InsertUser) {
  const c = await col("users");
  if (!c) return;
  const now = new Date();
  await c.updateOne(
    { openId: user.openId },
    {
      $set: { ...user, updatedAt: now, lastSignedIn: user.lastSignedIn ?? now },
      $setOnInsert: { createdAt: now, role: user.role ?? "user" },
    },
    { upsert: true }
  );
}
export async function getAdminByUsername(username: string) {
  const c = await col("users");
  return (await c?.findOne({ username, role: "admin" })) ?? null;
}
export async function ensureAdminAccount(
  username: string,
  passwordHash: string
) {
  const c = await col("users");
  if (!c) return;
  const now = new Date();
  await c.updateOne(
    { username },
    {
      $setOnInsert: {
        username,
        passwordHash,
        role: "admin",
        name: "Ramic Studio Admin",
        openId: `admin:${username}`,
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      },
    },
    { upsert: true }
  );
}
export async function listNotices() {
  const c = await col("notices");
  return c
    ? (await c.find({}).sort({ publishedAt: -1 }).limit(100).toArray()).map(
        normalizeNotice
      )
    : [];
}
export async function getNotice(idValue: string) {
  const c = await col("notices");
  const d = c
    ? await c.findOne({
        _id: ObjectId.isValid(idValue) ? new ObjectId(idValue) : idValue,
      } as any)
    : null;
  return d ? normalizeNotice(d) : null;
}
export async function createNotice(input: InsertNotice) {
  const c = await col("notices");
  if (!c) return null;
  const d = createNoticeDocument(input);
  const r = await c.insertOne(d);
  return normalizeNotice({ ...d, _id: r.insertedId });
}
function documentId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : value;
}
export async function updateNotice(idValue: string, input: InsertNotice) {
  const c = await col("notices");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    {
      $set: {
        category: input.category,
        title: input.title.trim(),
        body: input.body.trim(),
        coverUrl: input.coverUrl ?? null,
        publishedAt: input.publishedAt ?? new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  return result ? normalizeNotice(result) : null;
}
export async function deleteNotice(idValue: string) {
  const c = await col("notices");
  if (!c) return false;
  return (
    (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0
  );
}
export async function listFaqs(publicOnly = false) {
  const c = await col("faqs");
  if (!c) return [];
  const filter = publicOnly ? { isPublished: { $ne: false } } : {};
  return (
    await c
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(200)
      .toArray()
  ).map(normalizeFaq);
}
export async function createFaq(
  input: Omit<Faq, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("faqs");
  if (!c) return null;
  const now = new Date();
  const d = {
    ...input,
    question: input.question.trim(),
    answer: input.answer.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const r = await c.insertOne(d);
  return normalizeFaq({ ...d, _id: r.insertedId });
}
export async function updateFaq(
  idValue: string,
  input: Omit<Faq, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("faqs");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    {
      $set: {
        ...input,
        question: input.question.trim(),
        answer: input.answer.trim(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
  return result ? normalizeFaq(result) : null;
}
export async function deleteFaq(idValue: string) {
  const c = await col("faqs");
  if (!c) return false;
  return (
    (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0
  );
}
export async function listGames(protectPreview = false) {
  const c = await col("games");
  return c
    ? (await c.find({}).sort({ createdAt: -1 }).toArray()).map(d =>
        normalizeGame(d, protectPreview)
      )
    : [];
}
function singleGameMedia(input: Omit<Game, "id" | "createdAt" | "updatedAt">) {
  return input.videoUrl
    ? { ...input, imageUrl: "", videoUrl: input.videoUrl }
    : { ...input, imageUrl: input.imageUrl ?? "", videoUrl: null };
}
export async function createGame(
  input: Omit<Game, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("games");
  if (!c) return null;
  const now = new Date();
  const d = { ...singleGameMedia(input), createdAt: now, updatedAt: now };
  const r = await c.insertOne(d);
  return normalizeGame({ ...d, _id: r.insertedId });
}
export async function updateGame(
  idValue: string,
  input: Omit<Game, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("games");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    { $set: { ...singleGameMedia(input), updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? normalizeGame(result) : null;
}
export async function deleteGame(idValue: string) {
  const c = await col("games");
  if (!c) return false;
  return (
    (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0
  );
}
export async function listTeam() {
  const c = await col("team");
  return c
    ? (
        await c
          .find({ isPublic: { $ne: false } })
          .sort({ sortOrder: 1 })
          .toArray()
      ).map(normalizeTeam)
    : [];
}
export async function createTeam(
  input: Omit<TeamMember, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("team");
  if (!c) return null;
  const now = new Date();
  const d = { ...input, createdAt: now, updatedAt: now };
  const r = await c.insertOne(d);
  return normalizeTeam({ ...d, _id: r.insertedId });
}
export async function listAllTeam() {
  const c = await col("team");
  return c
    ? (await c.find({}).sort({ sortOrder: 1, createdAt: 1 }).toArray()).map(
        normalizeTeam
      )
    : [];
}
export async function updateTeam(
  idValue: string,
  input: Omit<TeamMember, "id" | "createdAt" | "updatedAt">
) {
  const c = await col("team");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    { $set: { ...input, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? normalizeTeam(result) : null;
}
export async function deleteTeam(idValue: string) {
  const c = await col("team");
  if (!c) return false;
  return (
    (await c.deleteOne({ _id: documentId(idValue) } as any)).deletedCount > 0
  );
}
function legacySocialLinks(d: AnyDoc | null | undefined): SocialLink[] {
  return [
    { label: "인스타그램", url: d?.instagramUrl ?? "" },
    { label: "유튜브", url: d?.youtubeUrl ?? "" },
    { label: "디스코드", url: d?.discordUrl ?? "" },
    { label: "스팀", url: d?.steamUrl ?? "" },
  ].filter(link => link.url);
}
export async function getSettings(): Promise<SiteSettings> {
  const c = await col("settings");
  const d = await c?.findOne({ _id: "site" } as any);
  return {
    id: "site",
    logoUrl: d?.logoUrl ?? "/assets/RamicStudio.svg",
    instagramUrl: d?.instagramUrl ?? "",
    youtubeUrl: d?.youtubeUrl ?? "",
    discordUrl: d?.discordUrl ?? "",
    steamUrl: d?.steamUrl ?? "",
    socialLinks: Array.isArray(d?.socialLinks)
      ? d.socialLinks
          .map((link: any) => ({
            label: String(link.label ?? "").trim(),
            url: String(link.url ?? "").trim(),
          }))
          .filter((link: SocialLink) => link.label && link.url)
      : legacySocialLinks(d),
    footerText: d?.footerText ?? "© 2026 RAMIC STUDIO. 호기심으로 만듭니다.",
    businessInfo: { ...defaultBusinessInfo, ...(d?.businessInfo ?? {}) },
    termsTitle: d?.termsTitle ?? "이용약관",
    termsBody: d?.termsBody ?? defaultTermsBody,
    privacyTitle: d?.privacyTitle ?? "개인정보처리방침",
    privacyBody: d?.privacyBody ?? defaultPrivacyBody,
    updatedAt: date(d?.updatedAt ?? new Date()),
  };
}
export async function saveSettings(input: Partial<SiteSettings>) {
  const c = await col("settings");
  if (!c) return getSettings();
  const now = new Date();
  await c.updateOne(
    { _id: "site" } as any,
    { $set: { ...input, updatedAt: now } },
    { upsert: true }
  );
  return getSettings();
}
export async function addAdmin(
  username: string,
  passwordHash: string,
  name: string
) {
  const c = await col("users");
  if (!c) return;
  const now = new Date();
  await c.updateOne(
    { username },
    {
      $set: { username, passwordHash, name, role: "admin", updatedAt: now },
      $setOnInsert: {
        openId: `admin:${username}`,
        createdAt: now,
        lastSignedIn: now,
      },
    },
    { upsert: true }
  );
}
export async function changeAdminPassword(
  username: string,
  passwordHash: string
) {
  const c = await col("users");
  if (c)
    await c.updateOne(
      { username, role: "admin" },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
}
export type SecurityEvent = {
  event: string;
  username?: string;
  actor?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  detail?: string;
  createdAt: Date;
};
export async function writeSecurityLog(
  input: Omit<SecurityEvent, "createdAt">
) {
  const c = await col("security_logs");
  if (!c) return;
  await c.insertOne({ ...input, createdAt: new Date() });
}
export async function listSecurityLogs(limit = 100) {
  const c = await col("security_logs");
  if (!c) return [];
  return (
    await c
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 200))
      .toArray()
  ).map(d => ({
    id: id(d),
    event: String(d.event ?? "unknown"),
    username: d.username ?? "",
    actor: d.actor ?? "",
    ip: d.ip ?? "",
    userAgent: d.userAgent ?? "",
    path: d.path ?? "",
    detail: d.detail ?? "",
    createdAt: date(d.createdAt),
  }));
}

function normalizePaymentOrder(d: AnyDoc) {
  return {
    id: id(d),
    orderId: String(d.orderId),
    gameId: String(d.gameId),
    gameTitle: String(d.gameTitle ?? ""),
    amount: Number(d.amount ?? 0),
    status: d.status ?? "PENDING",
    customerName: String(d.customerName ?? ""),
    customerEmail: String(d.customerEmail ?? ""),
    customerPhone: String(d.customerPhone ?? ""),
    customerEmailHash: String(d.customerEmailHash ?? ""),
    paymentKey: d.paymentKey ?? null,
    paymentMethod: d.paymentMethod ?? null,
    steamKey: d.steamKey ?? null,
    failureCode: d.failureCode ?? null,
    createdAt: date(d.createdAt),
    paidAt: d.paidAt ? date(d.paidAt) : null,
    fulfilledAt: d.fulfilledAt ? date(d.fulfilledAt) : null,
  };
}

export async function getGameForPurchase(idValue: string) {
  const c = await col("games");
  if (!c) return null;
  const d = await c.findOne({ _id: documentId(idValue) } as any);
  if (!d) return null;
  const game = normalizeGame(d);
  return game;
}

export async function createPaymentOrder(input: {
  orderId: string;
  gameId: string;
  gameTitle: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerEmailHash: string;
}) {
  const c = await col("payment_orders");
  if (!c) return null;
  const now = new Date();
  const d = { ...input, status: "PENDING", createdAt: now, updatedAt: now };
  const result = await c.insertOne(d);
  return normalizePaymentOrder({ ...d, _id: result.insertedId });
}

export async function getPaymentOrderByOrderId(orderId: string) {
  const c = await col("payment_orders");
  const d = await c?.findOne({ orderId });
  return d ? normalizePaymentOrder(d) : null;
}

export async function getPaymentOrder(idValue: string) {
  const c = await col("payment_orders");
  const d = await c?.findOne({ _id: documentId(idValue) } as any);
  return d ? normalizePaymentOrder(d) : null;
}

export async function updatePaymentOrder(
  orderId: string,
  patch: Record<string, unknown>
) {
  const c = await col("payment_orders");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { orderId },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result ? normalizePaymentOrder(result) : null;
}

export async function allocateSteamKey(gameId: string, orderId: string) {
  const c = await col("steam_keys");
  if (!c) return null;
  const result = await c.findOneAndUpdate(
    { gameId, status: "AVAILABLE" },
    {
      $set: {
        status: "SOLD",
        orderId,
        soldAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { sort: { createdAt: 1 }, returnDocument: "after" }
  );
  return result
    ? { ...result, encryptedKey: String(result.encryptedKey) }
    : null;
}

export async function createSteamKey(input: {
  gameId: string;
  encryptedKey: string;
}) {
  const c = await col("steam_keys");
  if (!c) return null;
  const now = new Date();
  const d = {
    gameId: input.gameId,
    encryptedKey: input.encryptedKey,
    status: "AVAILABLE",
    createdAt: now,
    updatedAt: now,
  };
  const result = await c.insertOne(d);
  return {
    id: String(result.insertedId),
    gameId: d.gameId,
    status: d.status,
    createdAt: now,
  };
}

export async function listSteamKeys() {
  const c = await col("steam_keys");
  if (!c) return [];
  const games = await col("games");
  const gameDocs = games
    ? await games.find({}).project({ title: 1 }).toArray()
    : [];
  const titles = new Map(
    gameDocs.map(g => [String(g._id), String(g.title ?? "")])
  );
  return (await c.find({}).sort({ createdAt: -1 }).limit(1000).toArray()).map(
    d => ({
      id: id(d),
      gameId: String(d.gameId),
      gameTitle: titles.get(String(d.gameId)) ?? "",
      status: d.status,
      encryptedKey: String(d.encryptedKey),
      orderId: d.orderId ?? null,
      createdAt: date(d.createdAt),
      soldAt: d.soldAt ? date(d.soldAt) : null,
    })
  );
}

export async function updateSteamKey(
  idValue: string,
  input: {
    gameId?: string;
    encryptedKey?: string;
    status?: "AVAILABLE" | "SOLD" | "REVOKED";
  }
) {
  const c = await col("steam_keys");
  if (!c) return null;
  const patch = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
  const result = await c.findOneAndUpdate(
    { _id: documentId(idValue) } as any,
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return result
    ? {
        id: id(result),
        gameId: String(result.gameId),
        status: result.status,
        encryptedKey: String(result.encryptedKey),
      }
    : null;
}

export async function deleteSteamKey(idValue: string) {
  const c = await col("steam_keys");
  if (!c) return false;
  return (
    (
      await c.deleteOne({
        _id: documentId(idValue),
        status: "AVAILABLE",
      } as any)
    ).deletedCount > 0
  );
}

export async function listPaymentOrders() {
  const c = await col("payment_orders");
  if (!c) return [];
  return (await c.find({}).sort({ createdAt: -1 }).limit(500).toArray()).map(
    normalizePaymentOrder
  );
}

export async function listPaymentStats() {
  const c = await col("payment_orders");
  if (!c)
    return {
      total: 0,
      paid: 0,
      fulfilled: 0,
      revenue: 0,
      pending: 0,
      daily: [],
    };
  const [summary, daily] = await Promise.all([
    c
      .aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            paid: {
              $sum: {
                $cond: [{ $in: ["$status", ["PAID", "FULFILLED"]] }, 1, 0],
              },
            },
            fulfilled: {
              $sum: { $cond: [{ $eq: ["$status", "FULFILLED"] }, 1, 0] },
            },
            revenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["PAID", "FULFILLED"]] },
                  "$amount",
                  0,
                ],
              },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray(),
    c
      .aggregate([
        { $match: { status: { $in: ["PAID", "FULFILLED"] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 31 },
      ])
      .toArray(),
  ]);
  return {
    ...(summary[0] ?? {
      total: 0,
      paid: 0,
      fulfilled: 0,
      revenue: 0,
      pending: 0,
    }),
    daily: daily.map(d => ({
      date: d._id,
      orders: d.orders,
      revenue: d.revenue,
    })),
  };
}
