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
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 ${isNewUser
                        ? "bg-gradient-to-br from-primary to-emerald-500 animate-pulse"
                        : "bg-slate-900 hover:bg-slate-800"
                    }`}
                title="Help & Tutorial"
            >
                <span className="text-2xl">{isOpen ? "✕" : "❓"}</span>
            </button>

            {/* Help Menu */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-scale-up">
                    <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <span>💡</span> Need Help?
                    </h3>

                    <div className="space-y-3">
                        {/* Restart Tutorial */}
                        <button
                            onClick={handleRestartTutorial}
                            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-3"
                        >
                            <span className="text-xl">🔄</span>
                            <span>Restart Tutorial</span>
                        </button>

                        {/* Quick Tips */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                                Quick Tips
                            </p>
                            <ul className="space-y-2 text-sm font-medium text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Use the tabs to navigate between features</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Check market prices before buying/selling</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>Message sellers/buyers directly</span>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Support (Future) */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1">
                                Need more help?
                            </p>
                            <p className="text-sm font-medium text-blue-600">
                                Contact support or check our video tutorials (coming soon)
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
