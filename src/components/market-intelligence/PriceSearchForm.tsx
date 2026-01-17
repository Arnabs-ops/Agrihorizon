import { useLanguage } from "../../useLanguage";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

interface PriceSearchFormProps {
    vegetable: string;
    setVegetable: (v: string) => void;
    location: string;
    setLocation: (v: string) => void;
    loading: boolean;
    onSearch: () => void;
    onParseVoice: (transcript: string) => Promise<void>;
}

export function PriceSearchForm({
    vegetable,
    setVegetable,
    location,
    setLocation,
    loading,
    onSearch,
    onParseVoice
}: PriceSearchFormProps) {
    const { t } = useLanguage();

    const { isListening, startListening } = useSpeechRecognition({
        onResult: (transcript) => {
            onParseVoice(transcript);
        }
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform group-focus-within:scale-110 z-10">🍅</span>
                <input
                    type="text"
                    placeholder={t('enterVegetable')}
                    value={vegetable}
                    onChange={(e) => setVegetable(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all dark:text-white"
                />
                <button
                    onClick={startListening}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all active:scale-90 shadow-sm border border-slate-200 flex items-center justify-center z-20 ${isListening
                        ? 'bg-red-500 text-white animate-pulse border-red-400'
                        : 'bg-white text-slate-600 hover:text-primary hover:border-primary hover:shadow-md'
                        }`}
                    title="Voice Search"
                >
                    🎤
                </button>
            </div>
            <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform group-focus-within:scale-110 z-10">📍</span>
                <input
                    type="text"
                    placeholder={t('enterLocation')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all dark:text-white"
                />
            </div>
            <button
                onClick={onSearch}
                disabled={loading}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? t('searching') : t('getPrices')}
            </button>
        </div>
    );
}
