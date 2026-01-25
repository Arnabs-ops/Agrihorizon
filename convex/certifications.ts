import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { requireAuth, requireRole, getUserProfile, requireAdmin } from "./helpers";
import { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Certification type constants
 */
export const CERTIFICATION_TYPES = {
  ORGANIC: "organic",
  FSSAI: "fssai",
  ISO: "iso",
  GMP: "gmp",
  HALAL: "halal",
  CUSTOM: "custom",
} as const;

/**
 * Certification status constants
 */
export const CERTIFICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  REVOKED: "revoked",
} as const;

/**
 * Apply for a quality certification (Seller only)
 */
export const applyForCertification = mutation({
  args: {
    certificationType: v.union(
      v.literal("organic"),
      v.literal("fssai"),
      v.literal("iso"),
      v.literal("gmp"),
      v.literal("halal"),
      v.literal("custom")
    ),
    certificationName: v.string(),
    issuerName: v.string(),
    certificateNumber: v.string(),
    issueDate: v.number(),
    expiryDate: v.optional(v.number()),
    documentStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  returns: v.id("qualityCertifications"),
  handler: async (ctx, args) => {
    const { userId, profile } = await requireRole(ctx, "seller");

    // Validate expiry date is after issue date
    if (args.expiryDate && args.expiryDate <= args.issueDate) {
      throw new Error("Expiry date must be after issue date");
    }

    // Check for duplicate certificate number for same seller and type
    const existingCert = await ctx.db
      .query("qualityCertifications")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .filter((q) =>
        q.eq(q.field("certificationType"), args.certificationType) &&
        q.eq(q.field("certificateNumber"), args.certificateNumber) &&
        q.neq(q.field("status"), "rejected")
      )
      .first();

    if (existingCert) {
      throw new Error("A certification with this certificate number already exists");
    }

    const now = Date.now();
    const certificationId = await ctx.db.insert("qualityCertifications", {
      sellerId: userId,
      certificationType: args.certificationType,
      certificationName: args.certificationName.trim(),
      issuerName: args.issuerName.trim(),
      certificateNumber: args.certificateNumber.trim(),
      issueDate: args.issueDate,
      expiryDate: args.expiryDate,
      status: "pending",
      documentStorageId: args.documentStorageId,
      notes: args.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    // Notify admins about new certification application
    // (Notification system integration can be added here)

    return certificationId;
  },
});

/**
 * Get all certifications for current seller
 */
export const getMyCertifications = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("expired"),
      v.literal("revoked")
    )),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const profile = await getUserProfile(ctx, userId);

    if (!profile || profile.role !== "seller") {
      throw new Error("Only sellers can view certifications");
    }

    let query = ctx.db
      .query("qualityCertifications")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const certifications = await query.collect();

    // Enrich with document URLs
    return await Promise.all(
      certifications.map(async (cert) => {
        const documentUrl = cert.documentStorageId
          ? await ctx.storage.getUrl(cert.documentStorageId)
          : null;

        return {
          ...cert,
          documentUrl,
        };
      })
    );
  },
});

/**
 * Helper logic for getting seller certifications
 */
async function getSellerCertificationsLogic(ctx: QueryCtx | MutationCtx, sellerId: Id<"users">) {
  const rawCertifications = await ctx.db
    .query("qualityCertifications")
    .withIndex("by_seller", (q: any) => q.eq("sellerId", sellerId))
    .filter((q: any) => q.eq(q.field("status"), "approved"))
    .collect();
  const certifications = rawCertifications as Doc<"qualityCertifications">[];

  // Check for expired certifications
  const now = Date.now();
  const validCertifications = certifications.filter(
    (cert: any) => !cert.expiryDate || cert.expiryDate > now
  );

  return validCertifications;
}

/**
 * Get all approved certifications for a seller (Public query)
 */
export const fetchSellerCertifications = query({
  args: { sellerId: v.id("users") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    console.log(`[DEBUG] Fetching certifications for seller: ${args.sellerId}`);
    const validCertifications = await getSellerCertificationsLogic(ctx, args.sellerId);

    // Enrich with document URLs
    return await Promise.all(
      validCertifications.map(async (cert: any) => {
        const documentUrl = cert.documentStorageId
          ? await ctx.storage.getUrl(cert.documentStorageId)
          : null;

        return {
          ...cert,
          documentUrl,
        };
      })
    );
  },
});

/**
 * Get certifications for a specific product
 */
export const getProductCertifications = query({
  args: { productId: v.id("products") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return [];
    }

    // Get product-specific certifications
    const productCertIds = product.certificationIds || [];
    const productCerts = await Promise.all(
      productCertIds.map(async (certId: Id<"qualityCertifications">) => {
        const cert = (await ctx.db.get(certId)) as Doc<"qualityCertifications"> | null;
        if (!cert || cert.status !== "approved") {
          return null;
        }
        // Check if expired
        if (cert.expiryDate && cert.expiryDate <= Date.now()) {
          return null;
        }
        const documentUrl = cert.documentStorageId
          ? await ctx.storage.getUrl(cert.documentStorageId)
          : null;
        return { ...cert, documentUrl };
      })
    );

    // Also get seller-level certifications using logic helper directly
    const sellerCerts = await getSellerCertificationsLogic(ctx, product.sellerId);

    // Combine and deduplicate
    const allCerts = [...productCerts.filter(Boolean), ...sellerCerts];
    const uniqueCerts = Array.from(
      new Map(allCerts.map((cert: any) => [cert._id, cert])).values()
    );

    return uniqueCerts;
  },
});

/**
 * Internal query to get seller certifications
 */
export const getSellerCertificationsInternal = internalQuery({
  args: { sellerId: v.id("users") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const validCertifications = await getSellerCertificationsLogic(ctx, args.sellerId);
    return validCertifications.map((cert: any) => ({
      ...cert,
      documentUrl: null, // Will be enriched by caller if needed
    }));
  },
});

/**
 * Update certification (only pending certifications can be updated)
 */
export const updateCertification = mutation({
  args: {
    certificationId: v.id("qualityCertifications"),
    certificationName: v.optional(v.string()),
    issuerName: v.optional(v.string()),
    certificateNumber: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    documentStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const certification = await ctx.db.get(args.certificationId);

    if (!certification) {
      throw new Error("Certification not found");
    }

    if (certification.sellerId !== userId) {
      throw new Error("You can only update your own certifications");
    }

    if (certification.status !== "pending") {
      throw new Error("Only pending certifications can be updated");
    }

    // Validate expiry date if provided
    const issueDate = args.issueDate ?? certification.issueDate;
    if (args.expiryDate && args.expiryDate <= issueDate) {
      throw new Error("Expiry date must be after issue date");
    }

    await ctx.db.patch(args.certificationId, {
      ...(args.certificationName && { certificationName: args.certificationName.trim() }),
      ...(args.issuerName && { issuerName: args.issuerName.trim() }),
      ...(args.certificateNumber && { certificateNumber: args.certificateNumber.trim() }),
      ...(args.issueDate && { issueDate: args.issueDate }),
      ...(args.expiryDate !== undefined && { expiryDate: args.expiryDate }),
      ...(args.documentStorageId && { documentStorageId: args.documentStorageId }),
      ...(args.notes !== undefined && { notes: args.notes?.trim() }),
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Delete certification (only pending or rejected can be deleted)
 */
export const deleteCertification = mutation({
  args: { certificationId: v.id("qualityCertifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const certification = await ctx.db.get(args.certificationId);

    if (!certification) {
      throw new Error("Certification not found");
    }

    if (certification.sellerId !== userId) {
      throw new Error("You can only delete your own certifications");
    }

    if (!["pending", "rejected"].includes(certification.status)) {
      throw new Error("Only pending or rejected certifications can be deleted");
    }

    await ctx.db.delete(args.certificationId);
    return null;
  },
});

/**
 * Renew an expired certification
 */
export const renewCertification = mutation({
  args: { certificationId: v.id("qualityCertifications") },
  returns: v.id("qualityCertifications"),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const oldCert = await ctx.db.get(args.certificationId);

    if (!oldCert) {
      throw new Error("Certification not found");
    }

    if (oldCert.sellerId !== userId) {
      throw new Error("You can only renew your own certifications");
    }

    if (oldCert.status !== "expired") {
      throw new Error("Only expired certifications can be renewed");
    }

    // Create new certification application based on old one
    const now = Date.now();
    const newCertId = await ctx.db.insert("qualityCertifications", {
      sellerId: userId,
      certificationType: oldCert.certificationType,
      certificationName: oldCert.certificationName,
      issuerName: oldCert.issuerName,
      certificateNumber: oldCert.certificateNumber,
      issueDate: now,
      expiryDate: undefined, // Will be set when approved
      status: "pending",
      documentStorageId: oldCert.documentStorageId, // Reuse document
      notes: `Renewal of certification ${oldCert._id}`,
      createdAt: now,
      updatedAt: now,
    });

    return newCertId;
  },
});

/**
 * Get pending certifications (Admin only)
 */
export const getPendingCertifications = query({
  args: {
    certificationType: v.optional(v.union(
      v.literal("organic"),
      v.literal("fssai"),
      v.literal("iso"),
      v.literal("gmp"),
      v.literal("halal"),
      v.literal("custom")
    )),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let query = ctx.db
      .query("qualityCertifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"));

    if (args.certificationType) {
      query = query.filter((q) => q.eq(q.field("certificationType"), args.certificationType));
    }

    const certifications = await query.collect();

    // Enrich with seller info and document URLs
    return await Promise.all(
      certifications.map(async (cert) => {
        const seller = await getUserProfile(ctx, cert.sellerId);
        const documentUrl = cert.documentStorageId
          ? await ctx.storage.getUrl(cert.documentStorageId)
          : null;

        return {
          ...cert,
          seller: seller ? { fullName: seller.fullName, businessName: seller.businessName } : null,
          documentUrl,
        };
      })
    );
  },
});

/**
 * Approve certification (Admin only)
 */
export const approveCertification = mutation({
  args: {
    certificationId: v.id("qualityCertifications"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const certification = await ctx.db.get(args.certificationId);

    if (!certification) {
      throw new Error("Certification not found");
    }

    if (certification.status !== "pending") {
      throw new Error("Only pending certifications can be approved");
    }

    const now = Date.now();
    await ctx.db.patch(args.certificationId, {
      status: "approved",
      verifiedBy: adminId,
      verifiedAt: now,
      notes: args.notes?.trim() || certification.notes,
      updatedAt: now,
    });

    // Send notification to seller
    await ctx.db.insert("notifications", {
      userId: certification.sellerId,
      type: "order_new", // Reuse existing type, can add "certification_approved" later
      title: "Certification Approved!",
      content: `Your ${certification.certificationName} certification has been approved.`,
      isRead: false,
      link: "portfolio",
      timestamp: now,
    });

    return null;
  },
});

/**
 * Reject certification (Admin only)
 */
export const rejectCertification = mutation({
  args: {
    certificationId: v.id("qualityCertifications"),
    rejectionReason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const adminId = await requireAdmin(ctx);
    const certification = await ctx.db.get(args.certificationId);

    if (!certification) {
      throw new Error("Certification not found");
    }

    if (certification.status !== "pending") {
      throw new Error("Only pending certifications can be rejected");
    }

    const now = Date.now();
    await ctx.db.patch(args.certificationId, {
      status: "rejected",
      verifiedBy: adminId,
      verifiedAt: now,
      rejectionReason: args.rejectionReason.trim(),
      updatedAt: now,
    });

    // Send notification to seller
    await ctx.db.insert("notifications", {
      userId: certification.sellerId,
      type: "order_new",
      title: "Certification Rejected",
      content: `Your ${certification.certificationName} certification was rejected: ${args.rejectionReason}`,
      isRead: false,
      link: "portfolio",
      timestamp: now,
    });

    return null;
  },
});

/**
 * Revoke certification (Admin only)
 */
export const revokeCertification = mutation({
  args: {
    certificationId: v.id("qualityCertifications"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const certification = await ctx.db.get(args.certificationId);

    if (!certification) {
      throw new Error("Certification not found");
    }

    if (certification.status !== "approved") {
      throw new Error("Only approved certifications can be revoked");
    }

    const now = Date.now();
    await ctx.db.patch(args.certificationId, {
      status: "revoked",
      notes: args.reason ? `${certification.notes || ""}\nRevoked: ${args.reason}`.trim() : certification.notes,
      updatedAt: now,
    });

    // Send notification to seller
    await ctx.db.insert("notifications", {
      userId: certification.sellerId,
      type: "order_new",
      title: "Certification Revoked",
      content: `Your ${certification.certificationName} certification has been revoked.${args.reason ? ` Reason: ${args.reason}` : ""}`,
      isRead: false,
      link: "portfolio",
      timestamp: now,
    });

    return null;
  },
});

/**
 * Internal mutation to expire certifications (called by cron)
 */
export const expireCertifications = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const certifications = await ctx.db
      .query("qualityCertifications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .filter((q) => q.neq(q.field("expiryDate"), undefined))
      .collect();

    const expiredCerts = certifications.filter(
      (cert) => cert.expiryDate && cert.expiryDate <= now
    );

    for (const cert of expiredCerts) {
      await ctx.db.patch(cert._id, {
        status: "expired",
        updatedAt: now,
      });

      // Notify seller
      await ctx.db.insert("notifications", {
        userId: cert.sellerId,
        type: "order_new",
        title: "Certification Expired",
        content: `Your ${cert.certificationName} certification has expired. Please renew it.`,
        isRead: false,
        link: "portfolio",
        timestamp: now,
      });
    }

    return null;
  },
});

/**
 * Internal query to check for expiring certifications
 */
export const checkExpiringCertifications = internalQuery({
  args: {
    daysBeforeExpiry: v.number(),
  },
  returns: v.array(v.id("qualityCertifications")),
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiryThreshold = now + args.daysBeforeExpiry * 24 * 60 * 60 * 1000;

    const certifications = await ctx.db
      .query("qualityCertifications")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .filter((q) => q.neq(q.field("expiryDate"), undefined))
      .collect();

    return certifications
      .filter(
        (cert) =>
          cert.expiryDate &&
          cert.expiryDate > now &&
          cert.expiryDate <= expiryThreshold
      )
      .map((cert: any) => cert._id as Id<"qualityCertifications">);
  },
});
