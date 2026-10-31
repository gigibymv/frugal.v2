import { betterAuth, type BetterAuthOptions } from "better-auth";

export interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  AUTH_ORIGIN?: string;
}

export const PRODUCTION_ORIGIN = "https://frugal-v2.pages.dev";

export function authOrigin(env: Env): string {
  const origin = env.AUTH_ORIGIN || PRODUCTION_ORIGIN;
  if (origin === PRODUCTION_ORIGIN) return origin;
  const url = new URL(origin);
  // An explicit local origin supports Wrangler without trusting request headers.
  if (url.origin === origin && url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return origin;
  throw new Error("Invalid authentication origin configuration");
}

export function authOptions(env: Env): BetterAuthOptions {
  const baseURL = authOrigin(env);
  if (!env.DB || typeof env.AUTH_SECRET !== "string" || env.AUTH_SECRET.length < 32) {
    throw new Error("Authentication is not configured");
  }
  return {
    appName: "Frugal",
    baseURL,
    basePath: "/api/auth",
    secret: env.AUTH_SECRET,
    database: env.DB,
    trustedOrigins: [baseURL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 120,
      customRules: {
        "/sign-in/email": { window: 60, max: 8 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: baseURL.startsWith("https:"),
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
    },
    user: { deleteUser: { enabled: false }, changeEmail: { enabled: false } },
    logger: { disabled: true },
  };
}

export function createAuth(env: Env) {
  return betterAuth(authOptions(env));
}
