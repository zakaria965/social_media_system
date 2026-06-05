import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      plan?: "FREE" | "PRO"
      subscriptionStatus?: "ACTIVE" | "CANCELLED" | "EXPIRED"
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    plan?: "FREE" | "PRO"
    subscriptionStatus?: "ACTIVE" | "CANCELLED" | "EXPIRED"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    plan?: "FREE" | "PRO"
    subscriptionStatus?: "ACTIVE" | "CANCELLED" | "EXPIRED"
  }
}
