import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth.config"
import { redirect } from "next/navigation"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/user"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login")
  }

  await connectDB()
  const dbUser = await User.findOne({ email: session.user.email?.toLowerCase() })

  if (!dbUser || dbUser.role !== "ADMIN" || dbUser.status === "SUSPENDED") {
    if (dbUser && dbUser.plan === "PRO") {
      redirect("/dashboard")
    } else {
      redirect("/dashboard-lite")
    }
  }

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#111111] font-sans antialiased">
      {children}
    </div>
  )
}
