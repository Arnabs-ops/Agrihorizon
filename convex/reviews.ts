import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const postReview = mutation({
    args: {
        productId: v.id("products"),
        rating: v.number(),
        comment: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        // Ensure the buyer has bought the product (optional but good for trust)
        // For now, we'll allow any buyer to review if they are authenticated

        const reviewId = await ctx.db.insert("reviews", {
            productId: args.productId,
            buyerId: userId,
            sellerId: product.sellerId,
            rating: args.rating,
            comment: args.comment,
            createdAt: Date.now(),
        });

        // Notify seller about new review
        await ctx.db.insert("notifications", {
            userId: product.sellerId,
            type: "review_new",
            title: "New Product Review",
            content: `A buyer left a ${args.rating}-star review for ${product.name}.`,
            isRead: false,
            link: "products",
            timestamp: Date.now(),
        });

        return reviewId;
    },
});

export const getProductReviews = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_product", (q) => q.eq("productId", args.productId))
            .order("desc")
            .collect();

        const reviewsWithUsers = await Promise.all(
            reviews.map(async (review) => {
                const user = await ctx.db.get(review.buyerId);
                const profile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_user_id", (q) => q.eq("userId", review.buyerId))
                    .unique();
                return {
                    ...review,
                    buyerName: profile?.fullName || user?.name || "Anonymous",
                };
            })
        );

        return reviewsWithUsers;
    },
});

export const getSellerReviews = query({
    args: { sellerId: v.id("users") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_seller", (q) => q.eq("sellerId", args.sellerId))
            .order("desc")
            .collect();

        return reviews;
    },
});
