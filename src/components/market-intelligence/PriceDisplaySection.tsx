import { useLanguage } from "../../useLanguage";

interface PriceData {
    currentPrice: number | null;
    tomorrowPrediction: {
        min: number;
        max: number;
        range: string;
    } | null;
    analysis: string;
    confidence: string;
    sources: string[];
    vegetable: string;
    location: string;
}

interface PriceDisplaySectionProps {
    priceData: PriceData;
    trend: {
        trend: string;
        message: string;
        color: string;
    } | null;
    userRole: "seller" | "buyer";
}

export function PriceDisplaySection({ priceData, trend, userRole }: PriceDisplaySectionProps) {
    const { t } = useLanguage();

    const formatPrice = (price: number) => `₹${price}/kg`;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Current Price & Prediction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <span className="text-6xl">💰</span>
                    </div>
                    <h4 className="text-sm font-black text-blue-800 dark:text-blue-400 mb-4 uppercase tracking-widest opacity-70">
                        {t('currentPrice')}
                    </h4>
                    <p className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-2">
                        {priceData.currentPrice ? formatPrice(priceData.currentPrice) : "N/A"}
                    </p>
                    <p className="text-sm font-bold text-blue-600/60 dark:text-blue-400/60 flex items-center gap-2">
                        <span className="capitalize">{priceData.vegetable}</span> • {priceData.location}
                    </p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                        <span className="text-6xl">🔮</span>
                    </div>
                    <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 mb-4 uppercase tracking-widest opacity-70">
                        {t('tomorrowPrediction')}
                    </h4>
                    <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                        {priceData.tomorrowPrediction?.range || "N/A"}
                    </p>
                    {trend && (
                        <p className={`text-sm font-bold mt-1 px-3 py-1 bg-white/50 dark:bg-emerald-900/30 rounded-full inline-block ${trend.color} dark:text-emerald-400`}>
                            {trend.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Analysis Card */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <h4 className="text-lg font-black mb-4 relative z-10 flex items-center gap-2">
                    <span className="text-primary text-2xl">⚡</span>
                    {t('marketAnalysis')}
                </h4>
                <p className="text-slate-300 font-medium leading-relaxed relative z-10 mb-6">{priceData.analysis}</p>
                <div className="flex flex-wrap gap-4 relative z-10 border-t border-white/10 pt-6">
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('confidence')}</p>
                        <p className="text-sm font-black text-white">{priceData.confidence}</p>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('sources')}</p>
                        <p className="text-sm font-black text-white">{priceData.sources.join(", ")}</p>
                    </div>
                </div>
            </div>

            {/* Buyer-specific recommendations */}
            {userRole === "buyer" && trend && (
                <div className={`p-8 rounded-3xl border-2 animate-scale-up ${trend.trend === "down" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                    trend.trend === "up" ? "bg-amber-50 border-amber-200 text-amber-900" :
                        "bg-blue-50 border-blue-200 text-blue-900"
                    }`}>
                    <h4 className="text-lg font-black mb-3 flex items-center gap-3">
                        <span className="text-2xl">
                            {trend.trend === "down" ? "💡" : trend.trend === "up" ? "⚠️" : "ℹ️"}
                        </span>
                        {trend.trend === "down" ? t('moneySavingTip') :
                            trend.trend === "up" ? t('priceAlert') :
                                t('marketUpdate')}
                    </h4>
                    <p className="font-bold text-lg opacity-80 leading-snug">
                        {trend.trend === "down"
                            ? t('waitTomorrow')
                            : trend.trend === "up"
                                ? t('buyToday')
                                : t('stableAdvice')
                        }
                    </p>
                </div>
            )}
        </div>
    );
}
