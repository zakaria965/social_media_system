export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok"

export type AccountStatus =
  | "connected"
  | "disconnected"
  | "expired"
  | "permission_error"
  | "sync_error"
  | "pending"

export interface SocialAccount {
  id: string
  platform: SocialPlatform
  username: string
  avatar: string
  status: AccountStatus
  followers: number
  engagement: number
}

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed"

export type PostType = "image" | "video" | "carousel" | "text"

export interface Post {
  id: string
  title: string
  content: string
  platforms: SocialPlatform[]
  status: PostStatus
  type: PostType
  scheduledAt: string | null
  createdAt: string
  media: string[]
  hashtags: string[]
  engagement?: {
    likes: number
    comments: number
    shares: number
  }
  facebookPostId?: string | null
  facebookUrl?: string | null
  facebookPageName?: string | null
  facebookPublishedTime?: string | null
}

export interface AnalyticsData {
  totalPosts: number
  scheduledPosts: number
  engagementRate: number
  followersGrowth: number
  totalReach: number
  aiGeneratedCount: number
  dailyEngagement: { date: string; value: number }[]
  weeklyReach: { date: string; value: number }[]
  platformBreakdown: { platform: SocialPlatform; percentage: number }[]
  topPosts: Post[]
  bestPostingTime: string
}

export type TeamRole = "owner" | "admin" | "editor" | "viewer"

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: TeamRole
  joinedAt: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "error" | "info" | "warning"
  read: boolean
  createdAt: string
}

export interface MediaItem {
  id: string
  name: string
  url: string
  type: "image" | "video"
  size: number
  folder: string
  createdAt: string
}

export type DashboardTab = "overview" | "content" | "analytics" | "team"
