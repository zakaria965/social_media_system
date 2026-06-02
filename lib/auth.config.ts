import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import crypto from "crypto"
import { connectDB } from "./db"
import { User } from "./models/user"
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
        const passwordHash = hashPassword(credentials.password)

        let user = await User.findOne({ email })

        if (!user) {
          // Automatic registration if the user doesn't exist yet
          const name = email.split("@")[0]
          user = await User.create({
            email,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            username: name,
            passwordHash,
            googleConnected: false,
          })

          // Securely create their default workspace as well
          await getOrCreateDefaultWorkspace(email, user.name)
        } else {
          // If the user exists, verify password (or if they signed up with google before, let them register password now)
          if (user.passwordHash && user.passwordHash !== passwordHash) {
            return null
          }
          if (!user.passwordHash) {
            // Set password if not set
            user.passwordHash = passwordHash
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
      if (account?.provider === "google" && user.email) {
        await connectDB()
        let dbUser = await User.findOne({ email: user.email.toLowerCase() })

        if (!dbUser) {
          dbUser = await User.create({
            email: user.email.toLowerCase(),
            name: user.name || "",
            avatar: user.image || "",
            googleConnected: true,
          })
          await getOrCreateDefaultWorkspace(user.email.toLowerCase(), user.name || undefined)
        } else {
          if (!dbUser.googleConnected) {
            dbUser.googleConnected = true;
          }
          if (user.name && !dbUser.name) dbUser.name = user.name
          if (user.image && !dbUser.avatar) dbUser.avatar = user.image
          await dbUser.save()
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture as string
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
