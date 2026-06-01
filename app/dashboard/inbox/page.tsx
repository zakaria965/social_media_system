"use client"

import { useState } from "react"
import { Send, Search, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/dashboard/page-transition"
import { cn } from "@/lib/utils"

const conversations = [
  {
    id: "1",
    name: "Sarah Johnson",
    platform: "Instagram",
    avatar: "SJ",
    lastMessage: "Love this content! When is the next post coming?",
    time: "2 min ago",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "Michael Chen",
    platform: "Twitter",
    avatar: "MC",
    lastMessage: "Thanks for the follow-up! I'll check it out.",
    time: "1 hour ago",
    unread: 0,
    online: false,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    platform: "LinkedIn",
    avatar: "ER",
    lastMessage: "Great article! Would love to collaborate on a project.",
    time: "3 hours ago",
    unread: 1,
    online: true,
  },
  {
    id: "4",
    name: "David Kim",
    platform: "Facebook",
    avatar: "DK",
    lastMessage: "Can you share more details about the pricing?",
    time: "1 day ago",
    unread: 0,
    online: false,
  },
]

export default function InboxPage() {
  const [activeChat, setActiveChat] = useState(conversations[0])
  const [message, setMessage] = useState("")

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage audience engagement across all platforms.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-xl border-border/60 lg:col-span-1">
          <CardHeader className="border-b border-border/60">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="h-9 rounded-full border-border/60 bg-muted/50 pl-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveChat(conv)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    activeChat.id === conv.id && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{conv.avatar}</AvatarFallback>
                    </Avatar>
                    {conv.online && (
                      <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{conv.name}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge className="size-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {conv.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">{activeChat.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{activeChat.name}</p>
                <p className="text-xs text-muted-foreground">{activeChat.platform}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <div className="flex h-[300px] flex-col justify-end space-y-3">
              {[
                { side: "left", text: "Hi! I love your content. Keep it up! 👏", time: "10:32 AM" },
                { side: "right", text: "Thank you so much! Really appreciate the support 🙌", time: "10:35 AM" },
                { side: "left", text: "Would you be interested in collaborating on a project?", time: "10:38 AM" },
                { side: "right", text: "Absolutely! I'd love to hear more about it.", time: "10:40 AM" },
                { side: "left", text: activeChat.lastMessage, time: "10:42 AM" },
              ].map((msg, i) => (
                <div key={i} className={cn("flex", msg.side === "right" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    msg.side === "right"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    <p>{msg.text}</p>
                    <p className={cn(
                      "mt-0.5 text-[10px]",
                      msg.side === "right" ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="flex items-center gap-2 border-t border-border/60 p-4">
            <Textarea
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-0 flex-1 resize-none rounded-xl border-border/60 bg-muted/30 text-sm"
              rows={1}
            />
            <Button size="icon" className="shrink-0 rounded-xl" disabled={!message}>
              <Send className="size-4" />
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  )
}
