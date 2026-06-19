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
import { useToast } from "@/components/toast-provider"
import { GrowWaveModal } from "@/components/growwave-modal"
import { UpgradeModal } from "@/components/free-user/upgrade-modal"


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
  const { showToast } = useToast()

  const [posts, setPosts] = useState<PostItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"draft" | "ready" | "published" | "failed">("draft")
  const [channels, setChannels] = useState<any[]>([])
  const [connectedCount, setConnectedCount] = useState(0)
  const [publishingPost, setPublishingPost] = useState<PostItem | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [publishedTodayCount, setPublishedTodayCount] = useState(0)
  const [userPlan, setUserPlan] = useState("FREE")
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)


  const fetchPublishedCount = () => {
    fetch("/api/publish")
      .then(res => res.json())
      .then(data => {
        if (typeof data.count === "number") {
          setPublishedTodayCount(data.count)
        }
        if (data.plan) {
          setUserPlan(data.plan)
        }
      })
      .catch(err => console.error("Failed to load published count:", err))
  }

  // Load posts and channels
  useEffect(() => {
    fetchPublishedCount()
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

    // Fetch actual channels from MongoDB for Free users
    fetch("/api/accounts")
      .then(res => res.json())
      .then(data => {
        if (data.accounts) {
          const fbAccount = data.accounts.find((a: any) => a.platform === "facebook" && a.status === "connected")
          if (fbAccount) {
            const fbChannel = {
              id: "c-fb",
              name: "Facebook Page",
              platform: "facebook",
              username: fbAccount.username || "Facebook Page",
              connected: true,
              followers: fbAccount.followers || 0,
              locked: false
            }
            setChannels([fbChannel])
            setConnectedCount(1)
            localStorage.setItem("growwave-lite-channels", JSON.stringify([fbChannel]))
          } else {
            const fbChannel = {
              id: "c-fb",
              name: "Facebook Page",
              platform: "facebook",
              username: "",
              connected: false,
              followers: 0,
              locked: false
            }
            setChannels([fbChannel])
            setConnectedCount(0)
            localStorage.setItem("growwave-lite-channels", JSON.stringify([fbChannel]))
          }
        }
      })
      .catch(err => {
        console.error("Failed to load accounts in publish page:", err)
      })
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
    setDeletePostId(id)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletePostId) return
    setDeleteLoading(true)
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    const updated = posts.filter(p => p.id !== deletePostId)
    updatePostsInStorage(updated)
    setDeleteLoading(false)
    setDeleteModalOpen(false)
    setDeletePostId(null)
    showToast("✓ Post Deleted", "success")
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
    showToast("✓ Post Published", "success")

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

        {userPlan.toUpperCase() === "FREE" && (
          <div className="flex flex-col items-start sm:items-end bg-slate-50 dark:bg-slate-800/40 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-card">
            <span className="text-[9px] font-black uppercase text-slate-400">
              Publishing Usage
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              {publishedTodayCount} / 3 Published Today
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              Free Plan Daily Limit
            </span>
          </div>
        )}

        <Link href="/free-user/create">
          <Button 
            disabled={userPlan.toUpperCase() === "FREE" && publishedTodayCount >= 3}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs rounded-xl uppercase tracking-wider flex items-center gap-1"
          >
            <Plus className="size-3.5" />
            Compose Post
          </Button>
        </Link>
      </div>

      {/* Daily Publishing Usage Card (Free Plan only) */}
      {userPlan.toUpperCase() === "FREE" && (
        <Card className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] p-5 shadow-card">
          <CardContent className="p-0 space-y-3">
            <div className="flex justify-between items-center text-xs font-medium">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Daily Publishing Usage</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your daily publishing resets at 12:00 AM.</p>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                {publishedTodayCount} / 3 Published Today
              </span>
            </div>
            
            {/* Progress bar: Green -> Orange -> Red */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  publishedTodayCount === 1 
                    ? "bg-emerald-500" 
                    : publishedTodayCount === 2 
                      ? "bg-amber-500" 
                      : publishedTodayCount >= 3 
                        ? "bg-rose-500" 
                        : "bg-slate-250"
                }`}
                style={{ width: `${Math.min((publishedTodayCount / 3) * 105, 100)}%` }}
              />
            </div>

            {/* Warning Banner */}
            {publishedTodayCount === 2 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <span>⚠️</span>
                <span>You have 1 publish remaining today.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="grid gap-3 sm:grid-cols-12 bg-white dark:bg-[#1F2937] p-4 rounded-2xl border-0 shadow-card">
        {/* Search */}
        <div className="relative sm:col-span-8">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs focus-visible:ring-[var(--brand-primary)]"
          />
        </div>

        {/* Platform selection */}
        <div className="sm:col-span-4 flex items-center gap-2">
          <Filter className="size-4 text-slate-400 shrink-0" />
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full text-xs font-bold text-slate-650 bg-slate-50 dark:bg-slate-800/40 border border-slate-250 dark:border-slate-700 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] h-9 text-[#0F172A] dark:text-slate-200"
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
                  ? "border-[var(--brand-primary)] text-slate-950 dark:text-white"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {labels[tab]}
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab ? "bg-[var(--brand-primary)]/20 text-emerald-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
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
          <Card key={post.id} className="rounded-2xl border-0 bg-white dark:bg-[#1F2937] shadow-card hover:shadow-card-hover transition-all duration-300">
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
                  <Badge variant="outline" className={`text-[8px] font-black uppercase px-2 py-0.2 select-none border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400`}>
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
                    className="p-2 rounded-xl border border-[#EEF2F7] hover:border-rose-500/30 hover:bg-rose-50/50 text-slate-400 hover:text-rose-500 transition-all bg-background shadow-card"
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
                        className="p-2 rounded-xl border border-[#EEF2F7] hover:border-[var(--brand-primary)]/40 hover:bg-slate-50 text-slate-600 transition-all bg-background shadow-card"
                        title="Edit in Composer"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        onClick={() => handleChangeStatus(post.id, "ready")}
                        className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-xl uppercase tracking-wider transition-all shadow-card"
                      >
                        Mark Ready
                      </button>
                    </>
                  )}

                  {post.status === "ready" && (
                    <div className="flex items-center gap-2">
                      {userPlan.toUpperCase() === "FREE" && publishedTodayCount >= 3 ? (
                        <>
                          <button
                            disabled
                            className="bg-slate-100 text-slate-400 font-extrabold text-[10px] py-2 px-3.5 rounded-xl uppercase tracking-wider select-none cursor-not-allowed border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                          >
                            Daily Limit Reached
                          </button>
                          <button
                            onClick={() => setUpgradeModalOpen(true)}
                            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-[10px] py-2 px-3.5 rounded-xl uppercase tracking-wider transition-all shadow-card"
                          >
                            Upgrade to Pro
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setPublishingPost(post)}
                          className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-xl uppercase tracking-wider transition-all shadow-card"
                        >
                          Publish Now
                        </button>
                      )}
                    </div>
                  )}

                  {post.status === "failed" && (
                    <button
                      onClick={() => handleChangeStatus(post.id, "ready")}
                      className="bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-[10px] py-2 px-3.5 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1 shadow-card"
                    >
                      <RefreshCw className="size-3" />
                      Retry Publish
                    </button>
                  )}

                  {post.status === "published" && (
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-600 bg-emerald-500/5 text-[9px] uppercase font-bold py-1 px-2 select-none flex items-center gap-0.5 shadow-card">
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
              <Button size="xs" className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold uppercase text-[10px]">
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
                <p className="text-xs text-[#6B7280]">Connect a Facebook Page before publishing.</p>
                <Button 
                  onClick={() => {
                    router.push("/free-user/settings?tab=accounts")
                  }}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs py-2 rounded-xl uppercase tracking-wider transition-all"
                >
                  Connect Facebook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 text-xs font-semibold text-slate-655 dark:text-slate-400">
                  <p>
                    This post will be published immediately to your connected Facebook Page:
                  </p>
                  <p className="font-extrabold text-slate-850 dark:text-slate-200 border p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {channels.find(c => c.connected)?.username || "Your Connected Page"}
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setPublishingPost(null)}
                    className="text-xs font-bold text-[#6B7280] rounded-xl shadow-card"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      const activeChannel = channels.find(c => c.connected)
                      const targetPlatform = activeChannel ? activeChannel.platform : "facebook"
                      
                      fetch("/api/publish", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          content: publishingPost.content,
                          platforms: [targetPlatform],
                          media: []
                        })
                      })
                      .then(async (publishRes) => {
                        const resData = await publishRes.json()
                        if (publishRes.ok && resData.results?.[targetPlatform]?.success) {
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
                          showToast("✓ Post Published", "success")
                          fetchPublishedCount()
                        } else {
                          if (publishRes.status === 403 || resData.error === "PUBLISH_LIMIT_REACHED" || resData.error?.includes("limit")) {
                            setUpgradeModalOpen(true)
                          } else {
                            const err = resData.results?.[targetPlatform]?.error || resData.error || "Publishing failed"
                            showToast(`⚠️ Error publishing: ${err}`, "error")
                          }
                        }
                      })
                      .catch(err => {
                        console.error("Publishing error:", err)
                        showToast("⚠️ Network error: failed to publish", "error")
                      })
                      .finally(() => {
                        setPublishingPost(null)
                      })
                    }}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white font-extrabold text-xs px-4 rounded-xl uppercase tracking-wider shadow-card"
                  >
                    Publish Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <GrowWaveModal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteModalOpen(false)
            setDeletePostId(null)
          }
        }}
        title="Delete Content Idea"
        message="Are you sure you want to permanently delete this content idea? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="danger"
        loading={deleteLoading}
        loadingText="Deleting..."
      />

      <UpgradeModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} reason="publish_limit" />
    </div>
  )
}

