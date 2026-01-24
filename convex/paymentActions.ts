"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "node:crypto";
import { decryptWithKey, deriveKey } from "./utils/cryptoUtils";
import CryptoJS from "crypto-js";

/**
 * Generate UPI payment QR code for an order
 */
export const generateUpiQrCode = action({
    args: {
        orderId: v.id("orders"),
        sellerName: v.optional(v.string()),
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
        signature: string;
    }> => {
        const QRCode = (await import("qrcode")).default;

        // Validate orderId format
        if (!args.orderId || typeof args.orderId !== "string") {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "qr_generation_failed",
                errorDetails: `Invalid order ID format: ${args.orderId}`,
                stackTrace: new Error().stack,
                metadata: { orderId: args.orderId },
            });
            throw new Error("Invalid order details. Please try again.");
        }

        // Validate sellerName if provided
        if (args.sellerName) {
            const sellerNameRegex = /^[a-zA-Z0-9\s\-&.']{3,50}$/;
            if (!sellerNameRegex.test(args.sellerName)) {
                throw new Error("Invalid seller name format. Only alphanumeric characters, spaces, hyphens, ampersands, periods, and apostrophes are allowed (3-50 characters).");
            }
        }

        // Get order and security details using internal query
        const order = await ctx.runQuery(internal.payments.getOrderInternal, {
            orderId: args.orderId,
        });

        if (!order) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "qr_generation_failed",
                errorDetails: `Order not found for ID: ${args.orderId}`,
                stackTrace: new Error().stack,
                metadata: { orderId: args.orderId },
            });
            throw new Error("Order not found. Please try again.");
        }
        if (order.isPaid) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "qr_generation_failed",
                errorDetails: `Order already paid for ID: ${args.orderId}`,
                stackTrace: new Error().stack,
                metadata: { orderId: args.orderId },
            });
            throw new Error("Order already paid. No further action needed.");
        }

        // Expiry check
        if (order.paymentExpiry && Date.now() > order.paymentExpiry) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "qr_generation_failed",
                errorDetails: `Payment session expired for order ${args.orderId}. Expiry time: ${order.paymentExpiry}, Current time: ${Date.now()}`,
                stackTrace: new Error().stack,
                metadata: { orderId: args.orderId, expiryTime: order.paymentExpiry },
            });
            throw new Error("Payment session expired. Please initiate a new payment.");
        }

        // Get seller profile using internal query
        const sellerProfile = await ctx.runQuery(internal.payments.getSellerProfileInternal, {
            sellerId: order.sellerId,
        });

        if (!sellerProfile) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "qr_generation_failed",
                errorDetails: `Seller profile not found for seller ID: ${order.sellerId}`,
                stackTrace: new Error().stack,
                metadata: { sellerId: order.sellerId },
            });
            throw new Error("Seller profile not found. Please contact support.");
        }

        // Decrypt seller profile payment details
        const encryptionKey = process.env.CONVEX_ENCRYPTION_KEY;
        if (encryptionKey && encryptionKey.length >= 32) {
            const salt = process.env.CONVEX_ENCRYPTION_SALT || "agrihorizon-salt-2024";
            const derivedKey = deriveKey(encryptionKey, salt);

            if (sellerProfile.upiId) sellerProfile.upiId = decryptWithKey(sellerProfile.upiId, derivedKey);
            if (sellerProfile.upiName) sellerProfile.upiName = decryptWithKey(sellerProfile.upiName, derivedKey);
            if (sellerProfile.bankName) sellerProfile.bankName = decryptWithKey(sellerProfile.bankName, derivedKey);
        }

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
                signature: "",
            };
        }

        // Validate UPI ID format according to NPCI specifications
        const upiIdRegex = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/;
        if (!upiIdRegex.test(sellerProfile.upiId)) {
            throw new Error("Invalid UPI ID format. Must be in the format username@bank");
        }

        // Validate UPI name format
        const upiNameRegex = /^[a-zA-Z0-9\s\-&.']{3,50}$/;
        if (!upiNameRegex.test(sellerProfile.upiName)) {
            throw new Error("Invalid UPI name format. Only alphanumeric characters, spaces, hyphens, ampersands, periods, and apostrophes are allowed (3-50 characters).");
        }

        // Validate order ID format
        if (!order._id || typeof order._id !== "string") {
            throw new Error("Invalid order ID in order details");
        }

        // Validate payment nonce
        if (!order.paymentNonce || typeof order.paymentNonce !== "string" || order.paymentNonce.length < 16) {
            throw new Error("Invalid or missing payment nonce");
        }

        // Validate amount
        const amountToPay = order.lockedAmount || order.totalAmount;
        if (typeof amountToPay !== "number" || amountToPay <= 0 || amountToPay > 1000000) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "qr_generation_failed",
                errorDetails: `Invalid payment amount: ${amountToPay}. Must be a positive number up to 1,000,000.`,
                stackTrace: new Error().stack,
                metadata: { amount: amountToPay },
            });
            throw new Error("Invalid payment amount. Please try again.");
        }

        // Signing the deep link
        const signingSecret = process.env.PAYMENT_SIGNING_SECRET;
        if (!signingSecret) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "qr_generation_failed",
                errorDetails: `PAYMENT_SIGNING_SECRET environment variable is not configured`,
                stackTrace: new Error().stack,
                metadata: { envVariable: "PAYMENT_SIGNING_SECRET" },
            });
            throw new Error("QR generation failed. Please contact support.");
        }
        const signatureBase = `${args.orderId}:${amountToPay}:${order.paymentNonce}`;
        const signature = crypto
            .createHmac("sha256", signingSecret)
            .update(signatureBase)
            .digest("hex");

        // UPI deep link - Cleaned up for maximum compatibility (no non-standard params)
        const transactionNote = args.sellerName ? `Order ${args.orderId.slice(-8)} - ${args.sellerName}` : `Order ${args.orderId.slice(-8)}`;
        const upiString = `upi://pay?pa=${encodeURIComponent(sellerProfile.upiId)}&pn=${encodeURIComponent(sellerProfile.upiName)}&tr=${order.paymentNonce}&tn=${encodeURIComponent(transactionNote)}&am=${amountToPay.toFixed(2)}&cu=INR`;

        const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
            width: 400,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
        });

        // Update status for the audit log via internal mutation
        await ctx.runMutation(internal.payments.updateOrderPaymentStatusInternal, {
            orderId: args.orderId,
            status: "awaiting_confirmation",
            signature: signature,
        });

        // Create audit log for QR generation
        await ctx.runMutation(internal.payments.createAuditLog, {
            orderId: args.orderId,
            userId: args.orderId as any,
            action: "qr_generated",
            details: `QR generated for order ${args.orderId} with amount ${amountToPay} and nonce ${order.paymentNonce}`,
            statusBefore: "initiating",
            statusAfter: "awaiting_confirmation",
        });

        return {
            qrCodeDataUrl,
            upiString,
            sellerName: args.sellerName || sellerProfile.upiName,
            sellerUpiId: sellerProfile.upiId,
            amount: amountToPay,
            hasPaymentDetails: true,
            nonce: order.paymentNonce || "",
            expiry: order.paymentExpiry || 0,
            signature: signature,
        };
    },
});

/**
 * Verify a payment signature (called by buyer before marking as paid)
 */
export const verifyPaymentSignature = action({
    args: {
        orderId: v.id("orders"),
        nonce: v.string(),
        signature: v.string(),
    },
    handler: async (ctx, args): Promise<boolean> => {
        const order = await ctx.runQuery(internal.payments.getOrderInternal, {
            orderId: args.orderId,
        });

        if (!order) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "signature_verification_failed",
                errorDetails: `Order not found for ID: ${args.orderId}`,
                stackTrace: new Error().stack,
                metadata: { orderId: args.orderId },
            });
            throw new Error("Payment verification failed. Please try again.");
        }

        // Rate limiting: 5 attempts per 5 minutes per user per order
        const rateLimitOk = await ctx.runMutation(internal.payments.checkRateLimit, {
            userId: order.buyerId,
            orderId: args.orderId,
            actionType: "verify_payment",
            maxAttempts: 5,
            windowMinutes: 5,
        });

        if (!rateLimitOk) {
            // Create audit log for rate limit exceeded
            await ctx.runMutation(internal.payments.logDetailedError, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "rate_limit_exceeded",
                errorDetails: `Too many verification attempts for order ${args.orderId}.`,
                stackTrace: new Error().stack,
                metadata: { orderId: args.orderId, actionType: "verify_payment" },
            });
            throw new Error("Too many verification attempts. Please wait before trying again.");
        }

        if (order.paymentNonce !== args.nonce) {
            // Create audit log for signature verification failure
            await ctx.runMutation(internal.payments.createAuditLog, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "signature_verification_failed",
                details: `Signature verification failed for order ${args.orderId}. Nonce mismatch. Expected: ${order.paymentNonce}, Received: ${args.nonce}`,
                statusBefore: order.paymentStatus || "pending",
                statusAfter: "failed",
            });
            throw new Error("Payment verification failed. Please try again.");
        }

        if (order.paymentExpiry && Date.now() > order.paymentExpiry) {
            // Create audit log for expired session
            await ctx.runMutation(internal.payments.createAuditLog, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "payment_session_expired",
                details: `Payment session expired for order ${args.orderId}. Expiry time: ${order.paymentExpiry}, Current time: ${Date.now()}`,
                statusBefore: order.paymentStatus || "pending",
                statusAfter: "expired",
            });
            throw new Error("Payment session expired. Please initiate a new payment.");
        }

        const signingSecret = process.env.PAYMENT_SIGNING_SECRET;
        if (!signingSecret) {
            // Log detailed error internally
            await ctx.runMutation(internal.payments.createAuditLog, {
                orderId: args.orderId,
                userId: args.orderId as any,
                action: "signature_verification_failed",
                details: `PAYMENT_SIGNING_SECRET environment variable is not configured`,
                statusBefore: order.paymentStatus || "pending",
                statusAfter: "failed",
            });
            throw new Error("Payment verification failed. Please contact support.");
        }
        const amountToPay = order.lockedAmount || order.totalAmount;
        const signatureBase = `${args.orderId}:${amountToPay}:${order.paymentNonce}`;
        const expectedSignature = crypto
            .createHmac("sha256", signingSecret)
            .update(signatureBase)
            .digest("hex");

        const isValid = expectedSignature === args.signature;

        // Create audit log for signature verification attempt
        await ctx.runMutation(internal.payments.createAuditLog, {
            orderId: args.orderId,
            userId: order.buyerId,
            action: "signature_verification_attempt",
            details: `Signature verification ${isValid ? 'succeeded' : 'failed'} for order ${args.orderId}.`,
            statusBefore: order.paymentStatus || "pending",
            statusAfter: isValid ? "verified" : "failed",
        });

        return isValid;
    },
});
