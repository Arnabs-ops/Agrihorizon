import { useLanguage } from "../../useLanguage";

interface PriceHistoryEntry {
    date: string;
    price: number;
    source: string;
}

interface PriceChartProps {
    history: PriceHistoryEntry[];
}

export function PriceChart({ history }: PriceChartProps) {
    const { t } = useLanguage();

    const formatPrice = (price: number) => `₹${price}/kg`;

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 modern-shadow">
            <h4 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                {t('priceHistory')}
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                <div className="lg:col-span-1 space-y-4">
                    {history.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 group hover:bg-slate-50 px-2 rounded-lg transition-colors">
                            <span className="text-slate-500 font-bold text-sm tracking-tight">{entry.date}</span>
                            <span className="font-black text-slate-900">{formatPrice(entry.price)}</span>
                        </div>
                    ))}
                </div>

                {/* Simple Visual Chart */}
                <div className="lg:col-span-2">
                    <div className="flex items-end justify-center gap-6 h-56 bg-white border border-slate-100 rounded-3xl p-8 relative group/chart">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between py-8 px-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-full border-t border-slate-100 border-dashed transition-colors group-hover/chart:border-slate-200"></div>)}
                        </div>

                        <div className="flex items-end gap-6 relative z-10 h-full w-full justify-center">
                            {history.map((entry, index) => {
                                const maxPrice = Math.max(...history.map(h => h.price));
                                const height = (entry.price / maxPrice) * 100;
                                return (
                                    <div key={index} className="flex flex-col items-center relative group/bar h-full justify-end animate-entry" style={{ animationDelay: `${index * 100}ms` }}>
                                        <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-12 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-2xl transition-all mb-2 z-20 whitespace-nowrap pointer-events-none">
                                            {formatPrice(entry.price)}
                                        </div>
                                        <div
                                            className="bg-gradient-to-t from-primary to-emerald-400 rounded-t-xl w-14 transition-all duration-700 hover:brightness-110 shadow-lg shadow-primary/10 hover:shadow-primary/30"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                        <span className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.2em]">
                                            {entry.date.split('-')[2]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
