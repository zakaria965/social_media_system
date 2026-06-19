import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth.config"
import { connectDB } from "@/lib/db"
import { verifyMemberPermission } from "@/lib/workspaces"
import Link from "next/link"

// Import page components from app/dashboard
import DashboardHome from "@/app/dashboard/page"
import CreatePage from "@/app/dashboard/create/page"
import BulkPage from "@/app/dashboard/bulk/page"
import ScheduledPage from "@/app/dashboard/scheduled/page"
import CalendarPage from "@/app/dashboard/calendar/page"
import AnalyticsPage from "@/app/dashboard/analytics/page"
import AIAssistantPage from "@/app/dashboard/ai-assistant/page"
import MediaPage from "@/app/dashboard/media/page"
import ChannelsPage from "@/app/dashboard/channels/page"
import InboxPage from "@/app/dashboard/inbox/page"
import NotificationsPage from "@/app/dashboard/notifications/page"
import TeamPage from "@/app/dashboard/team/page"
import SettingsPage from "@/app/dashboard/settings/page"

// Map slugs to components and required permissions
const slugMap: Record<string, { component: any; permission: string }> = {
  "": { component: DashboardHome, permission: "dashboard" },
  "create": { component: CreatePage, permission: "posts" },
  "bulk": { component: BulkPage, permission: "posts" },
  "scheduled": { component: ScheduledPage, permission: "scheduling" },
  "calendar": { component: CalendarPage, permission: "scheduling" },
  "analytics": { component: AnalyticsPage, permission: "analytics" },
  "reports": { component: AnalyticsPage, permission: "analytics" },
  "ai-assistant": { component: AIAssistantPage, permission: "ai-assistant" },
  "media": { component: MediaPage, permission: "media-library" },
  "channels": { component: ChannelsPage, permission: "channels" },
  "inbox": { component: InboxPage, permission: "inbox" },
  "notifications": { component: NotificationsPage, permission: "dashboard" },
  "team": { component: TeamPage, permission: "team" },
  "settings": { component: SettingsPage, permission: "settings" },
}

export default async function WorkspaceSlugPage({
  params,
}: {
  params: Promise<{ workspaceId: string; slug?: string[] }>
}) {
  const { workspaceId, slug } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  await connectDB()

  const slugPath = slug ? slug.join("/") : ""
  const matched = slugMap[slugPath]

  if (!matched) {
    redirect(`/workspace/${workspaceId}`)
  }

  const check = await verifyMemberPermission(session.user.email, workspaceId, matched.permission)

  if (!check.allowed) {
    // Render a premium 403 Forbidden page matching GrowWave's sleek floating SaaS design
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4 bg-[#FCFAF6] select-none">
        <div className="max-w-md w-full border-0 rounded-2xl bg-white p-8 shadow-card text-center space-y-6">
          <div className="size-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-xl font-semibold text-slate-900">
              Access Denied (403)
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
              Your role <span className="font-bold text-slate-800">({check.role || "Viewer"})</span> in this workspace does not have permission to access the <span className="font-semibold text-slate-800">"{matched.permission}"</span> feature.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/workspace/${workspaceId}`}
              className="inline-block w-full bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold rounded-xl text-xs py-3.5 cursor-pointer shadow-sm transition-all duration-200"
            >
              Back to Workspace Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Render the matched page component
  const PageComponent = matched.component
  return <PageComponent />
}
