import React from 'react';
import { useLanguage } from '../../useLanguage';
import { AnalyticsData } from '../../types/seller';

interface SellerAnalyticsProps {
    analytics: AnalyticsData;
    formatPrice: (price: number) => string;
}

export function SellerAnalytics({ analytics, formatPrice }: SellerAnalyticsProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">{t('analytics')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 modern-shadow">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        Top Products
                    </h3>
                    <div className="space-y-6">
                        {analytics?.topProducts?.map((product: any, index: number) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-slate-700">{product.name}</span>
                                    <span className="text-primary">{product.sales} {t('delivered')}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${product.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) || (
                                <p className="text-slate-400 text-center py-8 font-medium italic">No sales data yet.</p>
                            )}
                    </div>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-8 modern-shadow relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <h3 className="text-lg font-black mb-8 relative z-10">{t('monthlyRevenue')}</h3>
                    <div className="space-y-8 relative z-10">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-4xl font-black text-primary mb-1">
                                {formatPrice(analytics?.monthlyRevenue || 0)}
                            </p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('monthlyRevenue')}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-2xl font-black text-blue-400">{analytics?.completedOrders || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('delivered')}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-2xl font-black text-emerald-400">{analytics?.totalProducts || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('inventory')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
