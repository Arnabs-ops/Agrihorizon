import { useLanguage } from "../../context/LanguageContext";
import { VoiceInput } from "../common/VoiceInput";

interface PriceData {
    currentPrice: number | null;
    tomorrowPrediction: {
        min: number;
        max: number;
        range: string;
    } | null;
    vegetable: string;
    location: string;
}

interface HarvestAnalyticsProps {
    priceData: PriceData;
    quantity: number;
    setQuantity: (q: number) => void;
    investment: number;
    setInvestment: (i: number) => void;
    aiStrategyRes: {
        recommendation: string;
        reasoning: string;
        confidence: string;
    } | null;
    onGetStrategy: () => void;
    onResetStrategy: () => void;
    analyzing: boolean;
}

export function HarvestAnalytics({
    priceData,
    quantity,
    setQuantity,
    investment,
    setInvestment,
    aiStrategyRes,
    onGetStrategy,
    onResetStrategy,
    analyzing
}: HarvestAnalyticsProps) {
    const { t } = useLanguage();

    const calculateProfit = (price: number) => {
        if (!quantity) return 0;
        return (price * quantity) - investment;
    };

    const calculateROI = (price: number) => {
        if (!investment || !quantity) return 0;
        const profit = calculateProfit(price);
        return Math.round((profit / investment) * 100);
    };

    const tomorrowAvg = ((priceData.tomorrowPrediction?.min ?? 0) + (priceData.tomorrowPrediction?.max ?? 0)) / 2;

    return (
        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-2 border-primary/10 rounded-3xl p-8 modern-shadow">
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">🧮</span>
                {t('harvestAnalytics')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {t('estimatedYield')}
                    </label>
                    <VoiceInput
                        value={quantity ? String(quantity) : ""}
                        onChange={(val) => setQuantity(Number(val.replace(/[^0-9]/g, "")))}
                        placeholder="e.g. 500"
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all dark:text-white"
                    />
                </div>
                <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {t('productionCost')}
                    </label>
                    <VoiceInput
                        value={investment ? String(investment) : ""}
                        onChange={(val) => setInvestment(Number(val.replace(/[^0-9]/g, "")))}
                        placeholder="e.g. 5000"
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all dark:text-white"
                    />
                </div>
            </div>

            {quantity > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('profitToday')}</p>
                                <p className={`text-2xl font-black ${calculateProfit(priceData.currentPrice || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    ₹{calculateProfit(priceData.currentPrice || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">ROI: {calculateROI(priceData.currentPrice || 0)}%</p>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-1000"
                                style={{ width: `${Math.min(Math.max(calculateROI(priceData.currentPrice || 0), 0), 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('profitTomorrow')}</p>
                                <p className={`text-2xl font-black ${calculateProfit(tomorrowAvg) >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'}`}>
                                    ₹{calculateProfit(tomorrowAvg).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
                                <p className="text-[10px] font-black text-primary">ROI: {calculateROI(tomorrowAvg)}%</p>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: `${Math.min(Math.max(calculateROI(tomorrowAvg), 0), 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* AI Strategy Actions */}
                    <div className="lg:col-span-2 space-y-4">
                        {!aiStrategyRes ? (
                            <button
                                onClick={onGetStrategy}
                                disabled={analyzing || !quantity || !investment}
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {analyzing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {t('analyzing')}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">🤖</span>
                                        {t('getAiStrategy')}
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className={`p-6 rounded-2xl border-2 animate-scale-up ${aiStrategyRes.recommendation?.toUpperCase().includes("WAIT")
                                ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                }`}>
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl bg-white p-2 rounded-xl shadow-sm">
                                        {aiStrategyRes.recommendation?.toUpperCase().includes("WAIT") ? "⏳" : "✅"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className={`font-black uppercase tracking-tight text-lg ${aiStrategyRes.recommendation?.toUpperCase().includes("WAIT")
                                                ? "text-amber-800 dark:text-amber-400"
                                                : "text-emerald-800 dark:text-emerald-400"
                                                }`}>
                                                {aiStrategyRes.recommendation}
                                            </h5>
                                            <span className="bg-white/50 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                                                {aiStrategyRes.confidence} Confidence
                                            </span>
                                        </div>
                                        <p className={`font-medium leading-relaxed opacity-90 ${aiStrategyRes.recommendation?.toUpperCase().includes("WAIT")
                                            ? "text-amber-900 dark:text-amber-300"
                                            : "text-emerald-900 dark:text-emerald-300"
                                            }`}>
                                            {aiStrategyRes.reasoning}
                                        </p>
                                        <button
                                            onClick={onResetStrategy}
                                            className="mt-3 text-xs font-bold underline opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            {t('reanalyze')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
