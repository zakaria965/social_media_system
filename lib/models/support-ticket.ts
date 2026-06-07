import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITicketMessage {
  sender: string
  content: string
  timestamp: Date
}

export interface ISupportTicket extends Document {
  ticketId: string
  userId: string
  userEmail: string
  subject: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "OPEN" | "PENDING" | "CLOSED"
  assignedTo: string
  messages: ITicketMessage[]
  internalNotes: string
  createdAt: Date
  updatedAt: Date
}

const TicketMessageSchema = new Schema<ITicketMessage>({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
    status: { type: String, enum: ["OPEN", "PENDING", "CLOSED"], default: "OPEN" },
    assignedTo: { type: String, default: "Unassigned" },
    messages: [TicketMessageSchema],
    internalNotes: { type: String, default: "" },
  },
  { timestamps: true }
)

if (mongoose.models && mongoose.models.SupportTicket) {
  delete (mongoose.models as any).SupportTicket
}

export const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ?? mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema)
