import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAuth, requireRole, enrichOrderWithDetails, Errors } from "./helpers";

const FAKE_DRIVERS = [
  { name: "Rajesh Kumar", phone: "+91 98765-43210" },
  { name: "Suresh Singh", phone: "+91 91234-56789" },
  { name: "Amit Patel", phone: "+91 99887-76655" },
  { name: "Vikram Sharma", phone: "+91 95555-44444" },
  { name: "Deepak Yadav", phone: "+91 93333-22222" },
];

// Create new order (buyer)
export const createOrder = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    deliveryAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "buyer");

    // Get product details
    const product = await ctx.db.get(args.productId);
    if (!product || !product.isActive) {
      throw new Error("Product not found or not available");
    }

    // Check stock availability
    if (product.stockQuantity < args.quantity) {
      throw new Error("Insufficient stock available");
    }

    // Calculate total amount with tiered pricing
    let unitPrice = product.price;
    if (product.priceTiers && product.priceTiers.length > 0) {
      // Find the best tier (highest minQuantity <= args.quantity)
      const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
      const tier = sortedTiers.find(t => args.quantity >= t.minQuantity);
      if (tier) {
        unitPrice = tier.price;
      }
    }

    const totalAmount = unitPrice * args.quantity;

    // Assign a random fake driver
    const randomDriver = FAKE_DRIVERS[Math.floor(Math.random() * FAKE_DRIVERS.length)];

    // Create order (unpaid initially)
    const orderId = await ctx.db.insert("orders", {
      buyerId: userId,
      sellerId: product.sellerId,
      productId: args.productId,
      quantity: args.quantity,
      unitPrice: unitPrice,
      totalAmount,
      status: "pending",
      orderDate: Date.now(),
      deliveryAddress: args.deliveryAddress,
      notes: args.notes,
      isPaid: false,
      driverName: randomDriver.name,
      driverPhone: randomDriver.phone,
      deliveryStep: "assigning",
    });

    // Notify seller about new order
    await ctx.db.insert("notifications", {
      userId: product.sellerId,
      type: "order_new",
      title: "New Order Received!",
      content: `You have a new order for ${args.quantity} ${product.unit} of ${product.name}.`,
      isRead: false,
      link: "orders",
      timestamp: Date.now(),
    });

    // Stock will be reduced when payment is confirmed
    return orderId;
  },
});

// Mark orders as paid (buyer)
export const markOrdersAsPaid = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    nonce: v.optional(v.string()),
    signature: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "buyer");

    const paymentDate = Date.now();
    const failedOrders: { orderId: Id<"orders">; productName: string; reason: string }[] = [];

    // Process each order
    for (const orderId of args.orderIds) {
      const order = await ctx.db.get(orderId);

      if (!order || order.buyerId !== userId) {
        throw new Error("Order not found or access denied");
      }

      // Idempotency: Skip if already paid
      if (order.isPaid || order.paymentStatus === "paid") {
        continue;
      }

      // Security Checks (if nonce provided)
      if (args.nonce) {
        if (order.paymentNonce !== args.nonce) {
          await ctx.db.insert("paymentAuditLogs", {
            orderId, userId, action: "fraud_detected",
            details: `Nonce mismatch. Provided: ${args.nonce}, Expected: ${order.paymentNonce}`,
            statusBefore: order.paymentStatus, statusAfter: "failed", timestamp: Date.now()
          });
          throw new Error("Invalid payment nonce. Possible tampering.");
        }

        if (order.paymentExpiry && Date.now() > order.paymentExpiry) {
          await ctx.db.patch(orderId, { paymentStatus: "expired" });
          await ctx.db.insert("paymentAuditLogs", {
            orderId, userId, action: "payment_expired",
            details: `Payment expired at ${new Date(order.paymentExpiry).toISOString()}`,
            statusBefore: order.paymentStatus, statusAfter: "expired", timestamp: Date.now()
          });
          throw new Error("Payment session expired. Please scan again.");
        }
      }

      // Get product to reduce stock
      const product = await ctx.db.get(order.productId);
      if (!product) throw new Error("Product not found");

      // Check stock availability
      if (product.stockQuantity < order.quantity) {
        await ctx.db.insert("notifications", {
          userId: order.buyerId,
          type: "order_status",
          title: "Order Failed",
          content: `Your order for ${product.name} could not be processed due to insufficient stock.`,
          isRead: false,
          link: "orders",
          timestamp: Date.now(),
        });
        failedOrders.push({ orderId, productName: product.name, reason: "Insufficient stock" });
        continue;
      }

      // Mark order as paid
      await ctx.db.patch(orderId, {
        isPaid: true,
        paymentDate,
        paymentStatus: "paid",
        status: "processing", // Move to processing stage
      });

      // Audit Log
      await ctx.db.insert("paymentAuditLogs", {
        orderId,
        userId,
        action: "payment_confirmed",
        details: `Confirmed for amount: ${order.lockedAmount || order.totalAmount}`,
        statusBefore: order.paymentStatus,
        statusAfter: "paid",
        timestamp: Date.now(),
      });

      // Reduce product stock
      await ctx.db.patch(order.productId, {
        stockQuantity: product.stockQuantity - order.quantity,
      });

      // Handle stock empty notification
      const updatedProduct = await ctx.db.get(order.productId);
      if (updatedProduct && updatedProduct.stockQuantity === 0) {
        await ctx.db.insert("notifications", {
          userId: updatedProduct.sellerId,
          type: "stock_empty",
          title: "Stock Empty!",
          content: `Your product "${updatedProduct.name}" is out of stock.`,
          isRead: false,
          link: "products",
          timestamp: Date.now(),
        });
        await ctx.db.patch(order.productId, { isActive: false });
      }

      // Trigger delivery simulation
      await ctx.scheduler.runAfter(10000, internal.orders.advanceDeliverySimulation, {
        orderId,
        nextStep: "picking_up",
      });
    }

    if (failedOrders.length > 0) {
      return { success: false, failedOrders, message: "Some orders could not be processed due to insufficient stock." };
    }

    return { success: true, paidCount: args.orderIds.length };
  },
});

// Internal mutation to advance delivery simulation steps
export const advanceDeliverySimulation = internalMutation({
  args: {
    orderId: v.id("orders"),
    nextStep: v.union(v.literal("picking_up"), v.literal("delivering"), v.literal("delivered")),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return;

    await ctx.db.patch(args.orderId, {
      deliveryStep: args.nextStep,
      // If delivered, also update the main status
      ...(args.nextStep === "delivered" ? { status: "delivered" } : {}),
      // If picking up, maybe set status to processing
      ...(args.nextStep === "picking_up" ? { status: "shipped" } : {}),
    });

    // Schedule next step if not already delivered
    if (args.nextStep === "picking_up") {
      await ctx.scheduler.runAfter(20000, internal.orders.advanceDeliverySimulation, {
        orderId: args.orderId,
        nextStep: "delivering",
      });
    } else if (args.nextStep === "delivering") {
      await ctx.scheduler.runAfter(20000, internal.orders.advanceDeliverySimulation, {
        orderId: args.orderId,
        nextStep: "delivered",
      });
    }
  },
});

// Get buyer orders
export const getBuyerOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyerId", userId))
      .order("desc")
      .collect();

    // Enrich orders with details
    const ordersWithDetails = await Promise.all(
      orders.map(order => enrichOrderWithDetails(ctx, order))
    );

    return ordersWithDetails;
  },
});

// Get seller orders
export const getSellerOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    // Only show paid orders to sellers
    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .collect();

    const orders = allOrders.filter(order => order.isPaid === true || order.isPaid === undefined);

    // Enrich orders with details
    const ordersWithDetails = await Promise.all(
      orders.map(order => enrichOrderWithDetails(ctx, order))
    );

    return ordersWithDetails;
  },
});

// Update order status (seller)
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.sellerId !== userId) {
      throw new Error(Errors.ACCESS_DENIED);
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
    });

    // Notify buyer about status update
    await ctx.db.insert("notifications", {
      userId: order.buyerId,
      type: "order_status",
      title: "Order Status Updated",
      content: `Your order for ${order.product?.name} is now ${args.status}.`,
      isRead: false,
      link: "orders",
      timestamp: Date.now(),
    });

    return args.orderId;
  },
});

// Get seller analytics
export const getSellerAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .collect();

    const products = await ctx.db
      .query("products")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .collect();

    // Calculate analytics
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.isActive).length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const completedOrders = orders.filter(o => o.status === "delivered").length;

    // Calculate monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = orders
      .filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear &&
          order.status === "delivered";
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get top products by sales
    const productSales = new Map();
    orders.forEach(order => {
      if (order.status === "delivered") {
        const current = productSales.get(order.productId) || 0;
        productSales.set(order.productId, current + order.quantity);
      }
    });

    const topProducts = await Promise.all(
      Array.from(productSales.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(async ([productId, sales]) => {
          const product = await ctx.db.get(productId as Id<"products">);
          return {
            name: product?.name || "Unknown",
            sales,
            percentage: Math.min(100, (sales / Math.max(...productSales.values())) * 100)
          };
        })
    );

    return {
      totalProducts,
      activeProducts,
      pendingOrders,
      completedOrders,
      monthlyRevenue,
      topProducts,
    };
  },
});

// Delete order (cart item)
export const deleteOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.buyerId !== userId) {
      throw new Error(Errors.ACCESS_DENIED);
    }

    // Only allow deleting unpaid orders (cart items)
    if (order.isPaid) {
      throw new Error("Cannot delete a paid order");
    }

    await ctx.db.delete(args.orderId);
    return args.orderId;
  },
});
