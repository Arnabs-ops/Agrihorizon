import { useState } from "react";
import { useTutorial } from "./TutorialProvider";
import { useLanguage } from "./useLanguage.tsx";

interface OnboardingChecklistProps {
    userRole: "buyer" | "seller";
}

interface ChecklistItem {
    id: string;
    label: string;
    icon: string;
}

export function OnboardingChecklist({ userRole }: OnboardingChecklistProps) {
    const { tutorialProgress, dismissChecklist } = useTutorial();
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(true);

    if (tutorialProgress?.dismissedChecklist) return null;

    const buyerTasks: ChecklistItem[] = [
        { id: "browse_products", label: t('browseProducts'), icon: "🏪" },
        { id: "add_to_cart", label: t('addItemToCart'), icon: "🛒" },
        { id: "place_order", label: t('placeFirstOrder'), icon: "📦" },
        { id: "check_prices", label: t('checkMarketPrices'), icon: "💹" },
        { id: "join_community", label: t('joinCommunityTask'), icon: "🌱" },
    ];

    const sellerTasks: ChecklistItem[] = [
        { id: "add_product", label: t('addFirstProduct'), icon: "📦" },
        { id: "check_prices", label: t('checkMarketPrices'), icon: "💹" },
        { id: "process_order", label: t('processFirstOrder'), icon: "✅" },
        { id: "view_analytics", label: t('viewAnalyticsTask'), icon: "📊" },
        { id: "join_community", label: t('joinCommunityTask'), icon: "🌱" },
    ];

    const tasks = userRole === "buyer" ? buyerTasks : sellerTasks;
    const completedSteps = tutorialProgress?.completedSteps || [];
    const completedCount = tasks.filter((task) =>
        completedSteps.includes(task.id)
    ).length;
    const progress = Math.round((completedCount / tasks.length) * 100);
    const isCompleted = completedCount === tasks.length;

    return (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border-2 border-slate-200 p-6 modern-shadow overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">
                            {isCompleted ? t('allDone') : t('gettingStarted')}
                        </h3>
                        <p className="text-xs font-bold text-slate-500">
                            {completedCount} {t('of')} {tasks.length} {t('completedTask')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                    >
                        {isExpanded ? "▼" : "▶"}
                    </button>
                    <button
                        onClick={dismissChecklist}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                        title="Dismiss checklist"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Checklist Items */}
            {isExpanded && (
                <div className="space-y-3">
                    {tasks.map((task) => {
                        const isCompleted = completedSteps.includes(task.id);
                        return (
                            <div
                                key={task.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isCompleted
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-white border-slate-200 hover:border-primary/30"
                                    }`}
                            >
                                <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition-all ${isCompleted
                                        ? "bg-emerald-500 text-white"
                                        : "bg-slate-100 text-slate-400"
                                        }`}
                                >
                                    {isCompleted ? "✓" : task.icon}
                                </div>
                                <span
                                    className={`flex-1 font-bold text-sm ${isCompleted
                                        ? "text-emerald-700 line-through"
                                        : "text-slate-700"
                                        }`}
                                >
                                    {task.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Celebration */}
            {isCompleted && (
                <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl mb-2">🎊</p>
                    <p className="font-black text-emerald-700 text-sm">
                        {t('celebrationMessage')}
                    </p>
                </div>
            )}
        </div>
    );
}
