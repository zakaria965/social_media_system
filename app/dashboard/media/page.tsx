"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Image as ImageIcon,
  Video,
  Download,
  Trash2,
  Search,
  Grid3X3,
  List,
  Upload,
  Loader2,
  X,
  FileText,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/toast-provider"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MediaItem {
  _id: string
  name: string
  url: string
  type: "image" | "video"
  size: number
  createdAt: string
}

export default function MediaLibraryPage() {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const [items, setItems] = useState<MediaItem[]>()
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = useCallback(async (searchQuery = "") => {
    try {
      const q = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""
      const res = await fetch(`/api/media${q}`)
      const data = await res.json()
      if (res.ok) {
        setItems(data.media || [])
      }
    } catch {
      showToast("Failed to fetch media assets", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (session) {
      fetchMedia()
    }
  }, [session, fetchMedia])

  // Debounced/instant search trigger
  const handleSearchChange = (val: string) => {
    setSearch(val)
    fetchMedia(val)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    let successCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          successCount++
        } else {
          showToast(`${file.name}: ${data.error || "Upload failed"}`, "error")
        }
      } catch {
        showToast(`${file.name}: Upload failed`, "error")
      }
    }

    if (successCount > 0) {
      showToast(`Uploaded ${successCount} asset(s) successfully`, "success")
      await fetchMedia(search)
    }
    setUploading(false)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this media asset?")) return

    try {
      const res = await fetch(`/api/media?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        showToast("Asset deleted successfully", "success")
        if (previewItem?._id === id) setPreviewItem(null)
        await fetchMedia(search)
      } else {
        const data = await res.json()
        showToast(data.error || "Failed to delete asset", "error")
      }
    } catch {
      showToast("Failed to delete asset", "error")
    }
  }

  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Media Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, browse, preview, and reuse your images and videos across posts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" className="rounded-lg border-border/60" onClick={() => setView(view === "grid" ? "list" : "grid")}>
            {view === "grid" ? <List className="size-4" /> : <Grid3X3 className="size-4" />}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button className="rounded-lg shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Upload className="size-4 mr-1.5" />
            )}
            Upload Media
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="px-3 py-1 font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            All Assets
          </Badge>
          <Badge variant="outline" className="px-3 py-1 font-medium border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer" onClick={() => fetchMedia()}>
            Active
          </Badge>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 rounded-xl border-border/60 bg-muted/40 pl-9 text-sm focus:bg-background"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 animate-pulse">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center border border-dashed border-border/60 rounded-2xl bg-muted/[0.02]">
          <ImageIcon className="size-10 text-muted-foreground opacity-50" />
          <div>
            <p className="text-sm font-medium text-foreground">Your media library is empty.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Drag & drop files or click upload to store image and video templates.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg mt-1" onClick={() => fileInputRef.current?.click()}>
            <Plus className="size-3.5 mr-1" /> Add Files
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <Card
              key={item._id}
              className="group relative cursor-pointer overflow-hidden rounded-xl border-border/60 hover:shadow-md transition-all aspect-square bg-muted/20 flex flex-col justify-between"
              onClick={() => setPreviewItem(item)}
            >
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {item.type === "video" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <video
                    src={item.url}
                    className="h-full w-full object-cover brightness-[0.9]"
                    muted
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover brightness-[0.95]"
                  />
                )}
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <Video className="size-8 text-white drop-shadow-md bg-black/20 p-1.5 rounded-full" />
                  </div>
                )}
              </div>

              {/* Overlay controls */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={item.url}
                  download={item.name}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex size-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
                >
                  <Download className="size-4" />
                </a>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-8 text-white hover:text-destructive hover:bg-white/20"
                  onClick={(e) => handleDelete(item._id, e)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Filename footer */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 text-white">
                <p className="truncate text-[10px] font-medium">{item.name}</p>
                <p className="text-[8px] text-zinc-300 mt-0.5">{formatBytes(item.size)}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-xl border-border/60 overflow-hidden shadow-sm">
          <div className="divide-y divide-border/60">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={cn(
                    "flex size-10 items-center justify-center rounded-lg border border-border/40 overflow-hidden relative shrink-0",
                    item.type === "video" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                  )}>
                    {item.type === "video" ? (
                      <video src={item.url} className="h-full w-full object-cover" muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      {item.type === "video" ? <Video className="size-3.5 text-white" /> : <ImageIcon className="size-3.5 text-white" />}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(item.size)} · {formatDate(item.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={item.url}
                    download={item.name}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <Download className="size-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    onClick={(e) => handleDelete(item._id, e)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-3xl overflow-hidden rounded-2xl p-0 border-border/60">
          <DialogHeader className="p-4 border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground truncate max-w-lg">{previewItem?.name}</DialogTitle>
              {previewItem && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Uploaded on {formatDate(previewItem.createdAt)} · {formatBytes(previewItem.size)} · {previewItem.type.toUpperCase()}
                </p>
              )}
            </div>
            <button
              onClick={() => setPreviewItem(null)}
              className="rounded-lg p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="size-4" />
            </button>
          </DialogHeader>

          <div className="bg-zinc-950/95 flex items-center justify-center min-h-[300px] max-h-[500px] p-4 relative overflow-hidden">
            {previewItem?.type === "video" ? (
              <video
                src={previewItem.url}
                className="max-h-[460px] max-w-full rounded-lg object-contain"
                controls
                autoPlay
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewItem?.url}
                alt={previewItem?.name}
                className="max-h-[460px] max-w-full rounded-lg object-contain"
              />
            )}
          </div>

          <div className="p-4 border-t border-border/40 flex justify-end gap-3">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setPreviewItem(null)}>
              Close
            </Button>
            <a
              href={previewItem?.url}
              download={previewItem?.name}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Download className="size-4 mr-1.5" /> Download File
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
