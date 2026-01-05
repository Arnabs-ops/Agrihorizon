import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Verify user is a buyer
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "buyer") {
      throw new Error("Only buyers can create orders");
    }

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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Verify user is a buyer
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!userProfile || userProfile.role !== "buyer") {
      throw new Error("Only buyers can mark orders as paid");
    }

    const paymentDate = Date.now();

    // Process each order
    for (const orderId of args.orderIds) {
      const order = await ctx.db.get(orderId);

      if (!order || order.buyerId !== userId) {
        throw new Error("Order not found or access denied");
      }

      if (order.isPaid || order.isPaid === undefined) {
        continue; // Skip already paid or legacy orders
      }

      // Get product to reduce stock
      const product = await ctx.db.get(order.productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check stock availability
      if (product.stockQuantity < order.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      // Mark order as paid
      await ctx.db.patch(orderId, {
        isPaid: true,
        paymentDate,
      });

      // Reduce product stock
      await ctx.db.patch(order.productId, {
        stockQuantity: product.stockQuantity - order.quantity,
      });

      // Trigger delivery simulation
      await ctx.scheduler.runAfter(10000, internal.orders.advanceDeliverySimulation, {
        orderId,
        nextStep: "picking_up",
      });
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyerId", userId))
      .order("desc")
      .collect();

    // Get product and seller details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const product = await ctx.db.get(order.productId);
        const seller = await ctx.db.get(order.sellerId);
        const sellerProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", order.sellerId))
          .unique();

        return {
          ...order,
          product,
          seller: {
            user: seller,
            profile: sellerProfile,
          },
        };
      })
    );

    return ordersWithDetails;
  },
});

// Get seller orders
export const getSellerOrders = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Only show paid orders to sellers
    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .collect();

    const orders = allOrders.filter(order => order.isPaid === true || order.isPaid === undefined);

    // Get product and buyer details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const product = await ctx.db.get(order.productId);
        const buyer = await ctx.db.get(order.buyerId);
        const buyerProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", order.buyerId))
          .unique();

        return {
          ...order,
          product,
          buyer: {
            user: buyer,
            profile: buyerProfile,
          },
        };
      })
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order || order.sellerId !== userId) {
      throw new Error("Order not found or access denied");
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

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
