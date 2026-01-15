import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "./useLanguage.tsx";

export type NotificationType = "order_new" | "order_status" | "review_new" | "message" | "stock_empty";

export interface Notification {
    _id: Id<"notifications">;
    userId: Id<"users">;
    type: NotificationType;
    title: string;
    content: string;
    isRead: boolean;
    link?: string;
    timestamp: number;
}

export function NotificationCenter({ onNavigate }: { onNavigate?: (link: string) => void }) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const notifications = useQuery(api.notifications.getMyNotifications) as Notification[] | undefined;
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);

    const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead({ notificationId: notification._id });
        }
        if (notification.link && onNavigate) {
            onNavigate(notification.link);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-primary transition-colors bg-white rounded-xl shadow-sm border border-slate-100 active:scale-95"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-scale-up origin-top-right">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-slate-900">{t('notifications')}</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-[10px] font-black uppercase text-primary hover:underline"
                                >
                                    {t('markAllAsRead')}
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {!notifications || notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-4xl mb-2">📭</p>
                                    <p className="text-xs font-bold text-slate-400">{t('noNotifications')}</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 relative group ${!n.isRead ? "bg-primary/5" : ""}`}
                                    >
                                        {!n.isRead && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
                                        )}
                                        <div className="ml-2">
                                            <p className="text-xs font-black text-slate-900 mb-0.5">{n.title}</p>
                                            <p className="text-[11px] text-slate-500 leading-relaxed">{n.content}</p>
                                            <p className="text-[9px] text-slate-400 mt-2 font-medium">
                                                {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications && notifications.length > 5 && (
                            <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 italic">Showing recent updates</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
