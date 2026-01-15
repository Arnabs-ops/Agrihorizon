import { useState, useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useLanguage } from "../../useLanguage";
import { VoiceInput } from "../common/VoiceInput";
import { toast } from "sonner";

interface CropAdvisorProps {
    location: string;
    crops: string[];
}

export function CropAdvisor({ location, crops }: CropAdvisorProps) {
    const { t, language } = useLanguage();
    const getAdvice = useAction(api.advisor.getCropAdvice);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [advisoryData, setAdvisoryData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const [newLocation, setNewLocation] = useState("");
    const [updating, setUpdating] = useState(false);
    const updateProfile = useMutation(api.users.updateUserProfile);

    const fetchAdvice = async (customQuery?: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAdvice({
                location,
                crops,
                query: customQuery || query || undefined,
                language
            });
            setAdvisoryData(result);
            if (customQuery) setQuery("");
        } catch (err: any) {
            const msg = err.message || "";
            if (msg.includes("Location not found")) {
                setError("Location not found. Please update your profile with a valid city name.");
            } else {
                toast.error("Failed to get AI advice. Please try again.");
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLocation = async () => {
        if (!newLocation.trim()) return;
        setUpdating(true);
        try {
            await updateProfile({ location: newLocation });
            setShowLocationPopup(false);
            setError(null);
            toast.success("Location updated! Fetching advice...");
            // The location prop comes from SellerDashboard which uses the profile query.
            // React state will update when the profile is re-fetched.
            // But since we want immediate feedback, we'll trigger fetchAdvice if we had the new location.
        } catch (err) {
            toast.error("Failed to update location");
        } finally {
            setUpdating(false);
        }
    };

    // Initial fetch on mount
    useEffect(() => {
        const isPlaceholder = location.includes("Enter location") || location.includes("स्थान दर्ज करें");
        if (location && crops.length > 0 && !isPlaceholder) {
            fetchAdvice();
        } else if (isPlaceholder) {
            setError("Location not found. Please update your profile with a valid city name.");
        }
    }, [location]);

    const getWeatherIcon = (code: number) => {
        if (code <= 1) return "☀️";
        if (code <= 3) return "⛅";
        if (code <= 48) return "🌫️";
        if (code <= 67) return "🌧️";
        if (code <= 77) return "❄️";
        if (code <= 82) return "🌦️";
        return "⛈️";
    };

    return (
        <div className="space-y-8 animate-entry">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Weather Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-500">
                            {advisoryData ? getWeatherIcon(advisoryData.currentWeather.code) : "☁️"}
                        </div>

                        <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-6">{t('weatherInfo')}</h3>

                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-6xl">{advisoryData ? getWeatherIcon(advisoryData.currentWeather.code) : "☁️"}</span>
                            <div>
                                <p className="text-4xl font-black">{advisoryData ? Math.round(advisoryData.currentWeather.temp) : "--"}°C</p>
                                <p className="font-bold opacity-80">{advisoryData?.city || location}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-[10px] uppercase font-black opacity-60 mb-1">{t('humidity')}</p>
                                <p className="font-bold">{advisoryData?.currentWeather.humidity || "--"}%</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-[10px] uppercase font-black opacity-60 mb-1">{t('windSpeed')}</p>
                                <p className="font-bold">{advisoryData?.currentWeather.wind || "--"} km/h</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                            My Crops
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {crops.map((crop, i) => (
                                <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
                                    {crop}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* AI Advisory Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 relative overflow-hidden min-h-[400px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <span className="text-3xl">🤖</span>
                                {t('cropAdvisor')}
                            </h3>
                            {loading && <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>}
                        </div>

                        {advisoryData ? (
                            <div className="prose prose-slate max-w-none">
                                <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                    {advisoryData.advice}
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-6 text-center px-4 animate-fade-in">
                                <div className="text-7xl text-amber-500 drop-shadow-lg scale-110">📍</div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="font-black text-slate-900 text-2xl max-w-md leading-tight">{error}</p>
                                        <p className="font-bold text-slate-400 max-w-sm mx-auto">We need your city name to fetch local weather and give crop advice.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowLocationPopup(true)}
                                        className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95"
                                    >
                                        Update Location
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                                <div className="text-6xl animate-bounce">⚡</div>
                                <p className="font-bold">Analyzing weather and crops...</p>
                            </div>
                        )}

                        {/* Location Update Modal */}
                        {showLocationPopup && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
                                <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-scale-up">
                                    <h4 className="text-2xl font-black text-slate-900 mb-2">Update Location</h4>
                                    <p className="text-slate-500 font-bold mb-6">Enter your city name (e.g., Delhi, Mumbai)</p>

                                    <input
                                        type="text"
                                        placeholder="Enter your city..."
                                        value={newLocation}
                                        onChange={(e) => setNewLocation(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold mb-6 transition-all"
                                        autoFocus
                                    />

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowLocationPopup(false)}
                                            className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            onClick={handleUpdateLocation}
                                            disabled={updating || !newLocation.trim()}
                                            className="flex-[2] bg-primary text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {updating ? "Updating..." : "Save Location"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Voice Q&A Area */}
                        <div className="mt-8 pt-8 border-t border-slate-100">
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">{t('askAdvisor')}</h4>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <VoiceInput
                                        value={query}
                                        onChange={setQuery}
                                        placeholder={t('askPlaceholder')}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all shadow-inner"
                                    />
                                </div>
                                <button
                                    onClick={() => fetchAdvice()}
                                    disabled={loading}
                                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg"
                                >
                                    {t('getAdvice')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
