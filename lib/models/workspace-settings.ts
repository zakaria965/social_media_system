import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPromptTemplate {
  name: string
  prompt: string
}

export interface IWebhookItem {
  url: string
  events: string[]
  active: boolean
}

export interface IApiKeyItem {
  name: string
  key: string
  createdAt: Date
}

export interface IInvoiceItem {
  id: string
  date: string
  amount: number
  status: "paid" | "open" | "uncollectible"
}

export interface IPaymentMethodItem {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  default: boolean;
}

export interface IWorkspaceSettings extends Document {
  workspaceId: mongoose.Types.ObjectId
  
  // Publishing
  defaultPublishTime: string
  autoPublish: boolean
  approvalRequired: boolean
  draftWorkflow: boolean
  queuePreferences: {
    postingFrequency: number
    gapMinutes: number
  }
  retryFailedPosts: boolean
  autoRetryDelay: number

  // AI Settings
  aiEnabled: boolean
  modelSelection: string
  brandVoice: string
  contentTone: string
  hashtagSuggestions: boolean
  captionSuggestions: boolean
  promptTemplates: IPromptTemplate[]
  aiLanguage: string

  // Notification Rules
  emailNotifications: boolean
  pushNotifications: boolean
  publishingAlerts: boolean
  failedPostAlerts: boolean
  commentAlerts: boolean
  mentionAlerts: boolean
  teamAlerts: boolean
  securityAlerts: boolean

  // Team & Permissions
  defaultRole: string
  invitePermissions: "owner" | "admin" | "any"
  approvalWorkflow: boolean
  contentReviewRules: string
  roleTemplates: any

  // Analytics Settings
  analyticsDefaultDateRange: string
  reportingSchedule: "none" | "weekly" | "monthly"
  weeklyReports: boolean
  monthlyReports: boolean
  exportFormat: "pdf" | "csv" | "xlsx"
  analyticsTimezone: string

  // Billing (Subscription Management)
  currentPlan: "free" | "pro" | "enterprise"
  storageUsage: number
  storageLimit: number
  connectedAccountsLimit: number
  publishedPostsCount: number
  aiUsageCount: number
  aiUsageLimit: number
  invoices: IInvoiceItem[]
  paymentMethods: IPaymentMethodItem[]

  // Integrations Settings
  metaGraphApiStatus: "connected" | "disconnected" | "error"
  linkedinApiStatus: "connected" | "disconnected" | "error"
  tiktokApiStatus: "connected" | "disconnected" | "error"
  twitterApiStatus: "connected" | "disconnected" | "error"
  openaiApiStatus: "connected" | "disconnected" | "error"
  webhooks: IWebhookItem[]
  apiKeys: IApiKeyItem[]

  createdAt: Date
  updatedAt: Date
}

const PromptTemplateSchema = new Schema<IPromptTemplate>({
  name: { type: String, required: true },
  prompt: { type: String, required: true },
})

const WebhookItemSchema = new Schema<IWebhookItem>({
  url: { type: String, required: true },
  events: [{ type: String }],
  active: { type: Boolean, default: true },
})

const ApiKeyItemSchema = new Schema<IApiKeyItem>({
  name: { type: String, required: true },
  key: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  id: { type: String, required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["paid", "open", "uncollectible"], default: "paid" },
})

const PaymentMethodItemSchema = new Schema<IPaymentMethodItem>({
  brand: { type: String, required: true },
  last4: { type: String, required: true },
  expMonth: { type: Number, required: true },
  expYear: { type: Number, required: true },
  default: { type: Boolean, default: false },
})

const WorkspaceSettingsSchema = new Schema<IWorkspaceSettings>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true, index: true },
    
    // Publishing
    defaultPublishTime: { type: String, default: "09:00" },
    autoPublish: { type: Boolean, default: true },
    approvalRequired: { type: Boolean, default: false },
    draftWorkflow: { type: Boolean, default: false },
    queuePreferences: {
      type: {
        postingFrequency: { type: Number, default: 3 },
        gapMinutes: { type: Number, default: 180 },
      },
      default: { postingFrequency: 3, gapMinutes: 180 },
    },
    retryFailedPosts: { type: Boolean, default: true },
    autoRetryDelay: { type: Number, default: 15 },

    // AI Settings
    aiEnabled: { type: Boolean, default: true },
    modelSelection: { type: String, default: "gpt-4o" },
    brandVoice: { type: String, default: "" },
    contentTone: { type: String, default: "professional" },
    hashtagSuggestions: { type: Boolean, default: true },
    captionSuggestions: { type: Boolean, default: true },
    promptTemplates: {
      type: [PromptTemplateSchema],
      default: [
        { name: "Viral Hook Generator", prompt: "Write 3 attention-grabbing hooks based on the topic..." },
        { name: "SaaS Thread Outliner", prompt: "Draft a high-value Twitter thread outlining the key steps of..." },
      ],
    },
    aiLanguage: { type: String, default: "English (US)" },

    // Notifications
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: false },
    publishingAlerts: { type: Boolean, default: true },
    failedPostAlerts: { type: Boolean, default: true },
    commentAlerts: { type: Boolean, default: true },
    mentionAlerts: { type: Boolean, default: true },
    teamAlerts: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },

    // Team & Permissions
    defaultRole: { type: String, default: "viewer" },
    invitePermissions: { type: String, default: "admin" },
    approvalWorkflow: { type: Boolean, default: false },
    contentReviewRules: { type: String, default: "" },
    roleTemplates: { type: Schema.Types.Mixed, default: {} },

    // Analytics
    analyticsDefaultDateRange: { type: String, default: "30d" },
    reportingSchedule: { type: String, enum: ["none", "weekly", "monthly"], default: "none" },
    weeklyReports: { type: Boolean, default: false },
    monthlyReports: { type: Boolean, default: false },
    exportFormat: { type: String, enum: ["pdf", "csv", "xlsx"], default: "pdf" },
    analyticsTimezone: { type: String, default: "UTC" },

    // Billing
    currentPlan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
    storageUsage: { type: Number, default: 0 },
    storageLimit: { type: Number, default: 104857600 }, // 100MB
    connectedAccountsLimit: { type: Number, default: 3 },
    publishedPostsCount: { type: Number, default: 0 },
    aiUsageCount: { type: Number, default: 0 },
    aiUsageLimit: { type: Number, default: 100 },
    invoices: {
      type: [InvoiceItemSchema],
      default: [],
    },
    paymentMethods: {
      type: [PaymentMethodItemSchema],
      default: [],
    },

    // Integrations
    metaGraphApiStatus: { type: String, enum: ["connected", "disconnected", "error"], default: "disconnected" },
    linkedinApiStatus: { type: String, enum: ["connected", "disconnected", "error"], default: "disconnected" },
    tiktokApiStatus: { type: String, enum: ["connected", "disconnected", "error"], default: "disconnected" },
    twitterApiStatus: { type: String, enum: ["connected", "disconnected", "error"], default: "disconnected" },
    openaiApiStatus: { type: String, enum: ["connected", "disconnected", "error"], default: "disconnected" },
    webhooks: {
      type: [WebhookItemSchema],
      default: [],
    },
    apiKeys: {
      type: [ApiKeyItemSchema],
      default: [],
    },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.WorkspaceSettings) {
  delete (mongoose.models as any).WorkspaceSettings
}

export const WorkspaceSettings: Model<IWorkspaceSettings> =
  mongoose.models.WorkspaceSettings ??
  mongoose.model<IWorkspaceSettings>("WorkspaceSettings", WorkspaceSettingsSchema)
