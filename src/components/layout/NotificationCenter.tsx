import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "../../context/LanguageContext";

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
                className="relative p-2.5 text-slate-500 hover:text-primary transition-all bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-sm border border-slate-100 dark:border-slate-800 active:scale-95 group"
            >
                <span className="text-xl group-hover:rotate-12 transition-transform inline-block">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-4 w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-entry origin-top-right modern-shadow">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{t('notifications')}</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-[10px] font-black uppercase text-primary hover:underline bg-primary/10 px-3 py-1 rounded-full transition-all"
                                >
                                    {t('markAllAsRead')}
                                </button>
                            )}
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                            {!notifications || notifications.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-5xl mb-4 animate-float opacity-50">📭</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('noNotifications')}</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`p-5 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 relative group ${!n.isRead ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                                    >
                                        {!n.isRead && (
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                        )}
                                        <div className="ml-4">
                                            <p className="text-xs font-black text-slate-900 dark:text-white mb-1 leading-tight group-hover:text-primary transition-colors">{n.title}</p>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{n.content}</p>
                                            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 mt-2.5 tracking-tighter">
                                                {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications && notifications.length > 5 && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 text-center border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60 italic">
                                    {t('showingRecentUpdates')}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
