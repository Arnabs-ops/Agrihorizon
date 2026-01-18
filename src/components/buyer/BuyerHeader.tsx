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
            <div className="rounded-2xl p-8 modern-shadow relative min-h-[220px] flex items-center">
                <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                    <div
                        className="absolute inset-0 scale-105 animate-slow-zoom"
                        style={{
                            backgroundImage: `url(${buyerBg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'brightness(0.7)'
                        }}
                    >
                        <div className="absolute inset-0 bg-slate-900/30 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]"></div>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse z-10"></div>
                <div className="flex items-center justify-between relative z-50 w-full">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner animate-float">
                            <span className="text-4xl">🛒</span>
                        </div>
                        <div>
                            <p className="text-slate-300 font-bold tracking-widest uppercase text-xs mb-2 drop-shadow-md">{t('buyerTerminal')}</p>
                            <h1 className="text-4xl font-black leading-tight drop-shadow-lg mb-3">
                                <span className="text-white">{t('welcome')},</span><br />
                                <span className="text-primary">{profile.fullName}!</span>
                            </h1>
                            {profile.location && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="flex items-center text-sm font-semibold text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                        📍 {profile.location}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowCart(true)}
                            data-tour-id="cart-button"
                            className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl active:scale-95 group border border-transparent dark:border-slate-800"
                        >
                            <span className="text-xl">🛒</span>
                            <span className="font-bold">{t('cart')}</span>
                            {cartItemsCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-pulse">
                                    {cartItemsCount}
                                </span>
                            )}
                        </button>
                        <NotificationCenter onNavigate={(link) => setActiveTab(link)} />
                        <button
                            onClick={() => setShowMessaging(true)}
                            data-tour-id="messages-button"
                            className="group bg-slate-900 dark:bg-primary text-white px-6 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-primary/90 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-slate-200 active:scale-95"
                        >
                            <span className="text-xl group-hover:rotate-12 transition-transform">💬</span>
                            <span className="font-bold">{t('messages')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modern Navigation Tabs */}
            <div className="glass-morphism rounded-3xl p-2 modern-shadow sticky top-24 z-40 backdrop-blur-xl">
                <nav className="flex items-center gap-1">
                    {navItems.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            data-tour-id={tab.id === "marketplace" ? "marketplace-tab" : undefined}
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
                            className={`w-full flex items-center gap-3 py-3.5 px-6 rounded-2xl font-black text-sm tab-transition justify-center transition-colors duration-200 ${moreItems.some(item => item.id === activeTab) || showMoreMenu
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
                                {moreItems.map((tab) => (
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
        </div>
    );
}
