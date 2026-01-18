import { OnboardingChecklist } from "../onboarding/OnboardingChecklist";
import { useLanguage } from "../../context/LanguageContext";
import type { OrderWithDetails, UserProfile } from "../../types";
import { OrderStatus } from "../../lib/constants";

interface OrdersViewProps {
    activeTab: string;
    setActiveTab: (t: string) => void;
    profile: UserProfile["profile"];
    marketplaceProducts: any[];
    activeOrders: number;
    buyerOrders: OrderWithDetails[];
    formatPrice: (p: number) => string;
    formatDate: (d: number) => string;
    getStatusColor: (s: OrderStatus) => string;
}

export function OrdersView({
    activeTab,
    setActiveTab,
    profile,
    marketplaceProducts,
    activeOrders,
    buyerOrders,
    formatPrice,
    formatDate,
    getStatusColor
}: OrdersViewProps) {
    const { t } = useLanguage();

    if (activeTab === "overview") {
        return (
            <div className="space-y-8 animate-entry">
                <div className="dashboard-grid">
                    <div className="bg-gradient-to-br from-blue-950 to-blue-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">{t('marketplace')}</h3>
                        <p className="text-6xl font-black mb-2">{marketplaceProducts.length}</p>
                        <p className="text-sm font-bold opacity-70">{t('verifiedProducts')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/30 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">{t('myOrders')}</h3>
                        <p className="text-6xl font-black mb-2">{activeOrders}</p>
                        <p className="text-sm font-bold opacity-70">{t('currentlyProcessing')}</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-black/40 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-white/5">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">{t('lifetimeRecords')}</h3>
                        <p className="text-6xl font-black mb-2">{buyerOrders.length}</p>
                        <p className="text-sm font-bold opacity-70">{t('allTimeRecords')}</p>
                    </div>
                </div>

                <OnboardingChecklist userRole="buyer" />

                {profile?.preferredProducts && profile.preferredProducts.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 modern-shadow transition-colors duration-500">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                            {t('catalogInterests')}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {profile.preferredProducts.map((product, index) => (
                                <span
                                    key={index}
                                    className="bg-primary/5 dark:bg-primary/20 text-primary border border-primary/10 px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-colors cursor-default"
                                >
                                    {product}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 modern-shadow transition-colors duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-slate-900 dark:bg-white rounded-full"></span>
                            {t('recentActivity')}
                        </h3>
                        <button onClick={() => setActiveTab("orders")} className="text-sm font-bold text-primary hover:underline">{t('viewAllOrders')} →</button>
                    </div>
                    <div className="space-y-4">
                        {buyerOrders.slice(0, 3).map((order) => (
                            <div key={order._id} className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-3xl">
                                    {order.product?.imageEmoji}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">{order.product?.name}</p>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
                                        {order.quantity} {order.product?.unit} • <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(order.totalAmount)}</span>
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status as OrderStatus)} shadow-sm`}>
                                        {t(order.status as any) || order.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(order.orderDate)}</span>
                                </div>
                            </div>
                        ))}
                        {buyerOrders.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 font-bold">
                                <p className="text-slate-400 dark:text-slate-500">{t('noOrders')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === "orders") {
        return (
            <div className="space-y-6 animate-entry">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('myOrders')}</h2>
                <div className="space-y-4">
                    {buyerOrders.map((order) => (
                        <div key={order._id} className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 modern-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl">
                                        {order.product?.imageEmoji}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white capitalize">{order.product?.name}</h4>
                                        <p className="text-xs font-bold text-slate-400">{formatDate(order.orderDate)}</p>
                                    </div>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status as OrderStatus)}`}>
                                    {t(order.status as any) || order.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                    {order.quantity} {order.product?.unit} x {formatPrice(order.unitPrice || 0)}
                                </p>
                                <p className="text-lg font-black text-primary">{formatPrice(order.totalAmount)}</p>
                            </div>
                        </div>
                    ))}
                    {buyerOrders.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            <span className="text-6xl mb-4 block">📦</span>
                            <p className="text-slate-400 font-bold">{t('noOrders')}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
