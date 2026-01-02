import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface MessagingSystemProps {
  onClose: () => void;
}

export function MessagingSystem({ onClose }: MessagingSystemProps) {
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery(api.messages.getUserConversations) || [];
  const messages = useQuery(
    api.messages.getConversationMessages,
    selectedConversation ? { conversationId: selectedConversation } : "skip"
  ) || [];
  const allUsers = useQuery(api.messages.getAllUsers) || [];

  const sendMessage = useMutation(api.messages.sendMessage);
  const markAsRead = useMutation(api.messages.markMessagesAsRead);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      markAsRead({ conversationId: selectedConversation });
    }
  }, [selectedConversation, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await sendMessage({
        conversationId: selectedConversation,
        content: newMessage.trim(),
        messageType: "text",
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleStartNewConversation = async (recipientId: Id<"users">) => {
    try {
      await sendMessage({
        recipientId,
        content: "Hello! I'm interested in connecting with you.",
        messageType: "text",
      });
      setShowNewConversation(false);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Find the selected conversation
  const selectedConv = conversations.find(c => c && c._id === selectedConversation);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Messages</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                title="New conversation"
              >
                ✉️
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No conversations yet</p>
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-2 text-green-600 hover:underline"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              conversations
                .filter((conversation): conversation is NonNullable<typeof conversation> => conversation !== null)
                .map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => setSelectedConversation(conversation._id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation === conversation._id ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm">
                          {conversation.otherParticipant?.profile?.role === "seller" ? "🚜" : "🛒"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {conversation.otherParticipant?.profile?.fullName || "Unknown User"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && selectedConv ? (
            <>
              {/* Messages Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm">
                      {selectedConv.otherParticipant?.profile?.role === "seller" ? "🚜" : "🛒"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {selectedConv.otherParticipant?.profile?.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedConv.otherParticipant?.profile?.role === "seller" ? "Seller" : "Buyer"}
                      {selectedConv.otherParticipant?.profile?.location && 
                        ` • ${selectedConv.otherParticipant.profile.location}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  const isFromOther = message.sender.user?._id === selectedConv.otherParticipant?.user?._id;
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isFromOther ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isFromOther
                            ? "bg-gray-200 text-gray-800"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isFromOther
                            ? "text-gray-500"
                            : "text-green-100"
                        }`}>
                          {formatTime(message._creationTime)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Start New Conversation</h4>
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {allUsers
                  .filter(userProfile => userProfile.user)
                  .map((userProfile) => (
                    <div
                      key={userProfile.user!._id}
                      onClick={() => handleStartNewConversation(userProfile.user!._id)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs">
                            {userProfile.profile.role === "seller" ? "🚜" : "🛒"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {userProfile.profile.fullName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {userProfile.profile.role === "seller" ? "Seller" : "Buyer"}
                            {userProfile.profile.location && ` • ${userProfile.profile.location}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
