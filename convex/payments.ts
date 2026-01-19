import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { requireAuth, getUserProfile } from "./helpers";
import { Id } from "./_generated/dataModel";

/**
 * Validate UPI ID format
 * Format should be: username@bank (e.g., farmer@paytm, user@oksbi)
 */
function validateUpiId(upiId: string): { valid: boolean; error?: string } {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;

    if (!upiId || upiId.trim() === "") {
        return { valid: false, error: "UPI ID is required" };
    }

    if (!upiRegex.test(upiId)) {
        return { valid: false, error: "Invalid UPI ID format. Should be like: username@bank" };
    }

    const parts = upiId.split("@");
    if (parts.length !== 2) {
        return { valid: false, error: "UPI ID must contain exactly one @" };
    }

    if (parts[0].length < 3) {
        return { valid: false, error: "Username part is too short" };
    }

    if (parts[1].length < 3) {
        return { valid: false, error: "Bank identifier is too short" };
    }

    return { valid: true };
}

/**
 * Update seller's UPI payment details
 */
export const updatePaymentDetails = mutation({
    args: {
        upiId: v.string(),
        upiName: v.string(),
        bankName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const profile = await getUserProfile(ctx, userId);

        if (!profile) {
            throw new Error("Profile not found");
        }

        if (profile.role !== "seller") {
            throw new Error("Only sellers can set up payment details");
        }

        // Validate UPI ID
        const validation = validateUpiId(args.upiId);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Update profile with payment details
        await ctx.db.patch(profile._id, {
            upiId: args.upiId.trim().toLowerCase(),
            upiName: args.upiName.trim(),
            bankName: args.bankName?.trim() || undefined,
        });

        return { success: true };
    },
});

/**
 * Get seller's payment details by seller ID
 */
export const getSellerPaymentDetails = query({
    args: { sellerId: v.id("users") },
    handler: async (ctx, args) => {
        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", args.sellerId))
            .first();

        if (!profile || profile.role !== "seller") {
            return null;
        }

        return {
            upiId: profile.upiId,
            upiName: profile.upiName,
            bankName: profile.bankName,
            hasPaymentDetails: !!(profile.upiId && profile.upiName),
        };
    },
});

/**
 * Internal mutation to create an audit log
 */
export const createAuditLog = internalMutation({
    args: {
        orderId: v.id("orders"),
        userId: v.id("users"),
        action: v.string(),
        details: v.string(),
        statusBefore: v.optional(v.string()),
        statusAfter: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("paymentAuditLogs", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

/**
 * Initiate a payment session - locks the amount and sets a nonce
 */
export const initiatePayment = mutation({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const userId = await requireAuth(ctx);
        const order = await ctx.db.get(args.orderId);

        if (!order || order.buyerId !== userId) {
            throw new Error("Order not found or unauthorized");
        }

        if (order.isPaid) {
            throw new Error("Order is already paid");
        }

        // State Machine Check
        const currentPaymentStatus = order.paymentStatus || "pending";
        if (["paid", "processing"].includes(currentPaymentStatus)) {
            throw new Error(`Cannot initiate payment in status: ${currentPaymentStatus}`);
        }

        const nonce = Array.from({ length: 32 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join("");
        const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

        await ctx.db.patch(args.orderId, {
            paymentStatus: "initiating",
            paymentNonce: nonce,
            paymentExpiry: expiry,
            lockedAmount: order.totalAmount,
        });

        // Audit Log
        await ctx.db.insert("paymentAuditLogs", {
            orderId: args.orderId,
            userId,
            action: "payment_initiated",
            details: `Amount: ${order.totalAmount}, Nonce: ${nonce}`,
            statusBefore: currentPaymentStatus,
            statusAfter: "initiating",
            timestamp: Date.now(),
        });

        return { nonce, expiry };
    },
});

/**
 * Internal query to get order details for the QR generator
 */
export const getOrderInternal = internalQuery({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.orderId);
    },
});

/**
 * Internal query to get seller profile for the QR generator
 */
export const getSellerProfileInternal = internalQuery({
    args: { sellerId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("userProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", args.sellerId))
            .first();
    },
});

/**
 * Internal mutation to update order status for the QR generator
 */
export const updateOrderPaymentStatusInternal = internalMutation({
    args: {
        orderId: v.id("orders"),
        status: v.string(), // awaiting_confirmation
        signature: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.orderId, {
            paymentStatus: args.status as any,
            paymentSignature: args.signature,
        });
    },
});


/**
 * Check if current user (seller) has payment details configured
 */
export const hasPaymentDetailsConfigured = query({
    args: {},
    handler: async (ctx) => {
        const userId = await requireAuth(ctx);
        const profile = await getUserProfile(ctx, userId);

        if (!profile || profile.role !== "seller") {
            return false;
        }

        return !!(profile.upiId && profile.upiName);
    },
});
