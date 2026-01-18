import React from "react";
import { useLanguage } from "../../context/LanguageContext";

interface SellerNavigationProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    showMoreMenu: boolean;
    setShowMoreMenu: (show: boolean) => void;
}

export function SellerNavigation({ activeTab, setActiveTab, showMoreMenu, setShowMoreMenu }: SellerNavigationProps) {
    const { t } = useLanguage();

    const mainTabs = [
        { id: "overview", label: t('overview'), icon: "📊" },
        { id: "products", label: t('inventory'), icon: "🌾" },
        { id: "orders", label: t('myOrders'), icon: "📦" },
        { id: "portfolio", label: t('portfolio') || "Portfolio", icon: "🏛️" },
    ];

    const moreTabs = [
        { id: "analytics", label: t('analytics'), icon: "📈" },
        { id: "prices", label: t('marketIntelligence'), icon: "💹" },
        { id: "advisory", label: t('cropAdvisor'), icon: "🌾" },
        { id: "community", label: t('communityHub'), icon: "🌱" },
    ];

    return (
        <div className="glass-morphism rounded-3xl p-2 modern-shadow sticky top-24 z-40 backdrop-blur-xl">
            <nav className="flex items-center gap-1">
                {mainTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setShowMoreMenu(false);
                        }}
                        data-tour-id={tab.id === "orders" ? "orders-tab" : undefined}
                        className={`flex items-center gap-3 py-3.5 px-6 rounded-2xl font-black text-sm tab-transition flex-1 justify-center transition-colors duration-200 ${activeTab === tab.id
                            ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02]"
                            : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        <span className={`text-xl ${activeTab === tab.id ? "animate-float" : ""}`}>{tab.icon}</span>
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}

                {/* More Features Dropdown */}
                <div className="relative group/more flex-1">
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        data-tour-id="more-tab"
                        className={`w-full flex items-center gap-3 py-3.5 px-6 rounded-2xl font-black text-sm tab-transition justify-center transition-colors duration-200 ${moreTabs.some(tab => tab.id === activeTab) || showMoreMenu
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                            : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        <span className="text-xl">✨</span>
                        <span className="hidden md:inline">More</span>
                        <span className={`text-[10px] opacity-50 ml-1 transition-transform ${showMoreMenu ? "rotate-180" : ""}`}>▼</span>
                    </button>

                    {showMoreMenu && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-scale-up z-50">
                            {moreTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setShowMoreMenu(false);
                                    }}
                                    data-tour-id={`${tab.id}-tab`}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                                        ? "bg-primary/10 dark:bg-primary/20 text-primary"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                        }`}
                                >
                                    <span className="text-xl">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
}
