import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

export const generateUploadUrl = mutation({
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getImageUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

export const getImageUrls = query({
    args: { storageIds: v.array(v.id("_storage")) },
    handler: async (ctx, args) => {
        const urls = await Promise.all(
            args.storageIds.map(id => ctx.storage.getUrl(id))
        );
        return urls;
    },
});
