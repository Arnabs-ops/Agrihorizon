import { v } from "convex/values";
import { action, mutation, query, internalMutation } from "./_generated/server";
import { requireAuth, getUserProfile } from "./helpers";
import { Id } from "./_generated/dataModel";
import crypto from "node:crypto";

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

        const nonce = crypto.randomBytes(16).toString("hex");
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
 * Generate UPI payment QR code for an order
 */
export const generateUpiQrCode = action({
    args: {
        orderId: v.id("orders"),
    },
    handler: async (ctx, args): Promise<{
        qrCodeDataUrl: string;
        upiString: string;
        sellerName: string;
        sellerUpiId: string;
        amount: number;
        hasPaymentDetails: boolean;
        nonce: string;
        expiry: number;
    }> => {
        const QRCode = (await import("qrcode")).default;

        // Get order and security details
        const order = await ctx.runQuery(ctx as any, (db: any) =>
            db.get(args.orderId)
        );

        if (!order) throw new Error("Order not found");
        if (order.isPaid) throw new Error("Order already paid");

        // Expiry check
        if (order.paymentExpiry && Date.now() > order.paymentExpiry) {
            throw new Error("Payment session expired. Please regenerate QR.");
        }

        const sellerProfile = await ctx.runQuery(ctx as any, (db: any) =>
            db.query("userProfiles")
                .withIndex("by_user_id", (q: any) => q.eq("userId", order.sellerId))
                .first()
        );

        if (!sellerProfile) throw new Error("Seller profile not found");

        if (!sellerProfile.upiId || !sellerProfile.upiName) {
            return {
                qrCodeDataUrl: "",
                upiString: "",
                sellerName: sellerProfile.fullName || "Seller",
                sellerUpiId: "",
                amount: order.totalAmount,
                hasPaymentDetails: false,
                nonce: "",
                expiry: 0,
            };
        }

        // Amount Locking: Use lockedAmount if set, else totalAmount
        const amountToPay = order.lockedAmount || order.totalAmount;

        // Signing the deep link
        const signingSecret = process.env.PAYMENT_SIGNING_SECRET || "fallback_secret_agrohorizon";
        const signatureBase = `${args.orderId}:${amountToPay}:${order.paymentNonce}`;
        const signature = crypto
            .createHmac("sha256", signingSecret)
            .update(signatureBase)
            .digest("hex");

        // UPI deep link with custom parameter for signature validation on return
        const upiString = `upi://pay?pa=${encodeURIComponent(sellerProfile.upiId)}&pn=${encodeURIComponent(sellerProfile.upiName)}&am=${amountToPay.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${args.orderId.slice(-8)}`)}&tr=${order.paymentNonce}&orgid=agrohorizon&sign=${signature}`;

        const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
            width: 400,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
        });

        // Update status for the audit log via mutation
        await ctx.runMutation(ctx as any, (db: any) =>
            db.patch(args.orderId, { paymentStatus: "awaiting_confirmation", paymentSignature: signature })
        );

        return {
            qrCodeDataUrl,
            upiString,
            sellerName: sellerProfile.upiName,
            sellerUpiId: sellerProfile.upiId,
            amount: amountToPay,
            hasPaymentDetails: true,
            nonce: order.paymentNonce || "",
            expiry: order.paymentExpiry || 0,
        };
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
