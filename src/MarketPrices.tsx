import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

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

  const getComprehensivePriceData = useAction(api.vegPrices.getComprehensivePriceData);

  const handleSearch = async () => {
    if (!vegetable.trim() || !location.trim()) {
      toast.error("Please enter both vegetable and location");
      return;
    }

    setLoading(true);
    try {
      const data = await getComprehensivePriceData({
        vegetable: vegetable.trim(),
        location: location.trim(),
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
      return { trend: "up", message: "Prices expected to rise", color: "text-red-600" };
    } else if (avgPrediction < currentPrice * 0.95) {
      return { trend: "down", message: "Prices expected to drop", color: "text-green-600" };
    } else {
      return { trend: "stable", message: "Prices expected to remain stable", color: "text-blue-600" };
    }
  };

  const trend = getPredictionTrend();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {userRole === "seller" ? "Market Prices" : "Best Deals"}
        </h3>
        
        {/* Search Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Enter vegetable (e.g., tomato)"
            value={vegetable}
            onChange={(e) => setVegetable(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Enter location (e.g., Bhubaneswar)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Get Prices"}
          </button>
        </div>

        {/* Price Data Display */}
        {priceData && (
          <div className="space-y-6">
            {/* Current Price & Prediction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">
                  Current Price
                </h4>
                <p className="text-3xl font-bold text-blue-600">
                  {priceData.currentPrice ? formatPrice(priceData.currentPrice) : "N/A"}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {priceData.vegetable} in {priceData.location}
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-800 mb-2">
                  Tomorrow's Prediction
                </h4>
                <p className="text-3xl font-bold text-green-600">
                  {priceData.tomorrowPrediction?.range || "N/A"}
                </p>
                {trend && (
                  <p className={`text-sm mt-1 ${trend.color}`}>
                    {trend.message}
                  </p>
                )}
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Market Analysis</h4>
              <p className="text-gray-700 mb-2">{priceData.analysis}</p>
              <p className="text-sm text-gray-500">
                Confidence: {priceData.confidence} | 
                Sources: {priceData.sources.join(", ")}
              </p>
            </div>

            {/* Buyer-specific recommendations */}
            {userRole === "buyer" && trend && (
              <div className={`p-4 rounded-lg ${
                trend.trend === "down" ? "bg-green-100 border-green-300" :
                trend.trend === "up" ? "bg-red-100 border-red-300" :
                "bg-blue-100 border-blue-300"
              } border`}>
                <h4 className="font-semibold mb-2">
                  {trend.trend === "down" ? "💡 Money-Saving Tip" :
                   trend.trend === "up" ? "⚠️ Price Alert" :
                   "ℹ️ Market Update"}
                </h4>
                <p>
                  {trend.trend === "down" 
                    ? "Wait until tomorrow for cheaper rates! Prices are expected to drop."
                    : trend.trend === "up"
                    ? "Consider buying today as prices may increase tomorrow."
                    : "Prices are stable. You can buy today or tomorrow at similar rates."
                  }
                </p>
              </div>
            )}

            {/* Price History Chart */}
            {priceData.history && priceData.history.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Price Trend (Last 7 Days)
                </h4>
                <div className="space-y-2">
                  {priceData.history.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">{entry.date}</span>
                      <span className="font-semibold">{formatPrice(entry.price)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Simple Visual Chart */}
                <div className="mt-4">
                  <div className="flex items-end justify-between h-32 bg-gray-50 rounded p-4">
                    {priceData.history.map((entry, index) => {
                      const maxPrice = Math.max(...priceData.history.map(h => h.price));
                      const height = (entry.price / maxPrice) * 100;
                      return (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="bg-green-500 rounded-t w-8"
                            style={{ height: `${height}%` }}
                            title={`${entry.date}: ${formatPrice(entry.price)}`}
                          ></div>
                          <span className="text-xs text-gray-500 mt-1">
                            {entry.date.split('-')[2]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Last Updated */}
            <p className="text-xs text-gray-500 text-center">
              Last updated: {new Date(priceData.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!priceData && !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500 text-lg">
              Enter a vegetable and location to get current prices and predictions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
