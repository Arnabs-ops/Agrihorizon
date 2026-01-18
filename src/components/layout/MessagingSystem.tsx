import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { VoiceInput } from "../common/VoiceInput";
import { ConversationWithDetails, MessageWithSender } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface MessagingSystemProps {
    onClose: () => void;
}

export function MessagingSystem({ onClose }: MessagingSystemProps) {
    const { t } = useLanguage();
    const { handleError } = useErrorHandler();
    const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [showNewConversation, setShowNewConversation] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversations = (useQuery(api.messages.getUserConversations) || []) as ConversationWithDetails[];
    const messages = (useQuery(
        api.messages.getConversationMessages,
        selectedConversation ? { conversationId: selectedConversation } : "skip"
    ) || []) as MessageWithSender[];
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
            markAsRead({ conversationId: selectedConversation }).catch(err => {
                console.error("Failed to mark messages as read:", err);
            });
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
            handleError(error, "genericError");
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
            handleError(error, "genericError");
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-entry">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[700px] flex overflow-hidden border border-slate-100 dark:border-slate-800 modern-shadow">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-900/50">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('messages')}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewConversation(true)}
                                className="p-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all active:scale-95 shadow-sm"
                                title={t('newConversation')}
                            >
                                <span className="text-xl">✉️</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                            >
                                <span className="text-xl">✕</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <div className="text-5xl mb-4">📭</div>
                                <p className="font-bold text-sm mb-4">{t('noConversationsYet')}</p>
                                <button
                                    onClick={() => setShowNewConversation(true)}
                                    className="px-6 py-2 bg-primary/10 text-primary rounded-xl font-black text-xs uppercase hover:bg-primary hover:text-white transition-all"
                                >
                                    {t('startConversation')}
                                </button>
                            </div>
                        ) : (
                            conversations.map((conversation) => (
                                <div
                                    key={conversation._id}
                                    onClick={() => setSelectedConversation(conversation._id as Id<"conversations">)}
                                    className={`p-5 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800 group relative ${selectedConversation === (conversation._id as Id<"conversations">)
                                        ? "bg-white dark:bg-slate-800 shadow-lg z-10 scale-[1.02]"
                                        : ""
                                        }`}
                                >
                                    {selectedConversation === (conversation._id as Id<"conversations">) && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"></div>
                                    )}
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                                            <span className="text-xl">
                                                {conversation.otherParticipant?.profile?.role === "seller" ? "🚜" : "🛒"}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-black text-slate-900 dark:text-white truncate">
                                                    {conversation.otherParticipant?.profile?.fullName || "Unknown User"}
                                                </p>
                                                {conversation.lastMessageTime && (
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {formatTime(conversation.lastMessageTime)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 truncate dark:text-slate-400">
                                                {conversation.lastMessage || t('noMessagesYet') || "No messages yet"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                    {selectedConversation && selectedConv ? (
                        <>
                            {/* Messages Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center animate-pulse">
                                        <span className="text-xl">
                                            {selectedConv.otherParticipant?.profile?.role === "seller" ? "🚜" : "🛒"}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">
                                            {selectedConv.otherParticipant?.profile?.fullName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                {selectedConv.otherParticipant?.profile?.role === "seller" ? t('seller') : t('buyer')}
                                                {selectedConv.otherParticipant?.profile?.location &&
                                                    ` • ${selectedConv.otherParticipant.profile.location}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-900/50 custom-scrollbar">
                                {messages.map((message) => {
                                    const isFromOther = message.sender.user?._id === selectedConv.otherParticipant?.user?._id;
                                    return (
                                        <div
                                            key={message._id}
                                            className={`flex ${isFromOther ? "justify-start" : "justify-end"} animate-slide-in`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm ${isFromOther
                                                    ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700"
                                                    : "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20"
                                                    }`}
                                            >
                                                <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                                                <p className={`text-[9px] mt-2 font-black uppercase tracking-widest ${isFromOther
                                                    ? "text-slate-400"
                                                    : "text-white/70"
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
                            <form onSubmit={handleSendMessage} className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                                    <VoiceInput
                                        value={newMessage}
                                        onChange={setNewMessage}
                                        placeholder={t('typeMessagePlaceholder')}
                                        className="flex-1 px-4 py-3 bg-transparent border-none focus:ring-0 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-8 py-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/25 active:scale-95"
                                    >
                                        {t('send')}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 p-12">
                            <div className="text-center">
                                <div className="text-7xl mb-6 animate-float opacity-50">💬</div>
                                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">{t('welcome')}</h4>
                                <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">{t('selectConversationToStart')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Conversation Modal */}
                {showNewConversation && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[110] p-6 animate-in fade-in zoom-in duration-300">
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('startNewConversation')}</h4>
                                <button
                                    onClick={() => setShowNewConversation(false)}
                                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <span className="text-xl">✕</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {allUsers
                                    .filter(userProfile => userProfile.user)
                                    .map((userProfile) => (
                                        <div
                                            key={userProfile.user!._id}
                                            onClick={() => handleStartNewConversation(userProfile.user!._id as Id<"users">)}
                                            className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] hover:shadow-md animate-slide-in"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                                                    <span className="text-base">
                                                        {userProfile.profile.role === "seller" ? "🚜" : "🛒"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white">
                                                        {userProfile.profile.fullName}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase text-primary tracking-widest">
                                                            {userProfile.profile.role === "seller" ? t('seller') : t('buyer')}
                                                        </span>
                                                        {userProfile.profile.location && (
                                                            <span className="text-[9px] font-bold text-slate-400">
                                                                • {userProfile.profile.location}
                                                            </span>
                                                        )}
                                                    </div>
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
