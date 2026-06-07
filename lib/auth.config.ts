import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { connectDB } from "./db"
import { User } from "./models/user"
import { Subscription } from "./models/subscription"
import { getOrCreateDefaultWorkspace } from "./workspaces"

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ??
  process.env.GOOGLE_ID ??
  process.env.AUTH_GOOGLE_ID ??
  ""

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ??
  process.env.GOOGLE_SECRET ??
  process.env.AUTH_GOOGLE_SECRET ??
  ""

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()
        const email = credentials.email.toLowerCase().trim()
        const shaPasswordHash = hashPassword(credentials.password)

        let user = await User.findOne({ email })

        if (!user) {
          // Automatic registration if the user doesn't exist yet
          const name = email.split("@")[0]
          const isGrowAdmin = email.toLowerCase() === "growadmin@gmail.com"
          user = await User.create({
            email,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            username: name,
            passwordHash: bcrypt.hashSync(credentials.password, 10),
            googleConnected: false,
            plan: "FREE",
            subscriptionStatus: "ACTIVE",
            role: isGrowAdmin ? "ADMIN" : "USER",
            status: "ACTIVE",
          })

          await Subscription.create({
            userId: user._id,
            plan: "FREE",
            status: "ACTIVE",
            billingCycle: "free",
          })

          // Securely create their default workspace as well
          await getOrCreateDefaultWorkspace(email, user.name)
        } else {
          // Check if suspended
          if (user.status === "SUSPENDED") {
            throw new Error("Your account has been suspended.")
          }

          // Verify password (supports bcrypt and sha-256 fallback)
          if (user.passwordHash) {
            const isBcrypt = user.passwordHash.startsWith("$2")
            const isValid = isBcrypt
              ? bcrypt.compareSync(credentials.password, user.passwordHash)
              : user.passwordHash === shaPasswordHash

            if (!isValid) {
              return null
            }

            // Upgrade SHA-256 to bcrypt
            if (!isBcrypt) {
              user.passwordHash = bcrypt.hashSync(credentials.password, 10)
              await user.save()
            }
          } else {
            // Set password using bcrypt
            user.passwordHash = bcrypt.hashSync(credentials.password, 10)
            await user.save()
          }
        }

        // Add to active sessions / login history
        const sessionHistoryId = crypto.randomUUID()
        user.activeSessions.push({
          id: sessionHistoryId,
          device: "Desktop / Browser",
          browser: "Chrome / Safari",
          ip: "127.0.0.1",
          location: "Local Host",
          lastActive: new Date(),
          current: true,
        })
        user.loginHistory.push({
          id: crypto.randomUUID(),
          device: "Desktop / Browser",
          browser: "Chrome / Safari",
          ip: "127.0.0.1",
          location: "Local Host",
          timestamp: new Date(),
          status: "success",
        })
        await user.save()

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role || "USER",
          status: user.status || "ACTIVE",
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (user.email) {
        await connectDB()
        const dbUser = await User.findOne({ email: user.email.toLowerCase() })
        if (dbUser && dbUser.status === "SUSPENDED") {
          return false
        }

        if (account?.provider === "google") {
          const isGrowAdmin = user.email.toLowerCase() === "growadmin@gmail.com"

          if (!dbUser) {
            const newUser = await User.create({
              email: user.email.toLowerCase(),
              name: user.name || "",
              avatar: user.image || "",
              googleConnected: true,
              plan: "FREE",
              subscriptionStatus: "ACTIVE",
              role: isGrowAdmin ? "ADMIN" : "USER",
              status: "ACTIVE",
            })
            
            await Subscription.create({
              userId: newUser._id,
              plan: "FREE",
              status: "ACTIVE",
              billingCycle: "free",
            })

            await getOrCreateDefaultWorkspace(user.email.toLowerCase(), user.name || undefined)
          } else {
            if (isGrowAdmin && dbUser.role !== "ADMIN") {
              dbUser.role = "ADMIN"
            }
            if (!dbUser.googleConnected) {
              dbUser.googleConnected = true
            }
            if (user.name && !dbUser.name) dbUser.name = user.name
            if (user.image && !dbUser.avatar) dbUser.avatar = user.image
            await dbUser.save()
          }
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        token.role = (user as any).role || "USER"
        token.status = (user as any).status || "ACTIVE"
      }
      
      if (token.email) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: token.email.toLowerCase() }).select("plan subscriptionStatus role status")
          if (dbUser) {
            token.plan = dbUser.plan || "FREE"
            token.subscriptionStatus = dbUser.subscriptionStatus || "ACTIVE"
            token.role = dbUser.role || "USER"
            token.status = dbUser.status || "ACTIVE"
          } else {
            token.plan = "FREE"
            token.subscriptionStatus = "ACTIVE"
            token.role = "USER"
            token.status = "ACTIVE"
          }
        } catch (err) {
          console.error("JWT Session DB error:", err)
          token.plan = token.plan || "FREE"
          token.subscriptionStatus = token.subscriptionStatus || "ACTIVE"
          token.role = token.role || "USER"
          token.status = token.status || "ACTIVE"
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture as string
        session.user.plan = token.plan || "FREE"
        session.user.subscriptionStatus = token.subscriptionStatus || "ACTIVE"
        session.user.role = token.role || "USER"
        session.user.status = token.status || "ACTIVE"
      }
      return session
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        if (new URL(url).origin === baseUrl) return url
      } catch {
        /* ignore */
      }
      return baseUrl
    },
  },
}
