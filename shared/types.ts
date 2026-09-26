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

export type NoticeCategory = string;
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
export type Game = { id: string; code: string; title: string; description: string; genre: string; status: string; imageUrl: string; videoUrl?: string | null; externalUrl?: string | null; externalLabel?: string | null; isNew: boolean; previewUrl?: string | null; createdAt: Date; updatedAt: Date; };
export type TeamMember = { id: string; name: string; role: string; bio: string; imageUrl?: string | null; sortOrder: number; isPublic: boolean; createdAt: Date; updatedAt: Date; };
export type SiteSettings = { id: string; logoUrl: string; instagramUrl?: string; youtubeUrl?: string; discordUrl?: string; steamUrl?: string; footerText?: string; updatedAt: Date; };
export type InsertNotice = Pick<Notice, "category" | "title" | "body"> & {
  publishedAt?: Date;
};

export * from "./_core/errors";
