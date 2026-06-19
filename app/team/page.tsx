"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  Pencil,
  Eye,
  Crown,
  TrendingUp,
  Clock,
  Sparkles,
  Link2,
  Trash2,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  Copy,
  Plus,
  Check,
  ShieldAlert,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/toast-provider"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useWorkspace } from "@/components/dashboard/workspace-provider"
import { cn } from "@/lib/utils"

const permissionOptions = [
  { key: "dashboard", label: "Dashboard Access", desc: "View the general dashboard and overview charts." },
  { key: "posts", label: "Post Creation & Deletion", desc: "Create, edit, delete, and copy post drafts." },
  { key: "scheduling", label: "Post Scheduling", desc: "Schedule and manage the post queues." },
  { key: "analytics", label: "Analytics Overview", desc: "View campaign analytics and stats." },
  { key: "ai-assistant", label: "AI Copywriter Assistant", desc: "Generate content and replies using AI." },
  { key: "media-library", label: "Media Assets Library", desc: "Upload and organize photos and videos." },
  { key: "channels", label: "Social Channels Connect", desc: "Link/unlink Facebook, Instagram, LinkedIn profiles." },
  { key: "inbox", label: "Social Inbox", desc: "Read and reply to social messages." },
  { key: "team", label: "Team & Role Customizer", desc: "Invite members and manage permissions." },
  { key: "settings", label: "Workspace Settings", desc: "Modify details of this workspace." },
  { key: "billing", label: "Billing & Subscriptions", desc: "Manage billing invoices and upgrade plan." },
]

const roleConfig: Record<string, { label: string; icon: any; color: string; variant: "default" | "secondary" | "outline" | "ghost" }> = {
  // Legacy
  owner: { label: "Workspace Owner", icon: Crown, color: "text-amber-500", variant: "default" },
  admin: { label: "Workspace Manager", icon: ShieldCheck, color: "text-blue-500", variant: "secondary" },
  editor: { label: "Content Manager", icon: Pencil, color: "text-emerald-500", variant: "outline" },
  viewer: { label: "Viewer", icon: Eye, color: "text-zinc-500", variant: "ghost" },
  // New
  "Workspace Owner": { label: "Workspace Owner", icon: Crown, color: "text-amber-500", variant: "default" },
  "Workspace Manager": { label: "Workspace Manager", icon: ShieldCheck, color: "text-blue-500", variant: "secondary" },
  "Content Manager": { label: "Content Manager", icon: Pencil, color: "text-emerald-500", variant: "outline" },
  "Editor": { label: "Editor", icon: Pencil, color: "text-purple-500", variant: "outline" },
  "Analyst": { label: "Analyst", icon: Eye, color: "text-zinc-500", variant: "ghost" },
  "Viewer": { label: "Viewer", icon: Eye, color: "text-zinc-500", variant: "ghost" },
}

export default function TeamPage() {
  const { activeWorkspace, role: userRole, permissions: userPermissions } = useWorkspace()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<"members" | "roles" | "activity" | "analytics">("members")
  
  // Workspace data states
  const [members, setMembers] = useState<any[]>([])
  const [customRoles, setCustomRoles] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any | null>(null)
  
  const [loading, setLoading] = useState(true)

  // Dialog & Form states
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Content Manager")
  const [invitePermissions, setInvitePermissions] = useState<string[]>([])
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Custom Roles Form states
  const [newRoleName, setNewRoleName] = useState("")
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([])

  // Edit Member permissions states
  const [editingMember, setEditingMember] = useState<any | null>(null)
  const [editingRole, setEditingRole] = useState("")
  const [editingPermissions, setEditingPermissions] = useState<string[]>([])

  const loadWorkspaceData = useCallback(async () => {
    if (!activeWorkspace) return
    setLoading(true)
    try {
      const [membersRes, rolesRes, activityRes, analyticsRes] = await Promise.all([
        fetch(`/api/workspaces/${activeWorkspace._id}/members`),
        fetch(`/api/workspaces/${activeWorkspace._id}/custom-roles`),
        fetch(`/api/workspaces/${activeWorkspace._id}/activity`),
        fetch(`/api/workspaces/${activeWorkspace._id}/analytics`),
      ])

      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.members || [])
      }
      if (rolesRes.ok) {
        const data = await rolesRes.json()
        setCustomRoles(data.customRoles || [])
      }
      if (activityRes.ok) {
        const data = await activityRes.json()
        setActivities(data.logs || [])
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        setAnalytics(data.stats || null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeWorkspace])

  useEffect(() => {
    loadWorkspaceData()
  }, [activeWorkspace, loadWorkspaceData])

  // Initialize permissions when selected invite role changes
  useEffect(() => {
    const staticPerms: Record<string, string[]> = {
      "owner": permissionOptions.map(p => p.key),
      "Workspace Owner": permissionOptions.map(p => p.key),
      "admin": ["dashboard", "posts", "scheduling", "analytics", "ai-assistant", "media-library", "channels", "inbox", "team", "settings"],
      "Admin": ["dashboard", "posts", "scheduling", "analytics", "ai-assistant", "media-library", "channels", "inbox", "team", "settings"],
      "editor": ["dashboard", "posts", "scheduling", "analytics", "ai-assistant", "media-library"],
      "Content Manager": ["dashboard", "posts", "scheduling", "analytics", "ai-assistant", "media-library"],
      "Designer": ["dashboard", "posts", "media-library"],
      "viewer": ["dashboard", "analytics", "inbox"],
      "Analyst": ["dashboard", "analytics", "inbox"],
    }
    if (staticPerms[inviteRole]) {
      setInvitePermissions(staticPerms[inviteRole])
    } else {
      const match = customRoles.find(r => r.name === inviteRole)
      setInvitePermissions(match ? match.permissions : [])
    }
  }, [inviteRole, customRoles])

  // Action: Send Member Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim() || !activeWorkspace) return

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          customPermissions: invitePermissions,
        }),
      })

      if (res.ok) {
        showToast(`An invitation has been generated for ${inviteEmail.trim()}.`, "success")
        setInviteEmail("")
        setInviteRole("Content Manager")
        setIsInviteOpen(false)
        loadWorkspaceData()
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action: Accept/Revoke/Remove Member
  const handleRemoveMember = async (memberId: string) => {
    if (!activeWorkspace) return
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members/${memberId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        showToast("The member or invitation was successfully removed.", "success")
        loadWorkspaceData()
      } else {
        const err = await res.json()
        showToast(err.error || "Hierarchy validation blocked this action.", "error")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action: Resend Invite
  const handleResendInvite = async (memberId: string) => {
    if (!activeWorkspace) return
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members/${memberId}/resend`, {
        method: "POST",
      })

      if (res.ok) {
        showToast("Invitation resent successfully.", "success")
        loadWorkspaceData()
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action: Toggle Member Suspension
  const handleToggleSuspend = async (member: any) => {
    if (!activeWorkspace) return
    const newStatus = member.status === "suspended" ? "active" : "suspended"
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members/${member._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (res.ok) {
        showToast(
          `Member ${member.email} has been successfully ${newStatus === "suspended" ? "suspended" : "unsuspended"}.`,
          "success"
        )
        loadWorkspaceData()
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action: Save Member Permissions Edits
  const handleSaveMemberEdit = async () => {
    if (!activeWorkspace || !editingMember) return
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members/${editingMember._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editingRole,
          customPermissions: editingPermissions,
        }),
      })

      if (res.ok) {
        showToast(`Permissions for ${editingMember.email} successfully updated.`, "success")
        setEditingMember(null)
        loadWorkspaceData()
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action: Create Custom Role
  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim() || !activeWorkspace) return

    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/custom-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoleName.trim(),
          permissions: newRolePermissions,
        }),
      })

      if (res.ok) {
        showToast(`Custom role "${newRoleName.trim()}" successfully created.`, "success")
        setNewRoleName("")
        setNewRolePermissions([])
        loadWorkspaceData()
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Action: Delete Custom Role
  const handleDeleteCustomRole = async (name: string) => {
    if (!activeWorkspace) return
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/custom-roles?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      })

      if (res.ok) {
        showToast(`Custom role "${name}" removed. Affected members demoted to Analyst.`, "success")
        loadWorkspaceData()
      } else {
        const err = await res.json()
        showToast(err.error || "An error occurred.", "error")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    showToast("Direct invitation link copied to clipboard.", "success")
    setTimeout(() => setCopiedToken(null), 3000)
  }

  const canManageTeam = userPermissions.includes("team") || ["owner", "Workspace Owner"].includes(userRole || "")

  if (!activeWorkspace) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center space-y-3">
        <ShieldAlert className="size-10 text-muted-foreground animate-pulse" />
        <h3 className="font-semibold text-lg">No Workspace Selected</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Please select or create a workspace using the sidebar dropdown switcher.
        </p>
      </div>
    )
  }

  const activeMembersList = members.filter((m) => m.status !== "pending")
  const pendingInvitesList = members.filter((m) => m.status === "pending")

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Top Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="size-6 text-brand-green" />
              Team Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage members, custom roles, and campaign approvals for{" "}
              <span className="font-semibold text-foreground">{activeWorkspace.name}</span>.
            </p>
          </div>

          {canManageTeam && (
            <div className="flex gap-2.5">
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold shadow-md cursor-pointer border-0 py-5">
                    <UserPlus className="size-4 shrink-0 mr-1.5" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-card border border-border-light shadow-xl rounded-2xl">
                  <form onSubmit={handleSendInvite}>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="size-5 text-brand-green-dark" />
                        Invite Team Member
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Send a secure invitation to collaborate on GrowWave campaign channels.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-primary">Email Address</label>
                        <Input
                          required
                          type="email"
                          placeholder="partner@agency.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="rounded-xl border-border/80 text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-primary">Workspace Role</label>
                        <Select value={inviteRole} onValueChange={inviteRole => setInviteRole(inviteRole)}>
                          <SelectTrigger className="w-full rounded-xl border-border text-xs h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <DropdownMenuLabel className="text-[9px] uppercase tracking-wider text-text-secondary">
                              System Roles
                            </DropdownMenuLabel>
                            <SelectItem value="Workspace Manager" className="text-xs">Workspace Manager</SelectItem>
                            <SelectItem value="Content Manager" className="text-xs">Content Manager</SelectItem>
                            <SelectItem value="Analyst" className="text-xs">Analyst</SelectItem>
                            <SelectItem value="Editor" className="text-xs">Editor</SelectItem>
                            <SelectItem value="Viewer" className="text-xs">Viewer</SelectItem>
                            {customRoles.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[9px] uppercase tracking-wider text-text-secondary">
                                  Custom Roles
                                </DropdownMenuLabel>
                                {customRoles.map((cr) => (
                                  <SelectItem key={cr.name} value={cr.name} className="text-xs">
                                    {cr.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Configurable Permissions Checklist */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-primary">
                          Role Permissions Matrix
                        </label>
                        <div className="max-h-48 overflow-y-auto border border-border/60 rounded-xl p-2 bg-muted/20 space-y-2.5">
                          {permissionOptions.map((opt) => {
                            const isChecked = invitePermissions.includes(opt.key)
                            return (
                              <div key={opt.key} className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id={`invite-perm-${opt.key}`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setInvitePermissions([...invitePermissions, opt.key])
                                    } else {
                                      setInvitePermissions(invitePermissions.filter((p) => p !== opt.key))
                                    }
                                  }}
                                  disabled={["owner", "Workspace Owner"].includes(inviteRole)}
                                  className="mt-0.5 rounded border-border size-3.5 accent-brand-green cursor-pointer"
                                />
                                <div className="space-y-0.5 leading-none">
                                  <label
                                    htmlFor={`invite-perm-${opt.key}`}
                                    className="text-xs font-bold text-text-primary cursor-pointer"
                                  >
                                    {opt.label}
                                  </label>
                                  <p className="text-[10px] text-text-secondary leading-normal">{opt.desc}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2.5">
                      <DialogClose asChild>
                        <Button type="button" variant="outline" className="rounded-xl text-xs h-9">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={!inviteEmail}
                        className="bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold border-0 rounded-xl text-xs h-9 cursor-pointer"
                      >
                        Create Invitation
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border/60 gap-4 overflow-x-auto select-none">
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "px-3 py-2 text-xs font-bold tracking-tight border-b-2 transition-all cursor-pointer",
              activeTab === "members"
                ? "border-brand-green text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Members & Invites
          </button>
          {canManageTeam && (
            <button
              onClick={() => setActiveTab("roles")}
              className={cn(
                "px-3 py-2 text-xs font-bold tracking-tight border-b-2 transition-all cursor-pointer",
                activeTab === "roles"
                  ? "border-brand-green text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Custom Roles
            </button>
          )}
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "px-3 py-2 text-xs font-bold tracking-tight border-b-2 transition-all cursor-pointer",
              activeTab === "activity"
                ? "border-brand-green text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Workspace Activity Feed
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={cn(
              "px-3 py-2 text-xs font-bold tracking-tight border-b-2 transition-all cursor-pointer",
              activeTab === "analytics"
                ? "border-brand-green text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Collaboration Analytics
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Activity className="size-6 text-brand-green animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab 1: Members & Invites */}
            {activeTab === "members" && (
              <>
                {/* Stats Summary cards */}
                {analytics && (
                  <div className="grid gap-4 md:grid-cols-4 sm:grid-cols-2">
                    <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md">
                      <CardContent className="p-4 space-y-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                          Total Active Members
                        </p>
                        <h2 className="text-xl font-extrabold">{activeMembersList.length}</h2>
                        <p className="text-[10px] text-muted-foreground">Collaborators in workspace</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md">
                      <CardContent className="p-4 space-y-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                          Pending Invitations
                        </p>
                        <h2 className="text-xl font-extrabold">{pendingInvitesList.length}</h2>
                        <p className="text-[10px] text-muted-foreground">Sent and waiting responses</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md">
                      <CardContent className="p-4 space-y-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                          Connected Channels
                        </p>
                        <h2 className="text-xl font-extrabold">{analytics.connectedChannels}</h2>
                        <p className="text-[10px] text-muted-foreground">Social campaign channels</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md">
                      <CardContent className="p-4 space-y-1">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                          Shared Media Assets
                        </p>
                        <h2 className="text-xl font-extrabold">
                          {(analytics.storageUsageBytes / (1024 * 1024)).toFixed(1)} MB
                        </h2>
                        <p className="text-[10px] text-muted-foreground">Team cloud media storage</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Empty State Onboarding UI */}
                {activeMembersList.length === 0 ? (
                  <Card className="border-dashed border-2 border-border/80 rounded-2xl py-12 px-6 text-center space-y-4 bg-muted/10 max-w-xl mx-auto mt-6">
                    <div className="flex size-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green mx-auto">
                      <UserPlus className="size-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-foreground text-base">Invite your first team member</h3>
                      <p className="text-xs text-text-secondary leading-normal max-w-sm mx-auto">
                        GrowWave works best in marketing teams. Add designers, editors, clients, or content managers to collaborate on calendars and approvals.
                      </p>
                    </div>
                    {canManageTeam ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          onClick={() => setIsInviteOpen(true)}
                          className="bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold border-0 rounded-xl text-xs py-4 px-6 shadow"
                        >
                          Invite Collaborator
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-500 font-bold">Only workspace owners can add collaborators.</p>
                    )}
                  </Card>
                ) : (
                  /* Members Table Grid */
                  <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md overflow-hidden">
                    <div className="px-4 py-3 bg-muted/15 border-b border-border/40 flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                        <Users className="size-3.5 text-brand-green-dark" />
                        Members List ({activeMembersList.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-border/60">
                      {activeMembersList.map((member) => {
                        let role = member.role
                        if (role === "owner") role = "Workspace Owner";
                        if (role === "admin") role = "Workspace Manager";
                        if (role === "editor") role = "Content Manager";
                        if (role === "viewer") role = "Viewer";

                        const isOwner = ["owner", "Workspace Owner"].includes(role)
                        const roleObj = roleConfig[role] || { label: role, icon: ShieldCheck, color: "text-zinc-500", variant: "outline" }
                        const RoleIcon = roleObj.icon
                        const isSuspended = member.status === "suspended"

                        const initials = member.name
                          ? member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                          : member.email[0].toUpperCase()

                        return (
                          <div key={member._id} className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/10">
                            {/* Member Identity */}
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10 border border-border-light shadow-sm">
                                {member.avatar && <AvatarImage src={member.avatar} />}
                                <AvatarFallback className="bg-brand-green/10 text-brand-green-dark dark:text-brand-green font-bold text-xs">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={cn("text-sm font-extrabold text-foreground leading-none", isSuspended && "text-muted-foreground line-through")}>
                                    {member.name || member.email.split("@")[0]}
                                  </p>
                                  {isSuspended ? (
                                    <Badge className="bg-rose-500 text-white rounded text-[9px] scale-95 font-bold tracking-tight">
                                      Suspended
                                    </Badge>
                                  ) : isOwner ? (
                                    <Badge className="bg-amber-500 text-[#0F172A] rounded text-[9px] scale-95 font-bold tracking-tight">
                                      Workspace Owner
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-text-secondary leading-normal mt-0.5">{member.email}</p>
                              </div>
                            </div>

                            {/* Member Meta details */}
                            <div className="flex flex-wrap items-center gap-4 text-xs sm:justify-end">
                              {/* Role Badge */}
                              <div className="flex items-center gap-1">
                                <RoleIcon className={cn("size-3.5", roleObj.color)} />
                                <Badge variant={roleObj.variant as any} className="text-[10px] font-bold py-0.5 rounded px-2">
                                  {roleObj.label}
                                </Badge>
                              </div>

                              {/* Dates & Last Active */}
                              <div className="text-right hidden md:block">
                                <p className="text-[10px] text-text-secondary">
                                  Joined On
                                </p>
                                <p className="font-medium text-text-primary text-[11px]">
                                  {new Date(member.joinedAt || member.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                              </div>

                              <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-text-secondary">Last Active</p>
                                <p className="font-semibold text-brand-green-dark dark:text-brand-green text-[11px]">
                                  {member.lastActive
                                    ? new Date(member.lastActive).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : "Active Now"}
                                </p>
                              </div>

                              {/* Actions Dropdown */}
                              {canManageTeam && !isOwner && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-7 hover:bg-muted text-text-secondary cursor-pointer">
                                      <MoreHorizontal className="size-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-card border border-border-light shadow-md rounded-xl p-1">
                                    <DropdownMenuLabel className="text-[9px] uppercase tracking-wider text-text-secondary px-2">
                                      Collaborator Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingMember(member)
                                        setEditingRole(member.role)
                                        setEditingPermissions(member.customPermissions || [])
                                      }}
                                      className="flex items-center gap-2 text-xs rounded-lg cursor-pointer hover:bg-muted"
                                    >
                                      <Settings className="size-3.5" />
                                      <span>Configure Permissions</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleToggleSuspend(member)}
                                      className="flex items-center gap-2 text-xs rounded-lg cursor-pointer hover:bg-muted"
                                    >
                                      <Clock className="size-3.5" />
                                      <span>{isSuspended ? "Unsuspend Member" : "Suspend Member"}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border-light/60 my-1" />
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveMember(member._id)}
                                      className="flex items-center gap-2 text-xs rounded-lg cursor-pointer text-rose-500 hover:bg-rose-500/10 font-bold"
                                    >
                                      <Trash2 className="size-3.5" />
                                      <span>Remove Member</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )}

                {/* Pending Invitations Section */}
                {pendingInvitesList.length > 0 && (
                  <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md overflow-hidden mt-6">
                    <div className="px-4 py-3 bg-muted/15 border-b border-border/40 flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                        <Clock className="size-3.5 text-brand-green-dark" />
                        Pending Invitations ({pendingInvitesList.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-border/60">
                      {pendingInvitesList.map((invite) => {
                        const role = invite.role
                        const roleObj = roleConfig[role] || { label: role, icon: ShieldCheck, color: "text-zinc-500", variant: "outline" }
                        const RoleIcon = roleObj.icon

                        const remainingDays = invite.inviteExpiresAt
                          ? Math.max(0, Math.ceil((new Date(invite.inviteExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                          : 7

                        return (
                          <div key={invite._id} className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/10">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-extrabold text-foreground leading-none">
                                  {invite.email}
                                </p>
                                <Badge className="bg-zinc-500 text-white rounded text-[9px] scale-95 font-bold tracking-tight">
                                  Pending
                                </Badge>
                              </div>
                              <p className="text-[10px] text-text-secondary mt-1">
                                Invited: {new Date(invite.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} • Expires in {remainingDays} days
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs sm:justify-end">
                              <div className="flex items-center gap-1">
                                <RoleIcon className={cn("size-3.5", roleObj.color)} />
                                <Badge variant={roleObj.variant as any} className="text-[10px] font-bold py-0.5 rounded px-2">
                                  {roleObj.label}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyLink(invite.inviteToken)}
                                  title="Copy Invite Link"
                                  className="h-8 rounded-lg px-2 text-text-secondary hover:bg-muted flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedToken === invite.inviteToken ? (
                                    <>
                                      <Check className="size-3.5 text-emerald-500" />
                                      <span className="text-[10px] font-bold text-emerald-500">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Link2 className="size-3.5" />
                                      <span className="text-[10px]">Copy Link</span>
                                    </>
                                  )}
                                </Button>

                                {canManageTeam && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleResendInvite(invite._id)}
                                      title="Resend Invite"
                                      className="h-8 rounded-lg px-2 text-text-secondary hover:bg-muted flex items-center gap-1 text-xs cursor-pointer"
                                    >
                                      <RotateCcw className="size-3.5" />
                                      <span className="text-[10px]">Resend</span>
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(invite._id)}
                                      title="Cancel Invitation"
                                      className="h-8 rounded-lg px-2 text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 text-xs cursor-pointer"
                                    >
                                      <XCircle className="size-3.5" />
                                      <span className="text-[10px] font-bold">Cancel</span>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>
                )}

                {/* Edit Permissions Modal */}
                <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
                  <DialogContent className="max-w-md bg-card border border-border-light shadow-xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Settings className="size-5 text-brand-green-dark" />
                        Configure Member Permissions
                      </DialogTitle>
                      <DialogDescription className="text-xs text-text-secondary">
                        Adjust role permissions overrides for {editingMember?.email}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-primary">Member Role</label>
                        <Select value={editingRole} onValueChange={(val) => {
                          setEditingRole(val)
                          const staticPerms: Record<string, string[]> = {
                            "owner": permissionOptions.map(p => p.key),
                            "Workspace Owner": permissionOptions.map(p => p.key),
                            "Workspace Manager": ["dashboard", "posts", "scheduling", "analytics", "ai-assistant", "media-library", "channels", "inbox", "team", "settings"],
                            "Content Manager": ["dashboard", "posts", "scheduling", "ai-assistant", "media-library"],
                            "Editor": ["dashboard", "posts", "media-library"],
                            "Analyst": ["dashboard", "analytics", "inbox"],
                            "Viewer": ["dashboard"],
                          }
                          if (staticPerms[val]) {
                            setEditingPermissions(staticPerms[val])
                          } else {
                            const match = customRoles.find(r => r.name === val)
                            setEditingPermissions(match ? match.permissions : [])
                          }
                        }}>
                          <SelectTrigger className="w-full rounded-xl border-border text-xs h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(userRole === "owner" || userRole === "Workspace Owner") && (
                              <SelectItem value="Workspace Owner" className="text-xs">Workspace Owner (Transfer)</SelectItem>
                            )}
                            <SelectItem value="Workspace Manager" className="text-xs">Workspace Manager</SelectItem>
                            <SelectItem value="Content Manager" className="text-xs">Content Manager</SelectItem>
                            <SelectItem value="Editor" className="text-xs">Editor</SelectItem>
                            <SelectItem value="Analyst" className="text-xs">Analyst</SelectItem>
                            <SelectItem value="Viewer" className="text-xs">Viewer</SelectItem>
                            {customRoles.map((cr) => (
                              <SelectItem key={cr.name} value={cr.name} className="text-xs">
                                {cr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Configurable Permissions Checklist for editing */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-primary">
                          Configured Permissions Matrix
                        </label>
                        <div className="max-h-48 overflow-y-auto border border-border/60 rounded-xl p-2 bg-muted/20 space-y-2.5">
                          {permissionOptions.map((opt) => {
                            const isChecked = editingPermissions.includes(opt.key)
                            return (
                              <div key={opt.key} className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id={`edit-perm-${opt.key}`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditingPermissions([...editingPermissions, opt.key])
                                    } else {
                                      setEditingPermissions(editingPermissions.filter((p) => p !== opt.key))
                                    }
                                  }}
                                  className="mt-0.5 rounded border-border size-3.5 accent-brand-green cursor-pointer"
                                />
                                <div className="space-y-0.5 leading-none">
                                  <label
                                    htmlFor={`edit-perm-${opt.key}`}
                                    className="text-xs font-bold text-text-primary cursor-pointer"
                                  >
                                    {opt.label}
                                  </label>
                                  <p className="text-[10px] text-text-secondary leading-normal">{opt.desc}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2.5">
                      <Button variant="outline" onClick={() => setEditingMember(null)} className="rounded-xl text-xs h-9">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveMemberEdit}
                        className="bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold border-0 rounded-xl text-xs h-9 cursor-pointer"
                      >
                        Save Configurations
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {/* Tab 2: Custom Roles Manager */}
            {activeTab === "roles" && canManageTeam && (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Create Custom Role panel */}
                <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm font-extrabold flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-brand-green-dark" />
                      Configure Custom Role
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Build custom team roles with selected permissions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateCustomRole} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-text-primary">Role Name</label>
                        <Input
                          required
                          placeholder="e.g. Marketing Lead, Partner"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          className="rounded-xl border-border text-xs h-9"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-primary">Configure Permissions Matrix</label>
                        <div className="max-h-64 overflow-y-auto border border-border/60 rounded-xl p-2 bg-muted/20 space-y-2.5">
                          {permissionOptions.map((opt) => {
                            const isChecked = newRolePermissions.includes(opt.key)
                            return (
                              <div key={opt.key} className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  id={`role-perm-${opt.key}`}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewRolePermissions([...newRolePermissions, opt.key])
                                    } else {
                                      setNewRolePermissions(newRolePermissions.filter((p) => p !== opt.key))
                                    }
                                  }}
                                  className="mt-0.5 rounded border-border size-3.5 accent-brand-green cursor-pointer"
                                />
                                <div className="space-y-0.5 leading-none">
                                  <label
                                    htmlFor={`role-perm-${opt.key}`}
                                    className="text-xs font-bold text-text-primary cursor-pointer"
                                  >
                                    {opt.label}
                                  </label>
                                  <p className="text-[10px] text-text-secondary leading-normal">{opt.desc}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={!newRoleName}
                        className="w-full bg-brand-green hover:bg-brand-green-hover text-[#0F172A] font-bold border-0 rounded-xl text-xs py-5 cursor-pointer shadow"
                      >
                        Configure Role Matrix
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* List Custom Roles */}
                <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md md:col-span-2 overflow-hidden">
                  <div className="px-4 py-3 bg-muted/15 border-b border-border/40">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                      Active Custom Workspace Roles ({customRoles.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-border/60">
                    {customRoles.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground">
                        No custom roles configured yet. Start building custom team roles above.
                      </div>
                    ) : (
                      customRoles.map((role) => (
                        <div key={role._id} className="p-4 space-y-3 transition-colors hover:bg-muted/10">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Badge className="bg-brand-green/20 text-brand-green-dark dark:text-brand-green rounded text-[10px] px-2 py-0.5 font-extrabold border border-brand-green/30">
                                {role.name}
                              </Badge>
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCustomRole(role.name)}
                              className="size-7 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title="Delete custom role"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {role.permissions.map((permKey: string) => {
                              const match = permissionOptions.find(p => p.key === permKey)
                              return (
                                <Badge key={permKey} variant="outline" className="text-[9px] rounded py-0 px-2 font-medium bg-muted/40 border-border/80 text-text-primary">
                                  {match ? match.label : permKey}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Tab 3: Workspace Activity Feed */}
            {activeTab === "activity" && (
              <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md overflow-hidden">
                <div className="px-4 py-3 bg-muted/15 border-b border-border/40">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Activity className="size-3.5 text-brand-green-dark" />
                    Workspace Activity logs ({activities.length})
                  </h3>
                </div>
                <div className="divide-y divide-border/60 max-h-[60vh] overflow-y-auto pr-1">
                  {activities.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No activities logged yet. Collaborative campaign events will record here.
                    </div>
                  ) : (
                    activities.map((act) => {
                      const initials = act.memberName
                        ? act.memberName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                        : "U"
                      return (
                        <div key={act._id} className="p-4 flex items-start gap-3 transition-colors hover:bg-muted/10">
                          <Avatar className="size-8 shrink-0 border border-border-light shadow-sm">
                            {act.memberAvatar && <AvatarImage src={act.memberAvatar} />}
                            <AvatarFallback className="bg-brand-green/10 text-brand-green-dark font-bold text-[10px]">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{act.memberName}</span>
                              <span className="text-[9px] text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(act.createdAt).toLocaleDateString()} {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {act.platform && (
                                <Badge variant="outline" className="text-[8px] uppercase tracking-tight font-black rounded px-1 text-sky-500 border-sky-500/20 bg-sky-500/5">
                                  {act.platform}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-text-primary leading-normal">{act.details}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>
            )}

            {/* Tab 4: Collaboration Analytics */}
            {activeTab === "analytics" && (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Collaboration Score card */}
                {analytics && (
                  <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md md:col-span-1 text-center py-6 flex flex-col justify-between">
                    <CardHeader className="p-0">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                        Team Collaboration Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col items-center justify-center space-y-4 my-auto">
                      <div className="relative size-32 flex items-center justify-center">
                        <svg className="size-full -rotate-90">
                           <circle
                            cx="64"
                            cy="64"
                            r="54"
                            className="stroke-muted fill-none stroke-[8px]"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            className="stroke-brand-green fill-none stroke-[8px] transition-all duration-1000 ease-in-out"
                            strokeDasharray={339.29}
                            strokeDashoffset={339.29 - (339.29 * analytics.collaborationScore) / 100}
                          />
                        </svg>
                        <div className="absolute text-center">
                          <h1 className="text-3xl font-extrabold leading-none">{analytics.collaborationScore}</h1>
                          <p className="text-[8px] font-bold uppercase tracking-wider text-brand-green-dark dark:text-brand-green mt-1">
                            A+ Rating
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-normal max-w-[200px]">
                        Aggregates member density, queue monitors, campaign creations, and review responsiveness.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Performance stats cards */}
                {analytics && (
                  <Card className="border-border/60 rounded-xl bg-card/40 backdrop-blur-md md:col-span-2 overflow-hidden">
                    <div className="px-4 py-3 bg-muted/15 border-b border-border/40">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                        Productivity & Collaboration Insights
                      </h3>
                    </div>
                    <div className="p-6 grid gap-6 sm:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                          <Crown className="size-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">
                            Most Active Collaborator
                          </p>
                          <h4 className="text-sm font-extrabold text-foreground mt-0.5">
                            {analytics.mostActiveMember}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                          <CheckCircle2 className="size-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">
                            Draft Approvals Completed
                          </p>
                          <h4 className="text-sm font-extrabold text-foreground mt-0.5">
                            {analytics.approvalsCompleted} Posts Approved
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                          <Clock className="size-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">
                            Average Review Time
                          </p>
                          <h4 className="text-sm font-extrabold text-foreground mt-0.5">
                            {analytics.averageResponseTimeMins} Minutes
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                          <Sparkles className="size-5" />
                        </div>
                        <div>
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">
                            Team AI Writing Usage
                          </p>
                          <h4 className="text-sm font-extrabold text-foreground mt-0.5">
                            {analytics.aiUsageCount} Generations
                          </h4>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
