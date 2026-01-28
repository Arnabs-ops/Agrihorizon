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
        <div className="glass-morphism rounded-3xl p-1.5 md:p-2 modern-shadow sticky top-24 z-40 backdrop-blur-xl transition-all duration-300">
            <nav className="flex items-center gap-0.5 md:gap-1 w-full">
                {mainTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setShowMoreMenu(false);
                        }}
                        data-tour-id={tab.id === "orders" ? "orders-tab" : undefined}
                        className={`flex items-center gap-2 md:gap-3 py-3 md:py-3.5 px-3 md:px-6 rounded-2xl font-black text-xs md:text-sm tab-transition flex-1 justify-center transition-all duration-300 ease-out shrink-0 min-w-0 ${activeTab === tab.id
                            ? "bg-primary text-white shadow-xl shadow-primary/25 scale-[1.02] active:scale-95"
                            : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        <span className={`text-lg md:text-xl transition-transform duration-300 ${activeTab === tab.id ? "animate-float scale-110" : "group-hover:scale-110"}`}>{tab.icon}</span>
                        <span className="hidden sm:inline truncate text-[10px] md:text-xs lg:text-sm">{tab.label}</span>
                    </button>
                ))}

                {/* More Features Dropdown */}
                <div className="relative group/more flex-1 min-w-0">
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        data-tour-id="more-tab"
                        className={`w-full flex items-center gap-2 md:gap-3 py-3 md:py-3.5 px-3 md:px-6 rounded-2xl font-black text-xs md:text-sm tab-transition justify-center transition-all duration-300 ease-out min-w-0 ${moreTabs.some(tab => tab.id === activeTab) || showMoreMenu
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                            : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        <span className="text-lg md:text-xl transition-transform duration-300 group-hover/more:scale-110">✨</span>
                        <span className="hidden sm:inline text-[10px] md:text-xs lg:text-sm">More</span>
                        <span className={`text-[8px] md:text-[10px] opacity-50 ml-0.5 md:ml-1 transition-transform duration-300 ${showMoreMenu ? "rotate-180" : ""}`}>▼</span>
                    </button>

                    {showMoreMenu && (
                        <div className="absolute top-full right-0 mt-3 w-64 md:w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 p-3 animate-scale-up z-50 origin-top-right">
                            <div className="grid gap-1">
                                {moreTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setShowMoreMenu(false);
                                        }}
                                        data-tour-id={`${tab.id}-tab`}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all duration-200 group/item ${activeTab === tab.id
                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:translate-x-1"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all duration-200 ${activeTab === tab.id ? "bg-white/20" : "bg-slate-100 dark:bg-white/5 group-hover/item:scale-110"}`}>
                                            {tab.icon}
                                        </div>
                                        <span className="flex-1 text-left">{tab.label}</span>
                                        {activeTab === tab.id && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
}
