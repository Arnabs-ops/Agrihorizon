import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to expire certifications daily
 */
export const expireCertificationsDaily = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runMutation(internal.certifications.expireCertifications, {});
    return null;
  },
});

/**
 * Internal mutation to send expiry warnings
 */
export const sendExpiryWarnings = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check for certifications expiring in 30 days
    const expiring30Days = await ctx.runQuery(internal.certifications.checkExpiringCertifications, {
      daysBeforeExpiry: 30,
    });

    // Check for certifications expiring in 7 days
    const expiring7Days = await ctx.runQuery(internal.certifications.checkExpiringCertifications, {
      daysBeforeExpiry: 7,
    });

    const now = Date.now();

    // Send notifications for 30-day warnings (only if not already notified)
    for (const certId of expiring30Days) {
      const cert = await ctx.db.get(certId);
      if (cert && cert.status === "approved") {
        // Check if notification already sent (simple check - can be improved)
        const recentNotifications = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", cert.sellerId))
          .filter((q) => q.gte(q.field("timestamp"), now - 24 * 60 * 60 * 1000)) // Last 24 hours
          .collect();

        const alreadyNotified = recentNotifications.some(
          (n) => n.content.includes(cert.certificationName) && n.content.includes("expiring")
        );

        if (!alreadyNotified) {
          await ctx.db.insert("notifications", {
            userId: cert.sellerId,
            type: "order_new",
            title: "Certification Expiring Soon",
            content: `Your ${cert.certificationName} certification will expire in 30 days. Please renew it.`,
            isRead: false,
            link: "portfolio",
            timestamp: now,
          });
        }
      }
    }

    // Send notifications for 7-day warnings
    for (const certId of expiring7Days) {
      const cert = await ctx.db.get(certId);
      if (cert && cert.status === "approved") {
        const recentNotifications = await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", cert.sellerId))
          .filter((q) => q.gte(q.field("timestamp"), now - 24 * 60 * 60 * 1000))
          .collect();

        const alreadyNotified = recentNotifications.some(
          (n) => n.content.includes(cert.certificationName) && n.content.includes("7 days")
        );

        if (!alreadyNotified) {
          await ctx.db.insert("notifications", {
            userId: cert.sellerId,
            type: "order_new",
            title: "Certification Expiring Soon!",
            content: `Your ${cert.certificationName} certification will expire in 7 days. Please renew it immediately.`,
            isRead: false,
            link: "portfolio",
            timestamp: now,
          });
        }
      }
    }

    return null;
  },
});

const crons = cronJobs();

// Run certification expiry check daily at midnight UTC
crons.cron(
  "expire-certifications",
  "0 0 * * *", // Every day at midnight
  internal.crons.expireCertificationsDaily,
  {}
);

// Run expiry warnings weekly (every Monday at 9 AM UTC)
crons.cron(
  "certification-expiry-warnings",
  "0 9 * * 1", // Every Monday at 9 AM
  internal.crons.sendExpiryWarnings,
  {}
);

export default crons;
