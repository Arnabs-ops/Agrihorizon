import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuth, requireRole, enrichProductWithSeller, Errors } from "./helpers";

// Get all active products for marketplace
export const getMarketplaceProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Enrich products with seller details
    const productsWithSellers = await Promise.all(
      products.map(product => enrichProductWithSeller(ctx, product))
    );

    return productsWithSellers.filter(p => p.seller.user && p.seller.profile);
  },
});

// Get products by seller (for seller dashboard)
export const getSellerProducts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .collect();

    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        const imageUrl = product.imageStorageId ? await ctx.storage.getUrl(product.imageStorageId) : null;
        return { ...product, imageUrl };
      })
    );

    return productsWithUrls;
  },
});

// Add new product (seller only)
export const addProduct = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    unit: v.string(),
    category: v.string(),
    stockQuantity: v.number(),
    imageEmoji: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    priceTiers: v.optional(v.array(v.object({ minQuantity: v.number(), price: v.number() }))),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "seller");

    const productId = await ctx.db.insert("products", {
      sellerId: userId,
      name: args.name,
      description: args.description,
      price: args.price,
      unit: args.unit,
      category: args.category,
      stockQuantity: args.stockQuantity,
      isActive: true,
      imageEmoji: args.imageEmoji,
      imageStorageId: args.imageStorageId,
      priceTiers: args.priceTiers,
    });

    return productId;
  },
});

// Update product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    unit: v.optional(v.string()),
    category: v.optional(v.string()),
    stockQuantity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    imageEmoji: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    priceTiers: v.optional(v.array(v.object({ minQuantity: v.number(), price: v.number() }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const product = await ctx.db.get(args.productId);
    if (!product || product.sellerId !== userId) {
      throw new Error("Product not found or access denied");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.price !== undefined) updates.price = args.price;
    if (args.unit !== undefined) updates.unit = args.unit;
    if (args.category !== undefined) updates.category = args.category;
    if (args.stockQuantity !== undefined) updates.stockQuantity = args.stockQuantity;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.imageEmoji !== undefined) updates.imageEmoji = args.imageEmoji;
    if (args.imageStorageId !== undefined) updates.imageStorageId = args.imageStorageId;
    if (args.priceTiers !== undefined) updates.priceTiers = args.priceTiers;

    await ctx.db.patch(args.productId, updates);
    return args.productId;
  },
});

// Delete product
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product || product.sellerId !== userId) {
      throw new Error(Errors.ACCESS_DENIED);
    }

    await ctx.db.delete(args.productId);
    return args.productId;
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
