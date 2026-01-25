import React from 'react';
import { OnboardingChecklist } from '../onboarding/OnboardingChecklist';
import { useLanguage } from '../../context/LanguageContext';
import { useFormatters } from '../../hooks/useFormatters';
import { OrderStatus } from '../../lib/constants';
import type { AnalyticsData, OrderWithDetails, UserProfile } from '../../types';

interface SellerOverviewProps {
    analytics: AnalyticsData;
    profile: UserProfile['profile'];
    sellerOrders: OrderWithDetails[];
    setActiveTab: (tab: string) => void;
}

export function SellerOverview({
    analytics,
    profile,
    sellerOrders,
    setActiveTab,
}: SellerOverviewProps) {
    const { t } = useLanguage();
    const { formatPrice, formatDate, getStatusColor } = useFormatters();

    if (!profile) return null;

    return (
        <div className="space-y-8 animate-entry">
            <div className="dashboard-grid">
                {/* Marketplace Stat */}
                <div className="bg-gradient-to-br from-[#0f172a] to-[#020617] dark:from-[#1e293b] dark:to-[#020617] px-6 py-10 rounded-[2rem] text-white shadow-xl relative overflow-hidden group hover:scale-[1.05] transition-all duration-300 border border-white/5 flex flex-col justify-between min-h-[160px]">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                        {t('marketplace')}
                    </h3>
                    <div>
                        <p className="text-5xl font-black mb-1">{analytics?.totalProducts || 0}</p>
                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{t('activeListings')}</p>
                    </div>
                </div>

                {/* Pending Orders Stat */}
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] dark:from-[#334155] dark:to-[#0f172a] px-6 py-10 rounded-[2rem] text-white shadow-xl relative overflow-hidden group hover:scale-[1.05] transition-all duration-300 border border-white/5 flex flex-col justify-between min-h-[160px]">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                        {t('pending')}
                    </h3>
                    <div>
                        <p className="text-5xl font-black mb-1">{analytics?.pendingOrders || 0}</p>
                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{t('awaitingFulfillment')}</p>
                    </div>
                </div>

                {/* Monthly Revenue Stat */}
                <div className="bg-gradient-to-br from-[#334155] to-[#1e293b] dark:from-[#475569] dark:to-[#1e293b] px-6 py-10 rounded-[2rem] text-white shadow-xl relative overflow-hidden group hover:scale-[1.05] transition-all duration-300 border border-white/5 flex flex-col justify-between min-h-[160px]">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                        {t('monthlyRevenue')}
                    </h3>
                    <div>
                        <p className="text-4xl font-black mb-1">
                            {formatPrice(analytics?.monthlyRevenue || 0).split('.')[0]}
                        </p>
                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{t('thisMonth')}</p>
                    </div>
                </div>

                {/* Delivered Stat */}
                <div className="bg-gradient-to-br from-[#475569] to-[#334155] dark:from-[#64748b] dark:to-[#334155] px-6 py-10 rounded-[2rem] text-white shadow-xl relative overflow-hidden group hover:scale-[1.05] transition-all duration-300 border border-white/5 flex flex-col justify-between min-h-[160px]">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                        {t('delivered')}
                    </h3>
                    <div>
                        <p className="text-5xl font-black mb-1">{analytics?.completedOrders || 0}</p>
                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{t('allTimeCompletion')}</p>
                    </div>
                </div>
            </div>

            <OnboardingChecklist userRole="seller" />

            {profile.farmSize && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 modern-shadow transition-colors duration-500">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        {t('farmInformation')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('farmSizeLabel')}</p>
                            <p className="font-bold text-slate-900 dark:text-white capitalize text-lg">{profile.farmSize}</p>
                        </div>
                        {profile.cropTypes && profile.cropTypes.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('cropTypesLabel')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.cropTypes.map((crop, index) => (
                                        <span
                                            key={index}
                                            className="bg-primary/5 dark:bg-primary/20 text-primary px-3 py-1.5 rounded-xl text-sm font-bold border border-primary/10"
                                        >
                                            {crop}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 modern-shadow transition-colors duration-500">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="w-2 h-8 bg-slate-900 dark:bg-white rounded-full"></span>
                        {t('recentOrders')}
                    </h3>
                    <button onClick={() => setActiveTab("orders")} className="text-sm font-bold text-primary hover:underline">{t('viewAllOrders')} →</button>
                </div>
                <div className="space-y-4">
                    {sellerOrders.slice(0, 3).map((order) => (
                        <div key={order._id} className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-3xl">
                                {order.product?.imageEmoji}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white">{t('orderFrom')} {order.buyer.profile?.fullName}</p>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{order.product?.name} • {order.quantity} {order.product?.unit}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status as OrderStatus)} shadow-sm`}>
                                        {t(order.status as any) || order.status}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(order.orderDate)}</p>
                            </div>
                        </div>
                    ))}
                    {sellerOrders?.length === 0 && (
                        <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            <p className="text-slate-400 dark:text-slate-500 font-bold">{t('noOrdersYet') || "No orders yet"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
