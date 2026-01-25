import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all posts for the community feed
export const getPosts = query({
    args: {},
    handler: async (ctx) => {
        const posts = await ctx.db
            .query("posts")
            .order("desc")
            .collect();

        return await Promise.all(
            posts.map(async (post) => {
                const author = await ctx.db.get(post.authorId);
                const authorProfile = await ctx.db
                    .query("userProfiles")
                    .withIndex("by_user_id", (q) => q.eq("userId", post.authorId))
                    .unique();

                const imageUrl = post.imageStorageId ? await ctx.storage.getUrl(post.imageStorageId) : null;

                const comments = await ctx.db
                    .query("comments")
                    .withIndex("by_post", (q) => q.eq("postId", post._id))
                    .collect();

                const commentsWithAuthors = await Promise.all(
                    comments.map(async (comment) => {
                        const commentAuthorProfile = await ctx.db
                            .query("userProfiles")
                            .withIndex("by_user_id", (q) => q.eq("userId", comment.authorId))
                            .unique();
                        return { ...comment, authorProfile: commentAuthorProfile };
                    })
                );

                return {
                    ...post,
                    imageUrl,
                    authorProfile,
                    comments: commentsWithAuthors,
                };
            })
        );
    },
});


// Create a new post
export const createPost = mutation({
    args: {
        content: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Must be logged in to post");
        }

        return await ctx.db.insert("posts", {
            authorId: userId,
            content: args.content,
            imageStorageId: args.imageStorageId,
            likes: 0,
            createdAt: Date.now(),
        });
    },
});

// Add a comment to a post
export const addComment = mutation({
    args: {
        postId: v.id("posts"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Must be logged in to comment");
        }

        return await ctx.db.insert("comments", {
            postId: args.postId,
            authorId: userId,
            content: args.content,
            createdAt: Date.now(),
        });
    },
});

// Toggle like on a post (Simplified for now - just tracking count)
export const toggleLike = mutation({
    args: {
        postId: v.id("posts"),
        increment: v.boolean(),
    },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        await ctx.db.patch(args.postId, {
            likes: Math.max(0, post.likes + (args.increment ? 1 : -1)),
        });
    },
});

// Delete a post and its associated data
export const deletePost = mutation({
    args: {
        postId: v.id("posts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        const post = await ctx.db.get(args.postId);

        if (!post) throw new Error("Post not found");
        if (post.authorId !== userId) {
            throw new Error("Only the author can delete this post");
        }

        // 1. Delete associated image from storage if it exists
        if (post.imageStorageId) {
            await ctx.storage.delete(post.imageStorageId);
        }

        // 2. Delete all comments associated with this post
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_post", (q) => q.eq("postId", args.postId))
            .collect();

        for (const comment of comments) {
            await ctx.db.delete(comment._id);
        }

        // 3. Delete the post itself
        await ctx.db.delete(args.postId);
    },
});
