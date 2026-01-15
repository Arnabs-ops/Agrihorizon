import { useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { useLanguage } from "./useLanguage.tsx";

interface MarketPricesProps {
  userRole: "seller" | "buyer";
}

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
  history: Array<{
    date: string;
    price: number;
    source: string;
  }>;
  vegetable: string;
  location: string;
  lastUpdated: string;
}

export function MarketPrices({ userRole }: MarketPricesProps) {
  const [vegetable, setVegetable] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [investment, setInvestment] = useState<number>(0);

  const { t, language } = useLanguage();
  const getComprehensivePriceData = useAction(api.vegPrices.getComprehensivePriceData);
  const getSalesStrategy = useAction(api.vegPrices.getSalesStrategy);

  const [analyzing, setAnalyzing] = useState(false);
  const [strategyData, setStrategyData] = useState<{
    recommendation: string;
    reasoning: string;
    confidence: string;
  } | null>(null);

  const handleGetStrategy = async () => {
    if (!priceData || !quantity || !investment || !priceData.currentPrice || !priceData.tomorrowPrediction) return;

    setAnalyzing(true);
    try {
      const result = await getSalesStrategy({
        vegetable: priceData.vegetable,
        location: priceData.location,
        currentPrice: priceData.currentPrice,
        tomorrowMin: priceData.tomorrowPrediction.min,
        tomorrowMax: priceData.tomorrowPrediction.max,
        investment,
        quantity,
        language: language,
      });
      setStrategyData(result);
      toast.success("AI Strategy analysis complete!");
    } catch (error) {
      toast.error("Strategy analysis failed");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Preload images for faster rendering
  useEffect(() => {
    const preloadImages = () => {
      const images = [
        "/src/assets/buyer_bg.png",
        "/src/assets/seller_bg.png",
        "/src/assets/payment-qr.jpg"
      ];
      images.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };
    preloadImages();
  }, []);

  // Lazy load images for the marketplace
  const [lazyLoadedImages, setLazyLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (src: string) => {
    if (!lazyLoadedImages.has(src)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setLazyLoadedImages(prev => new Set(prev).add(src));
      };
    }
  };

  const calculateProfit = (price: number) => {
    if (!quantity) return 0;
    return (price * quantity) - investment;
  };

  const calculateROI = (price: number) => {
    if (!investment || !quantity) return 0;
    const profit = calculateProfit(price);
    return Math.round((profit / investment) * 100);
  };

  const handleSearch = async () => {
    if (!vegetable.trim() || !location.trim()) {
      toast.error(t('searchProducts')); // Reusing or should I have a specific one? 
      // Actually searching for prices, I'll just use a generic error if missing
      return;
    }

    setLoading(true);
    try {
      const data = await getComprehensivePriceData({
        vegetable: vegetable.trim(),
        location: location.trim(),
        language: language,
      });

      setPriceData(data as PriceData);
      toast.success("Price data updated successfully!");
    } catch (error) {
      toast.error("Failed to fetch price data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `₹${price}/kg`;

  const getPredictionTrend = () => {
    if (!priceData?.currentPrice || !priceData?.tomorrowPrediction) return null;

    const currentPrice = priceData.currentPrice;
    const avgPrediction = (priceData.tomorrowPrediction.min + priceData.tomorrowPrediction.max) / 2;

    if (avgPrediction > currentPrice * 1.05) {
      return { trend: "up", message: t('priceRise'), color: "text-red-600" };
    } else if (avgPrediction < currentPrice * 0.95) {
      return { trend: "down", message: t('priceDrop'), color: "text-green-600" };
    } else {
      return { trend: "stable", message: t('priceStable'), color: "text-blue-600" };
    }
  };

  const trend = getPredictionTrend();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 modern-shadow">
        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <span className="text-3xl">💹</span>
          {userRole === "seller" ? t('marketIntelligence') : t('bestDeals')}
        </h3>

        {/* Search Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🍅</span>
            <input
              type="text"
              placeholder={t('enterVegetable')}
              value={vegetable}
              onChange={(e) => setVegetable(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📍</span>
            <input
              type="text"
              placeholder={t('enterLocation')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? t('searching') : t('getPrices')}
          </button>
        </div>

        {/* Price Data Display */}
        {priceData && (
          <div className="space-y-8 animate-fade-in">
            {/* Current Price & Prediction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <span className="text-6xl">💰</span>
                </div>
                <h4 className="text-sm font-black text-blue-800 mb-4 uppercase tracking-widest opacity-70">
                  {t('currentPrice')}
                </h4>
                <p className="text-5xl font-black text-blue-600 mb-2">
                  {priceData.currentPrice ? formatPrice(priceData.currentPrice) : "N/A"}
                </p>
                <p className="text-sm font-bold text-blue-600/60 flex items-center gap-2">
                  <span className="capitalize">{priceData.vegetable}</span> • {priceData.location}
                </p>
              </div>

              <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <span className="text-6xl">🔮</span>
                </div>
                <h4 className="text-sm font-black text-emerald-800 mb-4 uppercase tracking-widest opacity-70">
                  {t('tomorrowPrediction')}
                </h4>
                <p className="text-5xl font-black text-emerald-600 mb-2">
                  {priceData.tomorrowPrediction?.range || "N/A"}
                </p>
                {trend && (
                  <p className={`text-sm font-bold mt-1 px-3 py-1 bg-white/50 rounded-full inline-block ${trend.color}`}>
                    {trend.message}
                  </p>
                )}
              </div>
            </div>

            {/* Profit Calculator Section (Sellers only) */}
            {userRole === "seller" && (
              <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-primary/10 rounded-3xl p-8 modern-shadow">
                <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <span className="text-2xl">🧮</span>
                  {t('harvestAnalytics')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-500 uppercase tracking-widest">
                      {t('estimatedYield')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">⚖️</span>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        value={quantity || ""}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-black text-slate-500 uppercase tracking-widest">
                      {t('productionCost')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">💰</span>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={investment || ""}
                        onChange={(e) => setInvestment(Number(e.target.value))}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all"
                      />
                    </div>
                  </div>
                </div>

                {quantity > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profitToday')}</p>
                          <p className={`text-2xl font-black ${calculateProfit(priceData.currentPrice || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            ₹{calculateProfit(priceData.currentPrice || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-emerald-50 px-3 py-1 rounded-full">
                          <p className="text-[10px] font-black text-emerald-700">ROI: {calculateROI(priceData.currentPrice || 0)}%</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-1000"
                          style={{ width: `${Math.min(Math.max(calculateROI(priceData.currentPrice || 0), 0), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('profitTomorrow')}</p>
                          <p className={`text-2xl font-black ${calculateProfit(((priceData.tomorrowPrediction?.min ?? 0) + (priceData.tomorrowPrediction?.max ?? 0)) / 2) >= 0 ? 'text-primary' : 'text-red-600'}`}>
                            ₹{calculateProfit(((priceData.tomorrowPrediction?.min ?? 0) + (priceData.tomorrowPrediction?.max ?? 0)) / 2).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-primary/10 px-3 py-1 rounded-full">
                          <p className="text-[10px] font-black text-primary">ROI: {calculateROI(((priceData.tomorrowPrediction?.min ?? 0) + (priceData.tomorrowPrediction?.max ?? 0)) / 2)}%</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{ width: `${Math.min(Math.max(calculateROI(((priceData.tomorrowPrediction?.min ?? 0) + (priceData.tomorrowPrediction?.max ?? 0)) / 2), 0), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* AI Strategy Actions */}
                    <div className="lg:col-span-2 space-y-4">
                      {!strategyData ? (
                        <button
                          onClick={handleGetStrategy}
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
                        <div className={`p-6 rounded-2xl border-2 animate-scale-up ${strategyData.recommendation.toUpperCase().includes("WAIT")
                          ? "bg-amber-50 border-amber-200"
                          : "bg-emerald-50 border-emerald-200"
                          }`}>
                          <div className="flex items-start gap-4">
                            <div className="text-4xl bg-white p-2 rounded-xl shadow-sm">
                              {strategyData.recommendation.toUpperCase().includes("WAIT") ? "⏳" : "✅"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className={`font-black uppercase tracking-tight text-lg ${strategyData.recommendation.toUpperCase().includes("WAIT")
                                  ? "text-amber-800"
                                  : "text-emerald-800"
                                  }`}>
                                  {strategyData.recommendation}
                                </h5>
                                <span className="bg-white/50 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                                  {strategyData.confidence} Confidence
                                </span>
                              </div>
                              <p className={`font-medium leading-relaxed opacity-90 ${strategyData.recommendation.toUpperCase().includes("WAIT")
                                ? "text-amber-900"
                                : "text-emerald-900"
                                }`}>
                                {strategyData.reasoning}
                              </p>
                              <button
                                onClick={() => setStrategyData(null)}
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
            )}

            {/* Analysis */}
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

            {/* Price History Chart */}
            {priceData.history && priceData.history.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 modern-shadow">
                <h4 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  {t('priceHistory')}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  <div className="lg:col-span-1 space-y-4">
                    {priceData.history.map((entry, index) => (
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
                        {priceData.history.map((entry, index) => {
                          const maxPrice = Math.max(...priceData.history.map(h => h.price));
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
            )}

            {/* Last Updated */}
            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest bg-slate-50 py-3 rounded-full">
              {t('lastUpdated')}: {new Date(priceData.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!priceData && !loading && (
          <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="text-7xl mb-6 animate-subtle-bounce">📊</div>
            <p className="text-slate-400 text-lg font-black max-w-sm mx-auto leading-tight">
              {t('priceSearchPlaceholder')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
