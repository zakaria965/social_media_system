"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Calendar,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  AlertTriangle,
  Layers,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useToast } from "@/components/toast-provider"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BulkPostCard {
  id: string
  content: string
  platforms: string[]
  scheduledDate: string
  scheduledTime: string
  mediaFiles: string[]
  mediaNames: string[]
  mediaTypes: string[]
  isXLimitExceeded: boolean
  isTikTokVideoMissing: boolean
  isInstagramMediaMissing: boolean
  hasWarnings: boolean
}

const platformMeta = [
  { id: "facebook", label: "Facebook", color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", color: "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600" },
  { id: "linkedin", label: "LinkedIn", color: "bg-blue-700" },
  { id: "twitter", label: "Twitter / X", color: "bg-zinc-950" },
  { id: "tiktok", label: "TikTok", color: "Rose" },
]

export default function BulkSchedulingPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState<BulkPostCard[]>([])

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts")
      const data = await res.json()
      if (res.ok) {
        setConnectedAccounts(data.accounts || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
    // Initialize with 1 empty bulk post card
    handleAddCard()
  }, [fetchAccounts])

  const handleAddCard = () => {
    const newCard: BulkPostCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: "",
      platforms: [],
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // tomorrow
      scheduledTime: "12:00",
      mediaFiles: [],
      mediaNames: [],
      mediaTypes: [],
      isXLimitExceeded: false,
      isTikTokVideoMissing: false,
      isInstagramMediaMissing: false,
      hasWarnings: false,
    }
    setCards((prev) => [...prev, newCard])
  }

  const handleRemoveCard = (id: string) => {
    if (cards.length === 1) {
      showToast("At least one bulk post is required", "error")
      return
    }
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  const handleUpdateCardField = (id: string, field: keyof BulkPostCard, value: any) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c

        const updated = { ...c, [field]: value }

        // Perform live validations
        updated.isXLimitExceeded = updated.platforms.includes("twitter") && updated.content.length > 280
        updated.isTikTokVideoMissing = updated.platforms.includes("tiktok") && !updated.mediaTypes.includes("video")
        updated.isInstagramMediaMissing = updated.platforms.includes("instagram") && updated.mediaFiles.length === 0
        updated.hasWarnings = updated.isXLimitExceeded || updated.isTikTokVideoMissing || updated.isInstagramMediaMissing

        return updated
      })
    )
  }

  const isConnected = (platformId: string) => {
    return connectedAccounts.some((acc) => acc.platform === platformId)
  }

  const togglePlatform = (cardId: string, platformId: string) => {
    if (!isConnected(platformId)) {
      showToast(`Connect a ${platformId} account in Settings first`, "error")
      return
    }

    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    const active = card.platforms.includes(platformId)
    const newPlatforms = active
      ? card.platforms.filter((p) => p !== platformId)
      : [...card.platforms, platformId]

    handleUpdateCardField(cardId, "platforms", newPlatforms)
  }

  const handleMediaUpload = async (cardId: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    const newUrls: string[] = []
    const newNames: string[] = []
    const newTypes: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (res.ok) {
          newUrls.push(data.url)
          newNames.push(data.name)
          newTypes.push(data.type.startsWith("video") ? "video" : "image")
        }
      } catch {
        // ignore
      }
    }

    if (newUrls.length > 0) {
      handleUpdateCardField(cardId, "mediaFiles", [...card.mediaFiles, ...newUrls])
      handleUpdateCardField(cardId, "mediaNames", [...card.mediaNames, ...newNames])
      handleUpdateCardField(cardId, "mediaTypes", [...card.mediaTypes, ...newTypes])
    }
  }

  const handleQueueAll = async () => {
    // Validate all cards
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      const idx = i + 1
      if (!card.content) {
        showToast(`Post #${idx}: Content caption is required`, "error")
        return
      }
      if (card.platforms.length === 0) {
        showToast(`Post #${idx}: Select at least one platform`, "error")
        return
      }
      if (!card.scheduledDate || !card.scheduledTime) {
        showToast(`Post #${idx}: Specify date and time`, "error")
        return
      }
      if (card.hasWarnings) {
        showToast(`Post #${idx} has unresolved validation errors`, "error")
        return
      }
    }

    setSaving(true)
    try {
      let successCount = 0
      for (const card of cards) {
        const scheduledAt = `${card.scheduledDate}T${card.scheduledTime}:00`
        const payload = {
          title: card.content.slice(0, 60),
          content: card.content,
          platforms: card.platforms,
          media: card.mediaFiles,
          status: "scheduled",
          scheduledAt,
          type: card.mediaFiles.length > 0 ? (card.mediaTypes[0] === "video" ? "video" : "image") : "text",
        }

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          successCount++
        }
      }

      showToast(`Bulk Scheduling Complete: ${successCount} posts successfully queued!`, "success")
      router.push("/dashboard/scheduled")
    } catch {
      showToast("Error occurred during bulk scheduling", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bulk Post Scheduler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule multiple campaigns for different platforms, dates, and times simultaneously.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={handleAddCard}>
            <Plus className="size-3.5 mr-1" /> Add Post Card
          </Button>
          <Button size="sm" className="rounded-lg text-xs" onClick={handleQueueAll} disabled={saving || cards.length === 0}>
            {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Layers className="size-3.5 mr-1" />}
            Bulk Queue Timeline ({cards.length})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {cards.map((card, index) => (
            <Card key={card.id} className="rounded-xl border-border/60 overflow-hidden bg-card/95 shadow-md relative group">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge variant="secondary" className="font-bold text-[10px] px-2 py-0.5">
                  Post #{index + 1}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-lg text-destructive hover:bg-destructive/5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveCard(card.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <CardContent className="p-5 pt-7 grid gap-6 md:grid-cols-5 items-start">
                {/* Inputs */}
                <div className="md:col-span-3 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Content / Caption</Label>
                    <Textarea
                      placeholder="Compose caption for this campaign slot..."
                      value={card.content}
                      onChange={(e) => handleUpdateCardField(card.id, "content", e.target.value)}
                      className="min-h-24 rounded-xl border-border/60 bg-muted/20 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Publish Date</Label>
                      <input
                        type="date"
                        value={card.scheduledDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => handleUpdateCardField(card.id, "scheduledDate", e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">Publish Time</Label>
                      <input
                        type="time"
                        value={card.scheduledTime}
                        onChange={(e) => handleUpdateCardField(card.id, "scheduledTime", e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>

                  {card.hasWarnings && (
                    <div className="rounded-xl border-rose-500/20 bg-rose-500/[0.02] p-3 text-[10px] text-rose-700 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="size-3.5" /> Validation Errors
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {card.isXLimitExceeded && <li><strong>Twitter limit:</strong> Cap content under 280 chars ({card.content.length}).</li>}
                        {card.isTikTokVideoMissing && <li><strong>TikTok video:</strong> Video attachment required to queue.</li>}
                        {card.isInstagramMediaMissing && <li><strong>Instagram media:</strong> At least one media file required to queue.</li>}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Platform and Media Composing */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Publishing Channels</Label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {platformMeta
                        .filter((p) => isConnected(p.id))
                        .map((p) => {
                          const active = card.platforms.includes(p.id)
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePlatform(card.id, p.id)}
                              className={cn(
                                "text-[10px] font-semibold py-1 px-3 rounded-lg border capitalize transition-all select-none",
                                active
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "border-border/60 text-muted-foreground hover:bg-muted/40"
                              )}
                            >
                              {p.label}
                            </button>
                          )
                        })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">Media Attachments</Label>
                    <div
                      className="border border-dashed border-border/60 rounded-xl p-3 bg-muted/5 flex items-center justify-center flex-col gap-1.5 cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => document.getElementById(`file-bulk-${card.id}`)?.click()}
                    >
                      <input
                        id={`file-bulk-${card.id}`}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleMediaUpload(card.id, e.target.files)}
                      />
                      <ImageIcon className="size-5 text-muted-foreground opacity-60" />
                      <span className="text-[10px] font-medium text-foreground">Attach images / videos</span>
                    </div>

                    {card.mediaFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {card.mediaFiles.map((url, idx) => (
                          <div key={idx} className="relative size-10 rounded-lg border border-border/40 overflow-hidden shrink-0">
                            {card.mediaTypes[idx] === "video" ? (
                              <div className="size-full bg-zinc-950 flex items-center justify-center">
                                <span className="text-[8px] text-white">Video</span>
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} alt="Media upload" className="size-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => router.push("/dashboard/scheduled")}>
              Cancel Bulk
            </Button>
            <Button size="sm" className="rounded-lg text-xs" onClick={handleQueueAll} disabled={saving || cards.length === 0}>
              {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <FileCheck className="size-3.5 mr-1" />}
              Save All to Schedule ({cards.length})
            </Button>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
