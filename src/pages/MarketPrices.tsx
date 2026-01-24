import { useState, useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "../context/LanguageContext";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useImagePreloader } from "../hooks/useImagePreloader";
import buyerBg from "../assets/buyer_bg.png";
import sellerBg from "../assets/seller_bg.png";
import paymentQr from "../assets/payment-qr.jpg";

// Modular Components
import { PriceSearchForm } from "../components/market-intelligence/PriceSearchForm";
import { PriceDisplaySection } from "../components/market-intelligence/PriceDisplaySection";
import { HarvestAnalytics } from "../components/market-intelligence/HarvestAnalytics";
import { PriceChart } from "../components/market-intelligence/PriceChart";

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
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStrategyRes, setAiStrategyRes] = useState<{
    recommendation: string;
    reasoning: string;
    confidence: string;
  } | null>(null);

  const { t, language } = useLanguage();
  const { handleError, handleSuccess } = useErrorHandler();

  // Custom Hooks
  useImagePreloader([buyerBg, sellerBg, paymentQr]);

  const getComprehensivePriceData = useAction((api as any).vegActions.getComprehensivePriceData);
  const getSalesStrategy = useAction((api as any).vegActions.getSalesStrategy);
  const parseVoiceQuery = useAction((api as any).vegActions.parseVoiceQuery);

  const handleSearch = useCallback(async (v?: string, l?: string) => {
    const searchVeg = v || vegetable;
    const searchLoc = l || location;

    if (!searchVeg.trim() || !searchLoc.trim()) {
      handleError(new Error("Missing search terms"), "searchProducts");
      return;
    }

    setLoading(true);
    try {
      const data = await getComprehensivePriceData({
        vegetable: searchVeg.trim(),
        location: searchLoc.trim(),
        language: language,
      });

      setPriceData(data as PriceData);
      handleSuccess("Price data updated successfully!", "fetchPriceSuccess");
    } catch (error) {
      handleError(error, "fetchPriceFailed");
    } finally {
      setLoading(false);
    }
  }, [vegetable, location, language, getComprehensivePriceData, handleError, handleSuccess]);

  const handleVoiceParse = async (transcript: string) => {
    try {
      const parsed = await parseVoiceQuery({ query: transcript, language });
      if (parsed.vegetable && parsed.location) {
        setVegetable(parsed.vegetable);
        setLocation(parsed.location);
        // Direct call instead of DOM click trigger
        handleSearch(parsed.vegetable, parsed.location);
      } else {
        handleError(new Error("Could not parse voice"), "voiceSearchError");
      }
    } catch (e) {
      handleError(e, "voiceSearchError");
    }
  };

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
      setAiStrategyRes(result);
      handleSuccess("AI Strategy analysis complete!", "aiStrategyComplete");
    } catch (error) {
      handleError(error, "strategyFailed");
    } finally {
      setAnalyzing(false);
    }
  };

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
      <div className="bg-white dark:bg-slate-900/40 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 modern-shadow transition-colors duration-500">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
          <span className="text-3xl">💹</span>
          {userRole === "seller" ? t('marketIntelligence') : t('bestDeals')}
        </h3>

        <PriceSearchForm
          vegetable={vegetable}
          setVegetable={setVegetable}
          location={location}
          setLocation={setLocation}
          loading={loading}
          onSearch={() => handleSearch()}
          onParseVoice={handleVoiceParse}
        />

        {priceData ? (
          <div className="space-y-8">
            <PriceDisplaySection
              priceData={priceData}
              trend={trend}
              userRole={userRole}
            />

            {userRole === "seller" && (
              <HarvestAnalytics
                priceData={priceData}
                quantity={quantity}
                setQuantity={setQuantity}
                investment={investment}
                setInvestment={setInvestment}
                aiStrategyRes={aiStrategyRes}
                onGetStrategy={handleGetStrategy}
                onResetStrategy={() => setAiStrategyRes(null)}
                analyzing={analyzing}
              />
            )}

            {priceData.history && priceData.history.length > 0 && (
              <PriceChart history={priceData.history} />
            )}

            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest bg-slate-50 py-3 rounded-full">
              {t('lastUpdated')}: {new Date(priceData.lastUpdated).toLocaleString()}
            </p>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="text-7xl mb-6 animate-subtle-bounce">📊</div>
              <p className="text-slate-400 text-lg font-black max-w-sm mx-auto leading-tight">
                {t('priceSearchPlaceholder')}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
