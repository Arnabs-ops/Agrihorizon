import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";

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

// Get a public profile by user ID (for buyers to view seller portfolios)
export const getPublicProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .unique();

        if (!profile) return null;

        return {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
            },
            profile: {
                _id: profile._id,
                fullName: profile.fullName,
                businessName: profile.businessName,
                location: profile.location,
                farmBio: profile.farmBio,
                farmImages: profile.farmImages,
                isVerified: profile.isVerified,
            }
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

        // Create new profile with default tutorial state
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
            // Initialize tutorial progress
            tutorialProgress: {
                hasSeenWelcome: false,
                hasCompletedTour: false,
                completedSteps: [],
                dismissedChecklist: false,
                lastTutorialDate: Date.now(),
            },
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
        farmBio: v.optional(v.string()),
        farmImages: v.optional(v.array(v.id("_storage"))),
        isVerified: v.optional(v.boolean()),
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
        const updates: Partial<Doc<"userProfiles">> = {};
        if (args.fullName !== undefined) updates.fullName = args.fullName;
        if (args.phoneNumber !== undefined) updates.phoneNumber = args.phoneNumber;
        if (args.location !== undefined) updates.location = args.location;
        if (args.businessName !== undefined) updates.businessName = args.businessName;
        if (args.farmSize !== undefined) updates.farmSize = args.farmSize;
        if (args.cropTypes !== undefined) updates.cropTypes = args.cropTypes;
        if (args.preferredProducts !== undefined) updates.preferredProducts = args.preferredProducts;
        if (args.farmBio !== undefined) updates.farmBio = args.farmBio;
        if (args.farmImages !== undefined) updates.farmImages = args.farmImages;
        if (args.isVerified !== undefined) updates.isVerified = args.isVerified;

        await ctx.db.patch(profile._id, updates);
        return profile._id;
    },
});

// Update tutorial progress
export const updateTutorialProgress = mutation({
    args: {
        hasSeenWelcome: v.optional(v.boolean()),
        hasCompletedTour: v.optional(v.boolean()),
        completedSteps: v.optional(v.array(v.string())),
        dismissedChecklist: v.optional(v.boolean()),
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

        // Get existing tutorial progress or create default
        const currentProgress = profile.tutorialProgress || {
            hasSeenWelcome: false,
            hasCompletedTour: false,
            completedSteps: [],
            dismissedChecklist: false,
            lastTutorialDate: Date.now(),
        };

        // Merge updates
        const updatedProgress = {
            ...currentProgress,
            ...(args.hasSeenWelcome !== undefined && { hasSeenWelcome: args.hasSeenWelcome }),
            ...(args.hasCompletedTour !== undefined && { hasCompletedTour: args.hasCompletedTour }),
            ...(args.completedSteps !== undefined && { completedSteps: args.completedSteps }),
            ...(args.dismissedChecklist !== undefined && { dismissedChecklist: args.dismissedChecklist }),
            lastTutorialDate: Date.now(),
        };

        await ctx.db.patch(profile._id, {
            tutorialProgress: updatedProgress,
        });

        return updatedProgress;
    },
});

// Reset tutorial (allows user to replay)
export const resetTutorial = mutation({
    args: {},
    handler: async (ctx) => {
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

        // Reset all tutorial progress
        await ctx.db.patch(profile._id, {
            tutorialProgress: {
                hasSeenWelcome: false,
                hasCompletedTour: false,
                completedSteps: [],
                dismissedChecklist: false,
                lastTutorialDate: Date.now(),
            },
        });

        return true;
    },
});
