export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  mongoUri: process.env.MONGODB_URI ?? "",
  mongoDb: process.env.MONGODB_DB ?? "ramic_studio",
  adminUsername: process.env.ADMIN_USERNAME ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",\n  resendApiKey: process.env.RESEND_API_KEY ?? "",\n  newsletterFrom: process.env.NEWSLETTER_FROM ?? "Ramic Studio <news@ramicstudio.com>",\n  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "https://ramicstudio.com",\n  newsletterTokenSecret: process.env.NEWSLETTER_TOKEN_SECRET ?? process.env.JWT_SECRET ?? "",
};
