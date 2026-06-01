"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  CheckCircle,
  Clock,
  Play,
  RefreshCw,
  Search,
  Server,
  StopCircle,
  Terminal,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useToast } from "@/components/toast-provider"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface QueueJobData {
  _id: string
  postId: {
    _id: string
    title: string
    content: string
    type: string
  } | null
  platform: string
  publishDate: string
  publishTime: string
  retryCount: number
  status: "pending" | "running" | "completed" | "failed" | "retrying"
  runAt: string
  executionLogs: { timestamp: string; message: string; status: string }[]
  updatedAt: string
}

const statusColors: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  running: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  retrying: "bg-violet-500/10 text-violet-500 border-violet-500/20 animate-pulse",
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  running: "Executing",
  completed: "Completed",
  failed: "Failed",
  retrying: "Retrying",
}

export default function QueueMonitoringPage() {
  const { showToast } = useToast()
  const [jobs, setJobs] = useState<QueueJobData[]>([])
  const [stats, setStats] = useState<any>({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    retrying: 0,
    healthScore: 100,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedJobLogs, setSelectedJobLogs] = useState<any[] | null>(null)
  const [selectedJobTitle, setSelectedJobTitle] = useState("")
  const [logsOpen, setLogsOpen] = useState(false)
  const [actioningJobId, setActioningJobId] = useState<string | null>(null)

  const fetchQueue = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/queue?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
        setStats(data.stats)
      }
    } catch {
      showToast("Failed to load queue database", "error")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
    // Poll the queue monitor every 8 seconds silently for live updates
    const interval = setInterval(() => {
      fetchQueue(true)
    }, 8000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const handleRunJobNow = async (jobId: string) => {
    setActioningJobId(jobId)
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast("Job triggered and successfully executed!", "success")
        fetchQueue()
      } else {
        showToast(data.error || "Job execution failed", "error")
        fetchQueue()
      }
    } catch {
      showToast("Failed to trigger job execution", "error")
    } finally {
      setActioningJobId(null)
    }
  }

  const handleCancelJob = async (jobId: string) => {
    setActioningJobId(jobId)
    try {
      const res = await fetch(`/api/queue?jobId=${jobId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        showToast("Job queue scheduling successfully cancelled!", "success")
        fetchQueue()
      } else {
        showToast("Failed to cancel job", "error")
      }
    } catch {
      showToast("Failed to cancel job", "error")
    } finally {
      setActioningJobId(null)
    }
  }

  const handleOpenLogs = (job: QueueJobData) => {
    setSelectedJobLogs(job.executionLogs)
    setSelectedJobTitle(`${job.platform.toUpperCase()} Job Log - ID: ${job._id.slice(-6)}`)
    setLogsOpen(true)
  }

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) => {
    const postTitle = job.postId?.title?.toLowerCase() || "untitled draft"
    const postContent = job.postId?.content?.toLowerCase() || ""
    const platform = job.platform.toLowerCase()
    const query = searchQuery.toLowerCase()
    return (
      postTitle.includes(query) ||
      postContent.includes(query) ||
      platform.includes(query) ||
      job._id.includes(query)
    )
  })

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Queue Monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit, execute, and monitor real-time automatic publishing scheduler jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="py-1 px-3 bg-card border-border/50 text-xs font-semibold flex items-center gap-1.5 shadow-sm text-foreground">
            <Server className="size-4 text-emerald-500 animate-pulse" /> Active Engine
          </Badge>
          <Button variant="outline" size="sm" className="rounded-lg text-xs flex items-center gap-1.5" onClick={() => fetchQueue()}>
            <RefreshCw className="size-3.5" /> Refresh Queue
          </Button>
        </div>
      </div>

      {/* Health Metric deck */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="rounded-xl border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">Automation Health</p>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{stats.healthScore}%</span>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/25">Optimal</Badge>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">Executing / Queued</p>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{stats.running} / {stats.pending}</span>
            <Badge variant="outline" className="border-blue-500/25 text-blue-500">Standby</Badge>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">Retries Pending</p>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{stats.retrying}</span>
            {stats.retrying > 0 ? (
              <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-50 animate-pulse">Retrying</Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">Clear</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-card/95 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">System Failures</p>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{stats.failed}</span>
            {stats.failed > 0 ? (
              <Badge variant="outline" className="border-rose-500/30 text-rose-500 bg-rose-50">Audited</Badge>
            ) : (
              <Badge variant="secondary" className="bg-emerald-50 bg-emerald-500/10 text-emerald-600">Zero Error</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and search deck */}
      <Card className="rounded-xl border-border/60 overflow-hidden bg-card/95 shadow-sm mb-6">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/40">
          <div className="flex flex-wrap items-center gap-1.5">
            {["all", "pending", "running", "completed", "failed", "retrying"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "text-[10px] font-bold tracking-wide uppercase px-3 py-1 rounded-lg border transition-all select-none capitalize",
                  statusFilter === st
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted/80"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60 md:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by job ID, title, or platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8.5 rounded-lg border-border/60 bg-muted/40 pl-8 text-xs focus:bg-background placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Jobs list */}
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 gap-3.5">
              <Activity className="size-10 text-muted-foreground/45" />
              <div>
                <p className="text-sm font-semibold text-foreground">No active queue jobs found</p>
                <p className="text-xs text-muted-foreground mt-0.5">Scheduler queue is completely up to date.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/25 border-b border-border/40 text-muted-foreground font-semibold">
                  <th className="p-3 pl-4">Job ID</th>
                  <th className="p-3">Campaign / Post Info</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Scheduled Run</th>
                  <th className="p-3 text-center">Retries</th>
                  <th className="p-3">Job Status</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredJobs.map((job) => (
                  <tr key={job._id} className="hover:bg-muted/10 group transition-colors">
                    <td className="p-3 pl-4 font-mono font-bold text-[10px] text-muted-foreground">
                      #{job._id.slice(-6)}
                    </td>
                    <td className="p-3 max-w-[200px] truncate">
                      <p className="font-bold text-foreground truncate">{job.postId?.title || "Untitled draft"}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{job.postId?.content || "No text content"}</p>
                    </td>
                    <td className="p-3 capitalize font-bold text-foreground">
                      {job.platform}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        {new Date(job.runAt).toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                        {new Date(job.runAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-foreground">
                      {job.retryCount} / 3
                    </td>
                    <td className="p-3">
                      <Badge className={cn("text-[9px] font-bold py-0.5 px-2 border", statusColors[job.status] || "bg-muted text-foreground")}>
                        {statusLabels[job.status] || job.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right pr-4 space-x-1 shrink-0 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="xs"
                        className="rounded-lg text-[10px] h-7 px-2 bg-card border-border/60 hover:bg-muted font-bold text-muted-foreground"
                        onClick={() => handleOpenLogs(job)}
                      >
                        <Terminal className="size-3 mr-1" /> View Logs
                      </Button>
                      
                      {job.status === "pending" && (
                        <Button
                          variant="outline"
                          size="xs"
                          className="rounded-lg text-[10px] h-7 px-2 border-rose-500/25 hover:bg-rose-500/5 text-rose-500"
                          onClick={() => handleCancelJob(job._id)}
                          disabled={actioningJobId === job._id}
                        >
                          {actioningJobId === job._id ? <Loader2 className="size-3 animate-spin" /> : <StopCircle className="size-3" />}
                        </Button>
                      )}
                      
                      {(job.status === "pending" || job.status === "failed" || job.status === "retrying") && (
                        <Button
                          variant="default"
                          size="xs"
                          className="rounded-lg text-[10px] h-7 px-2"
                          onClick={() => handleRunJobNow(job._id)}
                          disabled={actioningJobId === job._id}
                        >
                          {actioningJobId === job._id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Play className="size-3 mr-1" />
                          )}
                          Execute
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Live execution logs dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-xl rounded-2xl p-5 border-border/60 shadow-xl bg-card">
          <DialogHeader className="border-b border-border/40 pb-3">
            <DialogTitle className="flex items-center gap-1.5 text-sm font-bold">
              <Terminal className="size-4.5 text-primary" /> {selectedJobTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Complete diagnostic, request metadata, and state transition histories.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px] leading-relaxed p-4 rounded-xl max-h-[300px] overflow-y-auto space-y-2">
              {selectedJobLogs && selectedJobLogs.length > 0 ? (
                selectedJobLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-zinc-500 shrink-0 select-none">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={cn(
                      "font-bold shrink-0",
                      log.status === "completed" || log.status === "success" ? "text-emerald-500" :
                      log.status === "failed" || log.status === "error" ? "text-rose-500" :
                      log.status === "running" ? "text-amber-500" : "text-zinc-400"
                    )}>
                      {log.status.toUpperCase()}:
                    </span>
                    <span className="flex-1 text-zinc-100">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-zinc-500">No logs generated yet.</div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 pt-4 flex justify-end">
            <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setLogsOpen(false)}>
              Close Terminal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
