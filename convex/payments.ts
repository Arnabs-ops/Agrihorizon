import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { requireAuth, getUserProfile } from "./helpers";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { encryptWithKey, decryptWithKey, deriveKey } from "./utils/cryptoUtils";
import CryptoJS from "crypto-js";

/**
 * Fraud detection configuration
 */
const FRAUD_DETECTION_CONFIG = {
    MAX_PAYMENT_ATTEMPTS_PER_MINUTE: 5, // Max payment attempts per minute per user
    MAX_PAYMENT_ATTEMPTS_PER_HOUR: 20, // Max payment attempts per hour per user
    MAX_SAME_AMOUNT_ATTEMPTS: 3, // Max attempts with the same amount in a short time
    RAPID_PAYMENT_WINDOW_MS: 60000, // 1 minute window for rapid payment detection
    HIGH_RISK_AMOUNT_THRESHOLD: 10000, // Amount threshold for high-risk transactions
};

/**
 * Check for fraudulent payment patterns
 */
async function detectPaymentFraud(ctx: QueryCtx | MutationCtx, userId: Id<"users">, orderId: Id<"orders">, amount: number): Promise<{ isFraudulent: boolean; reason?: string }> {
    const now = Date.now();

    // 1. Check for rapid payment attempts (multiple attempts in short time)
    const recentPayments = await ctx.db
        .query("paymentAuditLogs")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("action"), "payment_initiated"))
        .filter((q: any) => q.gte(q.field("timestamp"), now - FRAUD_DETECTION_CONFIG.RAPID_PAYMENT_WINDOW_MS))
        .collect();

    if (recentPayments.length >= FRAUD_DETECTION_CONFIG.MAX_PAYMENT_ATTEMPTS_PER_MINUTE) {
        return { isFraudulent: true, reason: "Too many payment attempts in a short time" };
    }

    // 2. Check for same amount attempts (potential testing of stolen cards)
    const sameAmountAttempts = await ctx.db
        .query("paymentAuditLogs")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("action"), "payment_initiated"))
        .filter((q: any) => q.gte(q.field("timestamp"), now - FRAUD_DETECTION_CONFIG.RAPID_PAYMENT_WINDOW_MS))
        .collect();

    const sameAmountCount = sameAmountAttempts.filter((log: any) => {
        const details = log.details || "";
        const match = details.match(/Amount: (\d+(\.\d+)?)/);
        return match && parseFloat(match[1]) === amount;
    }).length;

    if (sameAmountCount >= FRAUD_DETECTION_CONFIG.MAX_SAME_AMOUNT_ATTEMPTS) {
        return { isFraudulent: true, reason: "Multiple attempts with the same amount detected" };
    }

    // 3. Check for high-risk amount transactions
    if (amount >= FRAUD_DETECTION_CONFIG.HIGH_RISK_AMOUNT_THRESHOLD) {
        // For high-risk amounts, check if user has a history of successful payments
        const successfulPayments = await ctx.db
            .query("paymentAuditLogs")
            .withIndex("by_user", (q: any) => q.eq("userId", userId))
            .filter((q: any) => q.eq(q.field("action"), "payment_confirmed"))
            .collect();

        if (successfulPayments.length === 0) {
            return { isFraudulent: true, reason: "High-risk amount transaction from new user" };
        }
    }

    // 4. Check for suspicious patterns in order history
    const userOrders = await ctx.db
        .query("orders")
        .withIndex("by_buyer", (q: any) => q.eq("buyerId", userId))
        .filter((q: any) => q.gte(q.field("orderDate"), now - 3600000)) // Last hour
        .collect();

    if (userOrders.length > 5) {
        return { isFraudulent: true, reason: "Suspicious number of orders in a short time" };
    }

    return { isFraudulent: false };
}

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
 * Encryption key for payment data (must be stored securely in environment variables)
 * Throws error if not set to prevent using insecure default keys
 */
function getEncryptionKey(): string {
    const key = process.env.CONVEX_ENCRYPTION_KEY;
    if (!key || key.length < 32) {
        throw new Error("CONVEX_ENCRYPTION_KEY environment variable must be set and at least 32 characters long");
    }
    const salt = process.env.CONVEX_ENCRYPTION_SALT || "agrihorizon-salt-2024";
    return deriveKey(key, salt);
}
const IV_LENGTH = 16;

/**
 * Payment amount validation constants
 */
const PAYMENT_VALIDATION = {
    MIN_AMOUNT: 1, // Minimum payment amount in rupees
    MAX_AMOUNT: 1000000, // Maximum payment amount in rupees
    MAX_DAILY_AMOUNT: 500000, // Maximum total payments per user per day
};

/**
 * Encrypt sensitive data using AES-256-CBC with PBKDF2 key derivation
 */
function encryptData(data: string): string {
    const encryptionKey = getEncryptionKey();
    return encryptWithKey(data, encryptionKey);
}

/**
 * Decrypt sensitive data using AES-256-CBC with PBKDF2 key derivation
 */
function decryptData(encryptedData: string): string {
    const encryptionKey = getEncryptionKey();
    return decryptWithKey(encryptedData, encryptionKey);
}

/**
 * Update seller's UPI payment details with encryption
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

        // Encrypt sensitive payment information
        const encryptedUpiId = encryptData(args.upiId.trim().toLowerCase());
        const encryptedUpiName = encryptData(args.upiName.trim());
        const encryptedBankName = args.bankName ? encryptData(args.bankName.trim()) : undefined;

        // Update profile with encrypted payment details
        await ctx.db.patch(profile._id, {
            upiId: encryptedUpiId,
            upiName: encryptedUpiName,
            bankName: encryptedBankName,
        });

        return { success: true };
    },
});

/**
 * Get seller's payment details by seller ID with decryption
 * SECURITY: Only the seller themselves can view their own payment details
 */
export const getSellerPaymentDetails = query({
    args: { sellerId: v.id("users") },
    handler: async (ctx, args) => {
        const currentUserId = await requireAuth(ctx);

        // Only allow sellers to view their own payment details
        if (currentUserId !== args.sellerId) {
            throw new Error("Unauthorized: You can only view your own payment details");
        }

        const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", args.sellerId))
            .first();

        if (!profile || profile.role !== "seller") {
            return null;
        }

        // Decrypt sensitive payment information
        const decryptedUpiId = profile.upiId ? decryptData(profile.upiId) : undefined;
        const decryptedUpiName = profile.upiName ? decryptData(profile.upiName) : undefined;
        const decryptedBankName = profile.bankName ? decryptData(profile.bankName) : undefined;

        return {
            upiId: decryptedUpiId,
            upiName: decryptedUpiName,
            bankName: decryptedBankName,
            hasPaymentDetails: !!(decryptedUpiId && decryptedUpiName),
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
 * Internal mutation to log detailed error information
 */
export const logDetailedError = internalMutation({
    args: {
        orderId: v.id("orders"),
        userId: v.id("users"),
        action: v.string(),
        errorDetails: v.string(),
        stackTrace: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("paymentErrorLogs", {
            orderId: args.orderId,
            userId: args.userId,
            action: args.action,
            errorDetails: args.errorDetails,
            stackTrace: args.stackTrace,
            metadata: args.metadata,
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

        // Rate limiting: 3 attempts per 5 minutes per user per order
        const rateLimitOk = await ctx.runMutation(internal.payments.checkRateLimit, {
            userId,
            orderId: args.orderId,
            actionType: "initiate_payment",
            maxAttempts: 3,
            windowMinutes: 5,
        });

        if (!rateLimitOk) {
            throw new Error("Too many payment initiation attempts. Please wait before trying again.");
        }

        // Amount validation
        if (order.totalAmount < PAYMENT_VALIDATION.MIN_AMOUNT) {
            throw new Error(`Payment amount too low. Minimum amount is ₹${PAYMENT_VALIDATION.MIN_AMOUNT}`);
        }
        if (order.totalAmount > PAYMENT_VALIDATION.MAX_AMOUNT) {
            throw new Error(`Payment amount exceeds maximum limit of ₹${PAYMENT_VALIDATION.MAX_AMOUNT.toLocaleString()}`);
        }

        // Check daily payment limit
        const todayStart = Date.now() - (Date.now() % (24 * 60 * 60 * 1000));
        const todayPayments = await ctx.db
            .query("paymentAuditLogs")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("action"), "payment_confirmed"))
            .filter((q) => q.gte(q.field("timestamp"), todayStart))
            .collect();

        const todayTotal = todayPayments.reduce((sum, log) => {
            const match = log.details.match(/Amount: (\d+(\.\d+)?)/);
            return sum + (match ? parseFloat(match[1]) : 0);
        }, 0);

        if (todayTotal + order.totalAmount > PAYMENT_VALIDATION.MAX_DAILY_AMOUNT) {
            throw new Error(`Daily payment limit exceeded. Maximum daily limit is ₹${PAYMENT_VALIDATION.MAX_DAILY_AMOUNT.toLocaleString()}`);
        }

        // Fraud detection check
        const fraudCheck = await detectPaymentFraud(ctx, userId, args.orderId, order.totalAmount);
        if (fraudCheck.isFraudulent) {
            // Log fraud attempt with IP (if available from request context)
            await ctx.db.insert("paymentAuditLogs", {
                orderId: args.orderId,
                userId,
                action: "fraud_detected",
                details: `Fraud detected: ${fraudCheck.reason}`,
                statusBefore: order.paymentStatus || "pending",
                statusAfter: "blocked",
                ipAddress: undefined, // Will be populated by HTTP action if available
                timestamp: Date.now(),
            });
            throw new Error(`Payment blocked for security reasons: ${fraudCheck.reason}`);
        }

        // State Machine Check
        const currentPaymentStatus = order.paymentStatus || "pending";
        if (["paid", "processing"].includes(currentPaymentStatus)) {
            throw new Error(`Cannot initiate payment in status: ${currentPaymentStatus}`);
        }

        // Use cryptographically secure random bytes for nonce
        // Use standard Math.random for now to avoid node:crypto dependency in mutation
        // Use crypto-js for cryptographically secure nonce
        const nonce = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
        const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

        await ctx.db.patch(args.orderId, {
            paymentStatus: "initiating",
            paymentNonce: nonce,
            paymentExpiry: expiry,
            lockedAmount: order.totalAmount,
        });

        // Audit Log with IP tracking (if available)
        await ctx.db.insert("paymentAuditLogs", {
            orderId: args.orderId,
            userId,
            action: "payment_initiated",
            details: `Amount: ${order.totalAmount}, Nonce: ${nonce.substring(0, 8)}...`,
            statusBefore: currentPaymentStatus,
            statusAfter: "initiating",
            ipAddress: undefined, // Note: IP address can be captured in HTTP actions, not mutations
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
 * Internal mutation to check rate limit for payment actions
 */
export const checkRateLimit = internalMutation({
    args: {
        userId: v.id("users"),
        orderId: v.id("orders"),
        actionType: v.union(v.literal("initiate_payment"), v.literal("verify_payment")),
        maxAttempts: v.number(),
        windowMinutes: v.number(),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const now = Date.now();
        const windowStart = now - args.windowMinutes * 60 * 1000;

        // Find existing rate limit record
        // Query by first field of the index, then filter for remaining fields
        const existingLimit = await ctx.db
            .query("paymentRateLimits")
            .withIndex("by_user_order_action", (q) => q.eq("userId", args.userId))
            .filter((q) =>
                q.eq(q.field("orderId"), args.orderId) &&
                q.eq(q.field("actionType"), args.actionType)
            )
            .first();

        if (!existingLimit) {
            // Create new rate limit record
            await ctx.db.insert("paymentRateLimits", {
                userId: args.userId,
                orderId: args.orderId,
                actionType: args.actionType,
                attemptCount: 1,
                lastAttemptTime: now,
            });
            return true;
        }

        // Reset attempt count if outside the time window
        if (existingLimit.lastAttemptTime < windowStart) {
            await ctx.db.patch(existingLimit._id, {
                attemptCount: 1,
                lastAttemptTime: now,
            });
            return true;
        }

        // Check if limit exceeded
        if (existingLimit.attemptCount >= args.maxAttempts) {
            return false;
        }

        // Increment attempt count
        await ctx.db.patch(existingLimit._id, {
            attemptCount: existingLimit.attemptCount + 1,
            lastAttemptTime: now,
        });
        return true;
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

        // Check if encrypted payment details exist
        return !!(profile.upiId && profile.upiName);
    },
});
