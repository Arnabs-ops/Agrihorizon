/**
 * Backend helper functions
 * Shared utilities for Convex queries and mutations
 */

import { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "./_generated/dataModel";

export const Errors = {
  UNAUTHORIZED: "User must be authenticated",
  PROFILE_NOT_FOUND: "User profile not found",
  INVALID_ROLE: "Invalid user role",
  PRODUCT_NOT_FOUND: "Product not found or not available",
  INSUFFICIENT_STOCK: "Insufficient stock available",
  ORDER_NOT_FOUND: "Order not found",
  ACCESS_DENIED: "Access denied",
} as const;

/**
 * Require authentication and return user ID
 * Throws error if user is not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error(Errors.UNAUTHORIZED);
  }
  return userId;
}

/**
 * Get user profile by user ID
 * Returns null if profile doesn't exist
 */
export async function getUserProfile(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"userProfiles"> | null> {
  return await ctx.db
    .query("userProfiles")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .unique();
}

/**
 * Require user profile to exist
 * Throws error if profile doesn't exist
 */
export async function requireUserProfile(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<Doc<"userProfiles">> {
  const profile = await getUserProfile(ctx, userId);
  if (!profile) {
    throw new Error(Errors.PROFILE_NOT_FOUND);
  }
  return profile;
}

/**
 * Require user to have a specific role
 * Returns both userId and profile
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  role: "seller" | "buyer" | "admin"
): Promise<{ userId: Id<"users">; profile: Doc<"userProfiles"> }> {
  const userId = await requireAuth(ctx);
  const profile = await requireUserProfile(ctx, userId);

  if (profile.role !== role) {
    throw new Error(Errors.INVALID_ROLE);
  }

  return { userId, profile };
}

/**
 * Get user profile with user details
 * Returns both user and profile objects
 */
export async function getUserProfileWithUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<{ user: Doc<"users"> | null; profile: Doc<"userProfiles"> | null }> {
  const user = await ctx.db.get(userId);
  const profile = await getUserProfile(ctx, userId);

  return { user, profile };
}

/**
 * Enrich product with seller information and image URL
 */
export async function enrichProductWithSeller(
  ctx: QueryCtx | MutationCtx,
  product: Doc<"products">
): Promise<Doc<"products"> & {
  imageUrl: string | null;
  seller: {
    user: Doc<"users"> | null;
    profile: Doc<"userProfiles"> | null;
  };
}> {
  const seller = await getUserProfileWithUser(ctx, product.sellerId);
  const imageUrl = product.imageStorageId
    ? await ctx.storage.getUrl(product.imageStorageId)
    : null;

  return {
    ...product,
    imageUrl,
    seller: {
      user: seller.user,
      profile: seller.profile,
    },
  };
}

/**
 * Enrich order with product, seller, and buyer information
 */
export async function enrichOrderWithDetails(
  ctx: QueryCtx | MutationCtx,
  order: Doc<"orders">
): Promise<Doc<"orders"> & {
  product: Doc<"products"> | null;
  seller: {
    user: Doc<"users"> | null;
    profile: Doc<"userProfiles"> | null;
  };
  buyer: {
    user: Doc<"users"> | null;
    profile: Doc<"userProfiles"> | null;
  };
}> {
  const product = await ctx.db.get(order.productId);
  const seller = await getUserProfileWithUser(ctx, order.sellerId);
  const buyer = await getUserProfileWithUser(ctx, order.buyerId);

  return {
    ...order,
    product,
    seller: {
      user: seller.user,
      profile: seller.profile,
    },
    buyer: {
      user: buyer.user,
      profile: buyer.profile,
    },
  };
}

/**
 * Verify product exists and is active
 */
export async function requireActiveProduct(
  ctx: QueryCtx | MutationCtx,
  productId: Id<"products">
): Promise<Doc<"products">> {
  const product = await ctx.db.get(productId);
  if (!product || !product.isActive) {
    throw new Error(Errors.PRODUCT_NOT_FOUND);
  }
  return product;
}

/**
 * Verify order exists and user has access
 */
export async function requireOrderAccess(
  ctx: QueryCtx | MutationCtx,
  orderId: Id<"orders">,
  userId: Id<"users">
): Promise<Doc<"orders">> {
  const order = await ctx.db.get(orderId);
  if (!order) {
    throw new Error(Errors.ORDER_NOT_FOUND);
  }
  if (order.buyerId !== userId && order.sellerId !== userId) {
    throw new Error(Errors.ACCESS_DENIED);
  }
  return order;
}

/**
 * Check if user is an admin
 * Admins are defined via environment variable CONVEX_ADMIN_USER_IDS (comma-separated)
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
): Promise<boolean> {
  const profile = await getUserProfile(ctx, userId);
  return profile?.role === "admin";
}

/**
 * Require user to be an admin
 * Throws error if user is not an admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const userId = await requireAuth(ctx);
  const isUserAdmin = await isAdmin(ctx, userId);
  if (!isUserAdmin) {
    throw new Error("Admin access required");
  }
  return userId;
}
