export type UserRole = "user" | "admin";

export type User = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

export type InsertUser = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt">
> & {
  openId: string;
};

export type NoticeCategory = string;
export type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type Notice = {
  id: string;
  category: NoticeCategory;
  title: string;
  body: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  coverUrl?: string | null;
};
export type Game = {
  id: string;
  code: string;
  title: string;
  description: string;
  genre: string;
  status: string;
  imageUrl: string;
  videoUrl?: string | null;
  externalUrl?: string | null;
  externalLabel?: string | null;
  isNew: boolean;
  previewUrl?: string | null;
  priceKRW?: number | null;
  isPurchasable: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type PaymentOrderStatus =
  | "PENDING"
  | "PAID"
  | "FULFILLED"
  | "FAILED"
  | "CANCELED";
export type PaymentOrder = {
  id: string;
  orderId: string;
  gameId: string;
  gameTitle: string;
  amount: number;
  status: PaymentOrderStatus;
  paymentMethod?: string | null;
  paymentKey?: string | null;
  name?: string;
  email?: string;
  phone?: string;
  steamKey?: string;
  createdAt: Date;
  paidAt?: Date | null;
  fulfilledAt?: Date | null;
};
export type SteamKeyInventory = {
  id: string;
  gameId: string;
  gameTitle?: string;
  status: "AVAILABLE" | "SOLD" | "REVOKED";
  orderId?: string | null;
  steamKey?: string;
  createdAt: Date;
  soldAt?: Date | null;
};
export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl?: string | null;
  sortOrder: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type SocialLink = { label: string; url: string };
export type BusinessInfo = {
  businessName: string;
  representative: string;
  businessNumber: string;
  ecommerceRegistration: string;
  address: string;
  phone: string;
  email: string;
  verificationUrl: string;
};
export type SiteSettings = {
  id: string;
  logoUrl: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  discordUrl?: string;
  steamUrl?: string;
  socialLinks?: SocialLink[];
  footerText?: string;
  businessInfo: BusinessInfo;
  termsTitle: string;
  termsBody: string;
  privacyTitle: string;
  privacyBody: string;
  updatedAt: Date;
};
export type InsertNotice = Pick<Notice, "category" | "title" | "body"> & {
  publishedAt?: Date;
  coverUrl?: string | null;
};

export * from "./_core/errors";
