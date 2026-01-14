import React from 'react';
import { OnboardingChecklist } from '../../OnboardingChecklist';
import { useLanguage } from '../../useLanguage';
import { AnalyticsData, Order, UserProfile } from '../../types/seller';
import { Id } from '../../../convex/_generated/dataModel';

interface SellerOverviewProps {
    analytics: AnalyticsData;
    profile: UserProfile['profile'];
    sellerOrders: Order[];
    setActiveTab: (tab: string) => void;
    formatPrice: (price: number) => string;
    formatDate: (timestamp: number) => string;
    getStatusColor: (status: string) => string;
}

export function SellerOverview({
    analytics,
    profile,
    sellerOrders,
    setActiveTab,
    formatPrice,
    formatDate,
    getStatusColor,
}: SellerOverviewProps) {
    const { t } = useLanguage();

    if (!profile) return null;

    return (
        <div className="space-y-8 animate-entry">
            <div className="dashboard-grid">
                {/* Marketplace Stat */}
                <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                        {t('marketplace')}
                    </h3>
                    <p className="text-6xl font-black mb-2">{analytics?.totalProducts || 0}</p>
                    <p className="text-sm font-bold opacity-70">{t('activeListings')}</p>
                </div>

                {/* Pending Orders Stat */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                        {t('pending')}
                    </h3>
                    <p className="text-6xl font-black mb-2">{analytics?.pendingOrders || 0}</p>
                    <p className="text-sm font-bold opacity-70">{t('awaitingFulfillment')}</p>
                </div>

                {/* Monthly Revenue Stat */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-black/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                        {t('monthlyRevenue')}
                    </h3>
                    <p className="text-4xl font-black mb-2">
                        {formatPrice(analytics?.monthlyRevenue || 0)}
                    </p>
                    <p className="text-sm font-bold opacity-70">{t('thisMonth')}</p>
                </div>

                {/* Delivered Stat */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">
                        {t('delivered')}
                    </h3>
                    <p className="text-6xl font-black mb-2">{analytics?.completedOrders || 0}</p>
                    <p className="text-sm font-bold opacity-70">{t('allTimeCompletion')}</p>
                </div>
            </div>

            <OnboardingChecklist userRole="seller" />

            {profile.farmSize && (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 modern-shadow">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <span className="w-2 h-8 bg-primary rounded-full"></span>
                        {t('farmInformation')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('farmSizeLabel')}</p>
                            <p className="font-bold text-slate-900 capitalize text-lg">{profile.farmSize}</p>
                        </div>
                        {profile.cropTypes && profile.cropTypes.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('cropTypesLabel')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.cropTypes.map((crop, index) => (
                                        <span
                                            key={index}
                                            className="bg-primary/5 text-primary px-3 py-1.5 rounded-xl text-sm font-bold border border-primary/10"
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

            <div className="bg-white p-8 rounded-2xl border border-slate-100 modern-shadow">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <span className="w-2 h-8 bg-slate-900 rounded-full"></span>
                        {t('recentOrders')}
                    </h3>
                    <button onClick={() => setActiveTab("orders")} className="text-sm font-bold text-primary hover:underline">{t('viewAllOrders')} →</button>
                </div>
                <div className="space-y-4">
                    {sellerOrders.slice(0, 3).map((order) => (
                        <div key={order._id} className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                            <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-3xl">
                                {order.product?.imageEmoji}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <p className="font-black text-slate-900">{t('orderFrom')} {order.buyer.profile?.fullName}</p>
                                        <p className="text-xs font-bold text-slate-500">{order.product?.name} • {order.quantity} {order.product?.unit}</p>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)} shadow-sm`}>
                                        {t(order.status as any)}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(order.orderDate)}</p>
                            </div>
                        </div>
                    ))}
                    {sellerOrders?.length === 0 && (
                        <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">{t('noOrdersYet') || "No orders yet"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
