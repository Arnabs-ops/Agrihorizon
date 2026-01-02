import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user's profile
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    return {
      user,
      profile,
    };
  },
});

// Create user profile after registration
export const createUserProfile = mutation({
  args: {
    role: v.union(v.literal("seller"), v.literal("buyer")),
    fullName: v.string(),
    phoneNumber: v.optional(v.string()),
    location: v.optional(v.string()),
    businessName: v.optional(v.string()),
    farmSize: v.optional(v.string()),
    cropTypes: v.optional(v.array(v.string())),
    preferredProducts: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("User profile already exists");
    }

    // Create new profile
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      role: args.role,
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
      location: args.location,
      businessName: args.businessName,
      farmSize: args.farmSize,
      cropTypes: args.cropTypes,
      preferredProducts: args.preferredProducts,
    });

    return profileId;
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    location: v.optional(v.string()),
    businessName: v.optional(v.string()),
    farmSize: v.optional(v.string()),
    cropTypes: v.optional(v.array(v.string())),
    preferredProducts: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Update profile with provided fields
    const updates: any = {};
    if (args.fullName !== undefined) updates.fullName = args.fullName;
    if (args.phoneNumber !== undefined) updates.phoneNumber = args.phoneNumber;
    if (args.location !== undefined) updates.location = args.location;
    if (args.businessName !== undefined) updates.businessName = args.businessName;
    if (args.farmSize !== undefined) updates.farmSize = args.farmSize;
    if (args.cropTypes !== undefined) updates.cropTypes = args.cropTypes;
    if (args.preferredProducts !== undefined) updates.preferredProducts = args.preferredProducts;

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});
