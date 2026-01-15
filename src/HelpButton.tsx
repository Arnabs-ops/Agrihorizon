import { useState } from "react";
import { useTutorial } from "./TutorialProvider";
import { useLanguage } from "./useLanguage.tsx";

export function HelpButton() {
    const [isOpen, setIsOpen] = useState(false);
    const { resetTutorial, tutorialProgress } = useTutorial();
    const { t } = useLanguage();

    const isNewUser = !tutorialProgress?.hasCompletedTour;

    const handleRestartTutorial = () => {
        resetTutorial();
        setIsOpen(false);
        // Reload page to restart tutorial
        window.location.reload();
    };

    return (
        <>
            {/* Floating Help Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-2 right-2 z-[100] w-10 h-10 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 ${isNewUser
                    ? "bg-gradient-to-br from-primary to-emerald-500"
                    : "bg-slate-900 hover:bg-slate-800"
                    }`}
                title="Help & Tutorial"
            >
                <span className="text-xl">{isOpen ? "✕" : "❓"}</span>
            </button>

            {/* Help Menu */}
            {isOpen && (
                <div className="fixed bottom-14 right-2 z-[100] w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-scale-up">
                    <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <span>💡</span> {t('needHelp')}
                    </h3>

                    <div className="space-y-4">
                        {/* Restart Tutorial */}
                        <button
                            onClick={handleRestartTutorial}
                            className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group mb-4"
                        >
                            <div className="font-bold text-slate-900 group-hover:text-primary mb-1 flex items-center justify-between">
                                {t('restartTutorial')}
                                <span>🔄</span>
                            </div>
                        </button>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                {t('quickTips')}
                            </h4>
                            {[
                                { icon: "🧭", text: t('tip1') },
                                { icon: "💹", text: t('tip2') },
                                { icon: "✉️", text: t('tip3') },
                            ].map((tip, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <span className="text-lg">{tip.icon}</span>
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                        {tip.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                {t('moreHelp')}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                                {t('supportComingSoon')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
