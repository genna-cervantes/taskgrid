import { betterAuth } from "better-auth";
import { pool } from "../db/db.js";

export const auth = betterAuth({
  database: pool,
  user: {
    modelName: "users",
    fields: {
      name: "username",
      email: "email",
      isGuest: "is_guest",
      emailVerified: "email_verified",
      image: "image",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "sessions",
    fields: {
      id: "id",
      userId: "user_id",
      token: "token",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  account: {
    modelName: "accounts",
    fields: {
      id: "id",
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      scope: "scope",
      idToken: "id_token",
      password: "password",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "verification",
    fields: {
      id: "id",
      identifier: "identifier",
      value: "value",
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  cors: {

  },
  trustedOrigins: [
    "http://localhost:5173",
  ],
  advanced: {
    database: {
      generateId: false,
    },
  },
});