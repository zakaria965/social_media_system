"use client"

import { useState } from "react"
import {
  Users,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  Pencil,
  Eye,
  Crown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"

const roleConfig = {
  owner: { label: "Owner", icon: Crown, color: "text-yellow-500", variant: "default" as const },
  admin: { label: "Admin", icon: ShieldCheck, color: "text-blue-500", variant: "secondary" as const },
  editor: { label: "Editor", icon: Pencil, color: "text-primary", variant: "outline" as const },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground", variant: "ghost" as const },
} as const

const teamMembers = [
  { id: "1", name: "You", email: "you@growwave.app", role: "owner" as const, avatar: "YO", joinedAt: "Jan 2026" },
  { id: "2", name: "Sarah Chen", email: "sarah@agency.com", role: "admin" as const, avatar: "SC", joinedAt: "Feb 2026" },
  { id: "3", name: "Alex Thompson", email: "alex@agency.com", role: "editor" as const, avatar: "AT", joinedAt: "Mar 2026" },
  { id: "4", name: "Maria Garcia", email: "maria@agency.com", role: "editor" as const, avatar: "MG", joinedAt: "Apr 2026" },
  { id: "5", name: "James Wilson", email: "james@agency.com", role: "viewer" as const, avatar: "JW", joinedAt: "Apr 2026" },
]

export default function TeamPage() {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("editor")

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collaborate with your team on content and campaigns.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-lg">
              <UserPlus className="size-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email address</label>
                <Input
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Role</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-lg">Cancel</Button>
              <Button className="rounded-lg" disabled={!inviteEmail}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-xl border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            Team Members ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {teamMembers.map((member) => {
              const role = roleConfig[member.role]
              const RoleIcon = role.icon
              return (
                <div key={member.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        {member.role === "owner" && (
                          <Crown className="size-3.5 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 sm:flex">
                      <RoleIcon className={cn("size-3.5", role.color)} />
                      <Badge variant={role.variant} className="text-xs">
                        {role.label}
                      </Badge>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {member.joinedAt}
                    </span>
                    {member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-xs">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  )
}
