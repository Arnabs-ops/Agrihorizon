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
    tutorialProgress: v.optional(v.object({
      hasSeenWelcome: v.boolean(),
      hasCompletedTour: v.boolean(),
      completedSteps: v.array(v.string()),
      dismissedChecklist: v.boolean(),
      lastTutorialDate: v.number(),
    })),
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
    imageStorageId: v.optional(v.id("_storage")),
    priceTiers: v.optional(v.array(v.object({ minQuantity: v.number(), price: v.number() }))),
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
    isPaid: v.optional(v.boolean()),
    paymentDate: v.optional(v.number()),
    driverName: v.optional(v.string()),
    driverPhone: v.optional(v.string()),
    deliveryStep: v.optional(v.union(
      v.literal("assigning"),
      v.literal("picking_up"),
      v.literal("delivering"),
      v.literal("delivered")
    )),
  }).index("by_buyer", ["buyerId"])
    .index("by_seller", ["sellerId"])
    .index("by_status", ["status"])
    .index("by_product", ["productId"])
    .index("by_paid", ["isPaid"]),

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

  reviews: defineTable({
    productId: v.id("products"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    rating: v.number(), // 1 to 5
    comment: v.string(),
    createdAt: v.number(),
  }).index("by_product", ["productId"])
    .index("by_seller", ["sellerId"]),
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("order_new"), v.literal("order_status"), v.literal("review_new"), v.literal("message"), v.literal("stock_empty")),
    title: v.string(),
    content: v.string(),
    isRead: v.boolean(),
    link: v.optional(v.string()), // Optional internal link (e.g., tab name or order ID)
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_read", ["isRead"]),
  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    likes: v.number(),
    createdAt: v.number(),
  }).index("by_author", ["authorId"])
    .index("by_created", ["createdAt"]),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_post", ["postId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
} as any);
