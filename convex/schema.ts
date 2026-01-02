import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("seller"), v.literal("buyer")),
    fullName: v.string(),
    phoneNumber: v.optional(v.string()),
    location: v.optional(v.string()),
    businessName: v.optional(v.string()), // For sellers
    farmSize: v.optional(v.string()), // For sellers
    cropTypes: v.optional(v.array(v.string())), // For sellers
    preferredProducts: v.optional(v.array(v.string())), // For buyers
  }).index("by_user_id", ["userId"]),

  products: defineTable({
    sellerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // Price per unit
    unit: v.string(), // e.g., "lb", "kg", "dozen", "head"
    category: v.string(), // e.g., "vegetables", "fruits", "grains", "dairy"
    stockQuantity: v.number(),
    isActive: v.boolean(),
    imageEmoji: v.string(), // For now using emojis as images
  }).index("by_seller", ["sellerId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  orders: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    unitPrice: v.number(),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    orderDate: v.number(),
    deliveryAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_product", ["productId"]),

  vegPrices: defineTable({
    vegetable: v.string(),
    location: v.string(),
    date: v.string(), // YYYY-MM-DD format
    price: v.number(), // Price per kg in rupees
    source: v.string(), // Source of the price data
    timestamp: v.number(), // Unix timestamp
  }).index("by_vegetable_location", ["vegetable", "location"])
    .index("by_date", ["date"])
    .index("by_vegetable_location_date", ["vegetable", "location", "date"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    lastMessageTime: v.number(),
    lastMessage: v.optional(v.string()),
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("image")),
    isRead: v.boolean(),
  }).index("by_conversation", ["conversationId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
} as any);
