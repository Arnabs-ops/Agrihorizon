import { NotificationCenter } from "../layout/NotificationCenter";
import { useLanguage } from "../../context/LanguageContext";
import buyerBg from "../../assets/buyer_bg.png";

interface BuyerHeaderProps {
    profile: any;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    cartItemsCount: number;
    setShowCart: (show: boolean) => void;
    setShowMessaging: (show: boolean) => void;
    showMoreMenu: boolean;
    setShowMoreMenu: (show: boolean) => void;
}

export function BuyerHeader({
    profile,
    activeTab,
    setActiveTab,
    cartItemsCount,
    setShowCart,
    setShowMessaging,
    showMoreMenu,
    setShowMoreMenu
}: BuyerHeaderProps) {
    const { t } = useLanguage();

    const navItems = [
        { id: "overview", label: t('overview'), icon: "📊" },
        { id: "marketplace", label: t('marketplace'), icon: "🏪" },
        { id: "orders", label: t('myOrders'), icon: "📦" },
    ];

    const moreItems = [
        { id: "prices", label: t('marketIntelligence'), icon: "💰" },
        { id: "community", label: t('communityHub'), icon: "🌱" },
    ];

    return (
        <div className="space-y-8">
            {/* Premium Welcome Header */}
            <div className="rounded-3xl p-6 md:p-8 modern-shadow relative min-h-[200px] md:min-h-[220px] flex items-center transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
                    <div
                        className="absolute inset-0 scale-105 animate-slow-zoom transition-all duration-700"
                        style={{
                            backgroundImage: `url(${buyerBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'brightness(0.6)'
                        }}
                    >
                        <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse z-10"></div>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-50 w-full gap-8 md:gap-6">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl animate-float shrink-0 border border-white/20">
                            <span className="text-3xl md:text-4xl drop-shadow-md">🛒</span>
                        </div>
                        <div className="transition-all duration-300">
                            <p className="text-slate-300 font-black tracking-[0.2em] uppercase text-[10px] md:text-xs mb-1 md:mb-2 drop-shadow-md opacity-90">{t('buyerTerminal')}</p>
                            <h1 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-2xl mb-2 md:mb-4 tracking-tight">
                                <span className="text-white/90">{t('welcome')},</span><br />
                                <span className="text-primary-light bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent drop-shadow-none">{profile.fullName}!</span>
                            </h1>
                            {profile.location && (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="flex items-center text-[10px] md:text-xs font-bold text-white bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/20 shadow-lg group hover:bg-white/20 transition-all duration-300 cursor-default">
                                        <span className="mr-1.5 opacity-80 group-hover:scale-110 transition-transform">📍</span> {profile.location}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
                        <button
                            onClick={() => setShowCart(true)}
                            data-tour-id="cart-button"
                            className="flex-1 lg:flex-none justify-center relative bg-white/10 backdrop-blur-xl dark:bg-slate-900/50 text-white px-5 md:px-7 py-3 md:py-3.5 rounded-2xl hover:bg-white/20 transition-all duration-300 flex items-center gap-2.5 shadow-xl border border-white/20 active:scale-95 group overflow-hidden"
                        >
                            <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">🛒</span>
                            <span className="font-black text-sm md:text-base">{t('cart')}</span>
                            {cartItemsCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-lg border border-white/20">
                                    {cartItemsCount}
                                </span>
                            )}
                        </button>

                        <div className="relative group hover:scale-105 transition-transform duration-300">
                            <NotificationCenter onNavigate={(link) => setActiveTab(link)} />
                        </div>

                        <button
                            onClick={() => setShowMessaging(true)}
                            data-tour-id="messages-button"
                            className="flex-1 lg:flex-none justify-center group bg-slate-900/90 dark:bg-white/5 backdrop-blur-xl text-white px-5 md:px-7 py-3 md:py-3.5 rounded-2xl hover:bg-slate-800 dark:hover:bg-white/10 transition-all duration-300 flex items-center gap-3 shadow-xl border border-white/5 active:scale-95"
                        >
                            <span className="text-xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">💬</span>
                            <span className="font-black text-sm md:text-base">{t('messages')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modern Navigation Tabs */}
            <div className="glass-morphism rounded-3xl p-1.5 md:p-2 modern-shadow sticky top-24 z-40 backdrop-blur-xl transition-all duration-300">
                <nav className="flex items-center gap-0.5 md:gap-1 w-full">
                    {navItems.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            data-tour-id={tab.id === "marketplace" ? "marketplace-tab" : undefined}
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
                            className={`w-full flex items-center gap-2 md:gap-3 py-3 md:py-3.5 px-3 md:px-6 rounded-2xl font-black text-xs md:text-sm tab-transition justify-center transition-all duration-300 ease-out min-w-0 ${moreItems.some(item => item.id === activeTab) || showMoreMenu
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
                                    {moreItems.map((tab) => (
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
        </div>
    );
}
