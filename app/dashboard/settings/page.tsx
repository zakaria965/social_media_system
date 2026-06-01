"use client"

import { useState } from "react"
import {
  User,
  Lock,
  Bell,
  Palette,
  CreditCard,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PageTransition } from "@/components/dashboard/page-transition"
import { useTheme } from "@/components/dashboard/theme-provider"

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const [name, setName] = useState("Alex Morgan")
  const [email, setEmail] = useState("alex@growwave.app")

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and workspace preferences.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-2"><User className="size-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="password" className="gap-2"><Lock className="size-3.5" /> Password</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="size-3.5" /> Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="size-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard className="size-3.5" /> Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">AM</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="rounded-lg">
                    Change photo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Full name</Label>
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl border-border/60"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-bio">Bio</Label>
                <textarea
                  id="settings-bio"
                  rows={3}
                  className="w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm resize-y"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <Button className="rounded-xl">Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current password</Label>
                <Input type="password" className="rounded-xl border-border/60" />
              </div>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input type="password" className="rounded-xl border-border/60" />
              </div>
              <div className="space-y-2">
                <Label>Confirm new password</Label>
                <Input type="password" className="rounded-xl border-border/60" />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• At least 8 characters</p>
                <p>• One uppercase letter</p>
                <p>• One number</p>
                <p>• One special character</p>
              </div>
              <Button className="rounded-xl">Update password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="size-5 text-foreground" /> : <Sun className="size-5 text-foreground" />}
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggle} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Language</Label>
                <select className="w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm">
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Post Published", desc: "When a post is successfully published" },
                { label: "Post Failed", desc: "When a scheduled post fails to publish" },
                { label: "New Comments", desc: "When someone comments on your posts" },
                { label: "Team Activity", desc: "When team members create or edit content" },
                { label: "Email Notifications", desc: "Receive notification emails" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="rounded-xl border-border/60">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Pro Plan</p>
                    <p className="text-xs text-muted-foreground">$29/month · Next billing: Jun 23, 2026</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-sm text-foreground">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/28</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl">Change plan</Button>
                <Button variant="outline" className="rounded-xl">Update payment</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}
