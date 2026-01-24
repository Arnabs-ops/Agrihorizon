import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Store vegetable price data
export const storePrice = mutation({
  args: {
    vegetable: v.string(),
    location: v.string(),
    price: v.number(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if price for today already exists
    const existingPrice = await ctx.db
      .query("vegPrices")
      .withIndex("by_vegetable_location_date", (q: any) =>
        q.eq("vegetable", args.vegetable.toLowerCase())
          .eq("location", args.location.toLowerCase())
          .eq("date", today)
      )
      .unique();

    if (existingPrice) {
      // Update existing price
      await ctx.db.patch(existingPrice._id, {
        price: args.price,
        source: args.source,
        timestamp: Date.now(),
      });
      return existingPrice._id;
    } else {
      // Create new price entry
      return await ctx.db.insert("vegPrices", {
        vegetable: args.vegetable.toLowerCase(),
        location: args.location.toLowerCase(),
        date: today,
        price: args.price,
        source: args.source,
        timestamp: Date.now(),
      });
    }
  },
});

// Get price history for a vegetable in a location
export const getPriceHistory = query({
  args: {
    vegetable: v.string(),
    location: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Array<{ date: string; price: number; source: string }>> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const daysToFetch = args.days || 7;
    const prices = await ctx.db
      .query("vegPrices")
      .withIndex("by_vegetable_location", (q: any) =>
        q.eq("vegetable", args.vegetable.toLowerCase())
          .eq("location", args.location.toLowerCase())
      )
      .order("desc")
      .take(daysToFetch);

    return prices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as any;
  },
});
