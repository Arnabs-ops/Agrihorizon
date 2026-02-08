import React from "react";
import { useLanguage } from "../../context/LanguageContext";
import { NotificationCenter } from "../layout/NotificationCenter";
import sellerBg from "../../assets/seller_bg.png";
import { UserProfile } from "../../types";

interface SellerHeaderProps {
    profile: UserProfile["profile"];
    setShowAddProduct: (show: boolean) => void;
    setShowMessaging: (show: boolean) => void;
    setActiveTab: (tab: string) => void;
}

export function SellerHeader({ profile, setShowAddProduct, setShowMessaging, setActiveTab }: SellerHeaderProps) {
    const { t } = useLanguage();

    if (!profile) return null;

    return (
        <div className="rounded-3xl p-6 md:p-8 modern-shadow relative min-h-[200px] md:min-h-[220px] flex items-center transition-all duration-500 overflow-visible">
            {/* Dynamic Background Image with Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
                <div
                    className="absolute inset-0 z-0 scale-105 animate-slow-zoom transition-all duration-700"
                    style={{
                        backgroundImage: `url(${sellerBg})`,
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
                        <span className="text-3xl md:text-4xl drop-shadow-md">🚜</span>
                    </div>
                    <div className="transition-all duration-300">
                        <p className="text-slate-300 font-black tracking-[0.2em] uppercase text-[10px] md:text-xs mb-1 md:mb-2 drop-shadow-md opacity-90">{t('sellerTerminal')}</p>
                        <h1 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-2xl mb-2 md:mb-4 tracking-tight">
                            <span className="text-white/90">{t('welcome')},</span><br />
                            <span className="text-primary-light bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent drop-shadow-none">{profile.fullName}!</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {profile.businessName && (
                                <span className="flex items-center text-[10px] md:text-xs font-bold text-white bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/20 shadow-lg group hover:bg-white/20 transition-all duration-300 cursor-default">
                                    <span className="mr-1.5 opacity-80 group-hover:scale-110 transition-transform">🏪</span> {profile.businessName}
                                </span>
                            )}
                            {profile.location && (
                                <span className="flex items-center text-[10px] md:text-xs font-bold text-white bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/20 shadow-lg group hover:bg-white/20 transition-all duration-300 cursor-default">
                                    <span className="mr-1.5 opacity-80 group-hover:scale-110 transition-transform">📍</span> {profile.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
                    <button
                        onClick={() => setShowAddProduct(true)}
                        data-tour-id="add-product-button"
                        className="flex-1 lg:flex-none justify-center bg-primary text-white px-5 md:px-7 py-3 md:py-3.5 rounded-2xl font-black hover:bg-primary/90 transition-all duration-300 flex items-center gap-2.5 shadow-xl shadow-primary/20 active:scale-95 group border border-white/10 overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="text-xl relative z-10 font-light">+</span>
                        <span className="relative z-10 text-sm md:text-base">{t('addProduct')}</span>
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
    );
}
