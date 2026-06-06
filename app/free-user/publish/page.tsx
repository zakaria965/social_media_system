"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Send,
  Search,
  Filter,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  MoreVertical,
  ExternalLink
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  IconFacebook,
  IconInstagram,
  IconLinkedin
} from "@/components/social-brand-icons"

interface PostItem {
  id: string
  title: string
  content: string
  status: "draft" | "ready" | "published" | "failed"
  platforms: string[]
  scheduledAt?: string
  publishedAt?: string
  errorMessage?: string
}

export default function FreePublishPage() {
  const router = useRouter()

  const [posts, setPosts] = useState<PostItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"draft" | "ready" | "published" | "failed">("draft")
  const [channels, setChannels] = useState<any[]>([])
  const [connectedCount, setConnectedCount] = useState(0)
  const [publishingPost, setPublishingPost] = useState<PostItem | null>(null)

  // Load posts and channels
  useEffect(() => {
    const savedScheduled = localStorage.getItem("growwave-lite-scheduled")
    const scheduledList: any[] = savedScheduled ? JSON.parse(savedScheduled) : []

    // Build default initial list of various statuses
    const defaultPosts: PostItem[] = []

    // Merge scheduled posts into our listing if any exist
    const merged = [...scheduledList.map(item => ({
      ...item,
      status: item.status === "scheduled" ? "ready" : item.status // map "scheduled" to "ready" tab
    })), ...defaultPosts.filter(p => !scheduledList.some(s => s.id === p.id))] as PostItem[]

    setPosts(merged)

    // Load channels
    const savedChannels = localStorage.getItem("growwave-lite-channels")
    if (savedChannels) {
      const parsed = JSON.parse(savedChannels)
      setChannels(parsed)
      setConnectedCount(parsed.filter((c: any) => c.connected).length)
    } else {
      const defaultChannels = [
        { id: "c-fb", name: "Facebook", platform: "facebook", username: "", connected: false, followers: 0, locked: false },
        { id: "c-ig", name: "Instagram", platform: "instagram", username: "", connected: false, followers: 0, locked: false },
        { id: "c-li", name: "LinkedIn", platform: "linkedin", username: "", connected: false, followers: 0, locked: false },
        { id: "c-tw", name: "Twitter / X", platform: "twitter", username: "", connected: false, followers: 0, locked: false },
        { id: "c-tk", name: "TikTok", platform: "tiktok", username: "", connected: false, followers: 0, locked: false }
      ]
      setChannels(defaultChannels)
      setConnectedCount(0)
      localStorage.setItem("growwave-lite-channels", JSON.stringify(defaultChannels))
    }
  }, [])

  // Save changes back
  const updatePostsInStorage = (updatedList: PostItem[]) => {
    setPosts(updatedList)

    // Sync only scheduled (status: ready) back to scheduled store
    const scheduledOnly = updatedList
      .filter(p => p.status === "ready")
      .map(p => ({ ...p, status: "scheduled" }))
    localStorage.setItem("growwave-lite-scheduled", JSON.stringify(scheduledOnly))
  }

  // Filter logic
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPlatform =
      selectedPlatform === "all" || post.platforms.includes(selectedPlatform)

    const matchesStatus = post.status === activeTab

    return matchesSearch && matchesPlatform && matchesStatus
  })

  // Delete handler
  const handleDeletePost = (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      const updated = posts.filter(p => p.id !== id)
      updatePostsInStorage(updated)
    }
  }

  // Quick action: publish immediately
  const handlePublishNow = (post: PostItem) => {
    const updated = posts.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          status: "published" as const,
          publishedAt: new Date().toISOString()
        }
      }
      return p
    })
    updatePostsInStorage(updated)
    setActiveTab("published")
    alert("Post published successfully!")
  }

  // Quick action: change post status
  const handleChangeStatus = (id: string, nextStatus: PostItem["status"]) => {
    const updated = posts.map(p => (p.id === id ? { ...p, status: nextStatus } : p))
    updatePostsInStorage(updated)
  }

  // Render platform icons
  const renderPlatformBadge = (plat: string) => {
    switch (plat) {
      case "facebook":
        return <IconFacebook className="size-3.5 text-blue-600 shrink-0" />
      case "instagram":
        return <IconInstagram className="size-3.5 text-pink-600 shrink-0" />
      case "linkedin":
        return <IconLinkedin className="size-3.5 text-sky-700 shrink-0" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Publishing Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your drafts, scheduled queues, published posts, and failed delivery alerts.
          </p>
        </div>
        <Link href="/free-user/create">
          <Button className="bg-[#30FC47] hover:bg-[#24D93B] text-white font-extrabold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1">
            <Plus className="size-3.5" />
            Compose Post
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 sm:grid-cols-12 bg-background p-3 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        {/* Search */}
        <div className="relative sm:col-span-8">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs focus-visible:ring-[#30FC47]"
          />
        </div>

        {/* Platform selection */}
        <div className="sm:col-span-4 flex items-center gap-2">
          <Filter className="size-4 text-slate-400 shrink-0" />
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full text-xs font-bold text-slate-600 bg-slate-50 border border-slate-250 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-9 dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="all">All Channels</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {(["draft", "ready", "published", "failed"] as const).map((tab) => {
          const count = posts.filter(p => p.status === tab).length
          const labels = {
            draft: "Drafts",
            ready: "Ready",
            published: "Published",
            failed: "Failed"
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold transition-all relative border-b-2 -mb-[2px] flex items-center gap-1.5 ${
                activeTab === tab
                  ? "border-[#30FC47] text-slate-950 dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {labels[tab]}
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab ? "bg-[#30FC47]/20 text-emerald-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lists */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="rounded-xl border border-slate-200 bg-background shadow-sm dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 transition-all">
            <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              
              {/* Left detail */}
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Channels icons */}
                  <div className="flex gap-1 bg-slate-50 p-1 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    {post.platforms.map((plat) => (
                      <span key={plat} title={plat}>{renderPlatformBadge(plat)}</span>
                    ))}
                  </div>
                  <Badge variant="outline" className={`text-[8px] font-black uppercase px-2 py-0.2 select-none border-slate-200 text-slate-500`}>
                    {post.status}
                  </Badge>
                </div>

                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{post.title}</span>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1">{post.content}</p>
                </div>

                {/* Errors display */}
                {post.errorMessage && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/50 text-[10.5px] text-rose-600 font-semibold flex items-center gap-1.5">
                    <XCircle className="size-4 text-rose-500 shrink-0" />
                    <span>Failed reason: {post.errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Right meta & actions */}
              <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {post.status === "published" && post.publishedAt && (
                    <span>Published: {new Date(post.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                  {post.status === "ready" && post.scheduledAt && (
                    <span>Scheduled: {new Date(post.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                  {post.status === "draft" && <span>Draft status</span>}
                  {post.status === "failed" && <span>Failed delivery</span>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 rounded-lg border border-slate-200 hover:border-rose-500/30 hover:bg-rose-50/50 text-slate-400 hover:text-rose-500 transition-all bg-background"
                    title="Delete Post"
                  >
                    <Trash2 className="size-4" />
                  </button>

                  {/* Context actions based on tab */}
                  {post.status === "draft" && (
                    <>
                      <button
                        onClick={() => {
                          router.push(`/free-user/create?title=${encodeURIComponent(post.title)}&content=${encodeURIComponent(post.content)}`)
                        }}
                        className="p-2 rounded-lg border border-slate-200 hover:border-[#30FC47]/40 hover:bg-slate-50 text-slate-600 transition-all bg-background"
                        title="Edit in Composer"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        onClick={() => handleChangeStatus(post.id, "ready")}
                        className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-lg uppercase tracking-wider transition-all"
                      >
                        Mark Ready
                      </button>
                    </>
                  )}

                  {post.status === "ready" && (
                    <>
                      <button
                        onClick={() => setPublishingPost(post)}
                        className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-lg uppercase tracking-wider transition-all"
                      >
                        Publish Now
                      </button>
                    </>
                  )}

                  {post.status === "failed" && (
                    <button
                      onClick={() => handleChangeStatus(post.id, "ready")}
                      className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" />
                      Retry Publish
                    </button>
                  )}

                  {post.status === "published" && (
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 bg-emerald-500/5 text-[9px] uppercase font-bold py-1 px-2 select-none flex items-center gap-0.5">
                      <CheckCircle className="size-3" />
                      Live Feed
                    </Badge>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/30 p-12 text-center max-w-md mx-auto">
            <Send className="size-10 text-slate-300 mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No content ready to publish</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              Your publishing list is empty. Get started by composing a new idea or draft.
            </p>
            <Link href="/free-user/create" className="mt-4">
              <Button size="xs" className="bg-[#30FC47] hover:bg-[#24D93B] text-white font-extrabold uppercase text-[10px]">
                Create Content
              </Button>
            </Link>
          </div>
        )}
      </div>

      {publishingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setPublishingPost(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 dark:border-slate-800 dark:bg-slate-900 z-10 space-y-4">
            <h3 className="text-sm font-extrabold text-[#1F2937] dark:text-white">Publish Post</h3>
            {connectedCount === 0 ? (
              <div className="space-y-4 py-2">
                <p className="text-xs text-[#6B7280]">Connect a channel before publishing.</p>
                <Button 
                  onClick={() => {
                    router.push("/free-user/settings?tab=accounts&action=connect-facebook")
                  }}
                  className="w-full bg-[#30FC47] hover:bg-[#24D93B] text-white font-extrabold text-xs py-2 rounded-lg uppercase tracking-wider transition-all"
                >
                  Connect Facebook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Publish To:</label>
                  <select className="w-full text-xs font-bold text-[#1F2937] bg-[#FCFAF6] border border-slate-200 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#30FC47] h-9 dark:bg-slate-800 dark:border-slate-700">
                    {channels.filter(c => c.connected).map(c => (
                      <option key={c.id} value={c.platform}>{c.name} ({c.username})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setPublishingPost(null)}
                    className="text-xs font-bold text-[#6B7280]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const activeChannel = channels.find(c => c.connected)
                      const targetPlatform = activeChannel ? activeChannel.platform : "facebook"
                      
                      const updated = posts.map(p => {
                        if (p.id === publishingPost.id) {
                          return {
                            ...p,
                            status: "published" as const,
                            platforms: [targetPlatform],
                            publishedAt: new Date().toISOString()
                          }
                        }
                        return p
                      })
                      updatePostsInStorage(updated)
                      setActiveTab("published")
                      setPublishingPost(null)
                    }}
                    className="bg-[#30FC47] hover:bg-[#24D93B] text-white font-extrabold text-xs px-4 rounded-lg uppercase tracking-wider"
                  >
                    Publish
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
