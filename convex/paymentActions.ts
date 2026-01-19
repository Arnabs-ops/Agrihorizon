"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "node:crypto";

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
        signature: string;
    }> => {
        const QRCode = (await import("qrcode")).default;

        // Get order and security details using internal query
        const order = await ctx.runQuery(internal.payments.getOrderInternal, {
            orderId: args.orderId,
        });

        if (!order) throw new Error("Order not found");
        if (order.isPaid) throw new Error("Order already paid");

        // Expiry check
        if (order.paymentExpiry && Date.now() > order.paymentExpiry) {
            throw new Error("Payment session expired. Please regenerate QR.");
        }

        // Get seller profile using internal query
        const sellerProfile = await ctx.runQuery(internal.payments.getSellerProfileInternal, {
            sellerId: order.sellerId,
        });

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
                signature: "",
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

        // Update status for the audit log via internal mutation
        await ctx.runMutation(internal.payments.updateOrderPaymentStatusInternal, {
            orderId: args.orderId,
            status: "awaiting_confirmation",
            signature: signature,
        });

        return {
            qrCodeDataUrl,
            upiString,
            sellerName: sellerProfile.upiName,
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

        if (!order) throw new Error("Order not found");

        if (order.paymentNonce !== args.nonce) {
            return false;
        }

        if (order.paymentExpiry && Date.now() > order.paymentExpiry) {
            throw new Error("Payment session expired");
        }

        const signingSecret = process.env.PAYMENT_SIGNING_SECRET || "fallback_secret_agrohorizon";
        const amountToPay = order.lockedAmount || order.totalAmount;
        const signatureBase = `${args.orderId}:${amountToPay}:${order.paymentNonce}`;
        const expectedSignature = crypto
            .createHmac("sha256", signingSecret)
            .update(signatureBase)
            .digest("hex");

        return expectedSignature === args.signature;
    },
});
