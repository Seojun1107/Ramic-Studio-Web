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

export type InsertUser = Partial<Omit<User, "id" | "createdAt" | "updatedAt">> & {
  openId: string;
};

export type NoticeCategory = "STUDIO" | "NEON VEIL" | "CAREERS" | "COMMUNITY";
export type Notice = {
  id: string;
  category: NoticeCategory;
  title: string;
  body: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
export type InsertNotice = Pick<Notice, "category" | "title" | "body"> & {
  publishedAt?: Date;
};

export * from "./_core/errors";
