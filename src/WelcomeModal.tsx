import { useState } from "react";
import { useTutorial } from "./TutorialProvider";
import { useLanguage } from "./useLanguage.tsx";

interface WelcomeModalProps {
    userRole: "buyer" | "seller";
    onComplete: () => void;
}

export function WelcomeModal({ userRole, onComplete }: WelcomeModalProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const { markWelcomeSeen } = useTutorial();
    const { t } = useLanguage();

    const buyerSlides = [
        {
            emoji: "🛒",
            title: t('welcome') + "!",
            description: t('buyerSlide1Desc'),
            color: "from-blue-500 to-indigo-600",
        },
        {
            emoji: "📊",
            title: t('buyerSlide2Title'),
            description: t('buyerSlide2Desc'),
            color: "from-emerald-500 to-green-600",
        },
        {
            emoji: "💬",
            title: t('buyerSlide3Title'),
            description: t('buyerSlide3Desc'),
            color: "from-purple-500 to-pink-600",
        },
        {
            emoji: "🎯",
            title: t('buyerSlide4Title'),
            description: t('buyerSlide4Desc'),
            color: "from-orange-500 to-red-600",
        },
    ];

    const sellerSlides = [
        {
            emoji: "🚜",
            title: t('welcome') + "!",
            description: t('sellerSlide1Desc'),
            color: "from-green-500 to-emerald-600",
        },
        {
            emoji: "💹",
            title: t('sellerSlide2Title'),
            description: t('sellerSlide2Desc'),
            color: "from-blue-500 to-cyan-600",
        },
        {
            emoji: "📦",
            title: t('sellerSlide3Title'),
            description: t('sellerSlide3Desc'),
            color: "from-purple-500 to-violet-600",
        },
        {
            emoji: "🎯",
            title: t('sellerSlide4Title'),
            description: t('sellerSlide4Desc'),
            color: "from-orange-500 to-amber-600",
        },
    ];

    const slides = userRole === "buyer" ? buyerSlides : sellerSlides;
    const isLastSlide = currentSlide === slides.length - 1;

    const handleNext = () => {
        if (isLastSlide) {
            markWelcomeSeen();
            onComplete();
        } else {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const handleSkip = () => {
        markWelcomeSeen();
        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
                {/* Header with Skip Button */}
                <div className="p-6 pb-0 flex justify-between items-center">
                    <div className="flex gap-1.5">
                        {slides.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? "w-8 bg-primary"
                                    : index < currentSlide
                                        ? "w-1.5 bg-primary/40"
                                        : "w-1.5 bg-slate-200"
                                    }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleSkip}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors px-3 py-1 rounded-lg hover:bg-slate-50"
                    >
                        {t('skip')}
                    </button>
                </div>

                {/* Slide Content */}
                <div className="p-10 text-center relative overflow-hidden" key={currentSlide}>
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].color} opacity-5 -z-10`} />

                    {/* Emoji */}
                    <div className="text-8xl mb-6 animate-float">
                        {slides[currentSlide].emoji}
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
                        {slides[currentSlide].title}
                    </h2>

                    {/* Description */}
                    <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                        {slides[currentSlide].description}
                    </p>
                </div>

                {/* Navigation */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleNext}
                        className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r ${slides[currentSlide].color} text-white hover:shadow-xl`}
                    >
                        {isLastSlide ? (
                            <>
                                <span>{t('startTour')}</span>
                                <span className="text-xl">🚀</span>
                            </>
                        ) : (
                            <>
                                <span>{t('next')}</span>
                                <span className="text-xl">→</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
