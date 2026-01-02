import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Get all conversations for the current user
export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const allConversations = await ctx.db.query("conversations").collect();
    
    // Filter conversations where user is a participant
    const userConversations = allConversations.filter(conversation => 
      conversation.participants.includes(userId)
    );

    // Sort by last message time
    userConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    // Get participant details for each conversation
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conversation) => {
        const otherParticipantId = conversation.participants.find((id: any) => id !== userId);
        if (!otherParticipantId) return null;

        const otherUser = await ctx.db.get(otherParticipantId);
        const otherProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", otherParticipantId))
          .unique();

        return {
          ...conversation,
          otherParticipant: {
            user: otherUser,
            profile: otherProfile,
          },
        };
      })
    );

    return conversationsWithDetails.filter(Boolean);
  },
});

// Get messages for a specific conversation
export const getConversationMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Verify user is part of this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error("Access denied");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => 
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const senderProfile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user_id", (q) => q.eq("userId", message.senderId))
          .unique();

        return {
          ...message,
          sender: {
            user: sender,
            profile: senderProfile,
          },
        };
      })
    );

    return messagesWithSenders;
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    recipientId: v.optional(v.id("users")),
    content: v.string(),
    messageType: v.union(v.literal("text"), v.literal("image")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    let conversationId = args.conversationId;

    // If no conversation ID provided, create or find existing conversation
    if (!conversationId && args.recipientId) {
      // Check if conversation already exists
      const allConversations = await ctx.db.query("conversations").collect();
      const existingConversation = allConversations.find(conversation => 
        conversation.participants.includes(userId) && 
        args.recipientId && conversation.participants.includes(args.recipientId) &&
        conversation.participants.length === 2
      );

      if (existingConversation) {
        conversationId = existingConversation._id as Id<"conversations">;
      } else {
        // Create new conversation
        conversationId = await ctx.db.insert("conversations", {
          participants: [userId, args.recipientId],
          lastMessageTime: Date.now(),
          lastMessage: args.content,
        });
      }
    }

    if (!conversationId) {
      throw new Error("Conversation ID or recipient ID required");
    }

    // Verify user is part of this conversation
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error("Access denied");
    }

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      senderId: userId,
      content: args.content,
      messageType: args.messageType,
      isRead: false,
    });

    // Update conversation's last message
    await ctx.db.patch(conversationId, {
      lastMessageTime: Date.now(),
      lastMessage: args.content,
    });

    return messageId;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    // Verify user is part of this conversation
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      throw new Error("Access denied");
    }

    // Get all unread messages in this conversation that are not from the current user
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isRead"), false),
          q.neq(q.field("senderId"), userId)
        )
      )
      .collect();

    // Mark all as read
    await Promise.all(
      unreadMessages.map(message => 
        ctx.db.patch(message._id, { isRead: true })
      )
    );

    return unreadMessages.length;
  },
});

// Get all users (for starting new conversations)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated");
    }

    const profiles = await ctx.db.query("userProfiles").collect();
    
    // Filter out current user and get user details
    const usersWithProfiles = await Promise.all(
      profiles
        .filter(profile => profile.userId !== userId)
        .map(async (profile) => {
          const user = await ctx.db.get(profile.userId);
          return {
            user,
            profile,
          };
        })
    );

    return usersWithProfiles.filter(item => item.user);
  },
});
