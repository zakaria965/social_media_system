const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Parse .env file manually for database connection URI
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017/social_media";

// 2. Define Mongoose Schemas dynamically to prevent TS loader overhead
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  username: { type: String, default: "" },
  passwordHash: { type: String, default: null },
  role: { type: String, default: "USER" },
  status: { type: String, default: "ACTIVE" },
  plan: { type: String, default: "FREE" },
  subscriptionStatus: { type: String, default: "ACTIVE" },
  googleConnected: { type: Boolean, default: false },
  activeSessions: { type: Array, default: [] },
  loginHistory: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerEmail: { type: String, required: true },
}, { timestamps: true });

const Workspace = mongoose.models.Workspace || mongoose.model("Workspace", WorkspaceSchema);

const SupportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  subject: { type: String, required: true },
  priority: { type: String, default: "MEDIUM" },
  status: { type: String, default: "OPEN" },
  assignedTo: { type: String, default: "Unassigned" },
  messages: { type: Array, default: [] },
  internalNotes: { type: String, default: "" },
}, { timestamps: true });

const SupportTicket = mongoose.models.SupportTicket || mongoose.model("SupportTicket", SupportTicketSchema);

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actor: { type: String, required: true },
  resource: { type: String, required: true },
  ipAddress: { type: String, default: "127.0.0.1" },
  details: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

const PlatformSettingsSchema = new mongoose.Schema({
  openaiKey: { type: String, default: "" },
  openaiModel: { type: String, default: "gpt-4o-mini" },
  openaiTokenLimit: { type: Number, default: 500000 },
  openaiEmergencyShutdown: { type: Boolean, default: false },
  openaiUsageAlerts: { type: Boolean, default: true },
  openaiMonthlyBudget: { type: Number, default: 100 },
  fbAppId: { type: String, default: "" },
  fbAppSecret: { type: String, default: "" },
  fbGraphVersion: { type: String, default: "v20.0" },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

const PlatformSettings = mongoose.models.PlatformSettings || mongoose.model("PlatformSettings", PlatformSettingsSchema);

const PaymentSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "SUCCESS" },
  plan: { type: String, default: "FREE" },
  billingCycle: { type: String, default: "free" },
}, { timestamps: true });

const Payment = mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

const AILogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  provider: { type: String, required: true },
  action: { type: String, required: true },
  tokensUsed: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  responseTimeMs: { type: Number, default: 0 },
  status: { type: String, default: "success" },
  createdAt: { type: Date, default: Date.now }
});

const AILog = mongoose.models.AILog || mongoose.model("AILog", AILogSchema);

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, default: "FREE" },
  status: { type: String, default: "ACTIVE" },
  billingCycle: { type: String, default: "free" },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true });

const Subscription = mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);

async function seed() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URL}...`);
  await mongoose.connect(MONGODB_URL);

  // 3. Seed Platform settings
  console.log("Seeding Platform Settings...");
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({
      openaiKey: process.env.OPENAI_API_KEY || "sk-svcacct-placeholder",
      openaiModel: "gpt-4o-mini",
      openaiTokenLimit: 500000,
      openaiEmergencyShutdown: false,
      openaiUsageAlerts: true,
      openaiMonthlyBudget: 100,
      fbAppId: process.env.FACEBOOK_APP_ID || "2361932354276346",
      fbAppSecret: process.env.FACEBOOK_APP_SECRET || "c29fae905daa3b111cba0a054c9fa3c4",
      fbGraphVersion: "v20.0",
      maintenanceMode: false
    });
    console.log("Settings seeded.");
  } else {
    console.log("Settings already exist.");
  }

  // 4. Seed Admin user
  console.log("Seeding Admin user...");
  const adminEmail = "growadmin@gmail.com";
  const adminPassword = "growadmin123";
  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  const existingAdmin = await User.findOne({ email: adminEmail });
  let adminId;

  if (!existingAdmin) {
    const adminUser = await User.create({
      email: adminEmail,
      name: "GrowWave Admin",
      username: "growadmin",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
      googleConnected: false,
      activeSessions: [],
      loginHistory: [
        {
          id: "log_init",
          device: "Desktop / Chrome",
          browser: "Chrome",
          ip: "127.0.0.1",
          location: "Local Host",
          timestamp: new Date(),
          status: "success"
        }
      ]
    });
    adminId = adminUser._id.toString();
    console.log(`Admin account created!`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } else {
    adminId = existingAdmin._id.toString();
    existingAdmin.role = "ADMIN";
    existingAdmin.status = "ACTIVE";
    existingAdmin.passwordHash = passwordHash;
    await existingAdmin.save();
    console.log("Admin account role updated/verified.");
  }

  // Seed default Admin Workspace
  let adminWs = await Workspace.findOne({ ownerEmail: adminEmail });
  if (!adminWs) {
    adminWs = await Workspace.create({
      name: "Admin Workspace",
      ownerEmail: adminEmail
    });
    console.log("Admin default workspace created.");
  }

  // Seed Admin Subscription
  let adminSub = await Subscription.findOne({ userId: adminId });
  if (!adminSub) {
    await Subscription.create({
      userId: adminId,
      plan: "PRO",
      status: "ACTIVE",
      billingCycle: "monthly",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    console.log("Admin subscription seeded.");
  }

  // 5. Seed Demo SaaS User
  console.log("Seeding Demo SaaS User...");
  const demoEmail = "demouser@gmail.com";
  const demoPassword = "demouser123";
  const demoHash = bcrypt.hashSync(demoPassword, 10);

  let demoUser = await User.findOne({ email: demoEmail });
  if (!demoUser) {
    demoUser = await User.create({
      email: demoEmail,
      name: "John Doe",
      username: "johndoe",
      passwordHash: demoHash,
      role: "USER",
      status: "ACTIVE",
      plan: "FREE",
      subscriptionStatus: "ACTIVE",
      googleConnected: false,
      activeSessions: [
        {
          id: "session_demo_1",
          device: "Apple iPhone",
          browser: "Mobile Safari",
          ip: "127.0.0.1",
          location: "Local Host",
          lastActive: new Date(),
          current: true
        }
      ],
      loginHistory: [
        {
          id: "log_demo_1",
          device: "Apple iPhone",
          browser: "Mobile Safari",
          ip: "127.0.0.1",
          location: "Local Host",
          timestamp: new Date(),
          status: "success"
        }
      ]
    });
    console.log(`Demo user account created!`);
    console.log(`Email: ${demoEmail}`);
    console.log(`Password: ${demoPassword}`);

    await Workspace.create({
      name: "John's Workspace",
      ownerEmail: demoEmail
    });

    await Subscription.create({
      userId: demoUser._id,
      plan: "FREE",
      status: "ACTIVE",
      billingCycle: "free"
    });
  }

  const demoUserId = demoUser._id.toString();

  // 6. Seed Demo Payments/Transactions
  console.log("Seeding Demo Transactions...");
  const existingPayments = await Payment.countDocuments();
  if (existingPayments === 0) {
    await Payment.create([
      {
        transactionId: "txn_001",
        userId: adminId,
        userEmail: adminEmail,
        amount: 15.00,
        status: "SUCCESS",
        plan: "PRO",
        billingCycle: "monthly",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        transactionId: "txn_002",
        userId: demoUserId,
        userEmail: demoEmail,
        amount: 15.00,
        status: "FAILED",
        plan: "PRO",
        billingCycle: "monthly",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        transactionId: "txn_003",
        userId: demoUserId,
        userEmail: demoEmail,
        amount: 15.00,
        status: "REFUNDED",
        plan: "PRO",
        billingCycle: "monthly",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log("Demo payments seeded.");
  }

  // 7. Seed Demo Support Tickets
  console.log("Seeding Demo Tickets...");
  const existingTickets = await SupportTicket.countDocuments();
  if (existingTickets === 0) {
    await SupportTicket.create([
      {
        ticketId: "TCK-4819",
        userId: demoUserId,
        userEmail: demoEmail,
        subject: "Cannot connect LinkedIn channel",
        priority: "HIGH",
        status: "OPEN",
        assignedTo: "Unassigned",
        messages: [
          {
            sender: "John Doe",
            content: "Hey, I tried to link my LinkedIn page but keep getting a token error on redirect. Can you help?",
            timestamp: new Date(Date.now() - 2 * 3600 * 1000)
          }
        ],
        internalNotes: "Reviewing Graph API version updates."
      },
      {
        ticketId: "TCK-8821",
        userId: demoUserId,
        userEmail: demoEmail,
        subject: "Billing charge clarification",
        priority: "LOW",
        status: "CLOSED",
        assignedTo: "Admin Agent 1",
        messages: [
          {
            sender: "John Doe",
            content: "Why was I charged $15? I thought I was on the trial plan.",
            timestamp: new Date(Date.now() - 12 * 24 * 3600 * 1000)
          },
          {
            sender: "GrowWave Support (Admin)",
            content: "Hello, you upgraded your workspace manual subscription to PRO on June 1st. Please let us know if you need us to refund this manual subscription.",
            timestamp: new Date(Date.now() - 11 * 24 * 3600 * 1000)
          }
        ],
        internalNotes: "Billing resolved."
      }
    ]);
    console.log("Demo support tickets seeded.");
  }

  // 8. Seed AI Logs
  console.log("Seeding AI logs...");
  const existingAiLogs = await AILog.countDocuments();
  if (existingAiLogs === 0) {
    await AILog.create([
      {
        userId: demoUserId,
        provider: "openai",
        action: "generate-caption",
        tokensUsed: 450,
        cost: 0.0009,
        responseTimeMs: 820,
        status: "success",
        createdAt: new Date(Date.now() - 1 * 3600 * 1000)
      },
      {
        userId: demoUserId,
        provider: "openai",
        action: "generate-hashtags",
        tokensUsed: 210,
        cost: 0.0004,
        responseTimeMs: 450,
        status: "success",
        createdAt: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        userId: demoUserId,
        provider: "openai",
        action: "content-ideas",
        tokensUsed: 980,
        cost: 0.0019,
        responseTimeMs: 1450,
        status: "success",
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000)
      }
    ]);
    console.log("AI logs seeded.");
  }

  // 9. Seed Audit Logs
  console.log("Seeding Audit logs...");
  await AuditLog.create({
    action: "SEED_DATABASE",
    actor: "system",
    resource: "System",
    ipAddress: "127.0.0.1",
    details: "Initialized database seed with admin and saas demo configurations",
    timestamp: new Date()
  });

  console.log("Database seeded successfully!");
  mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
