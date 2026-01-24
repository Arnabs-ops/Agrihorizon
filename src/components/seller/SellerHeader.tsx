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
        <div className="rounded-2xl p-8 modern-shadow relative min-h-[220px] flex items-center">
            {/* Dynamic Background Image with Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
                <div
                    className="absolute inset-0 z-0 scale-105 animate-slow-zoom"
                    style={{
                        backgroundImage: `url(${sellerBg})`,
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
                        <span className="text-4xl">🚜</span>
                    </div>
                    <div>
                        <p className="text-slate-300 font-bold tracking-widest uppercase text-xs mb-2 drop-shadow-md">{t('sellerTerminal')}</p>
                        <h1 className="text-4xl font-black leading-tight drop-shadow-lg mb-3">
                            <span className="text-white">{t('welcome')},</span><br />
                            <span className="text-primary">{profile.fullName}!</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {profile.businessName && (
                                <span className="flex items-center text-sm font-semibold text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                    🏪 {profile.businessName}
                                </span>
                            )}
                            {profile.location && (
                                <span className="flex items-center text-sm font-semibold text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                    📍 {profile.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowAddProduct(true)}
                        data-tour-id="add-product-button"
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                    >
                        <span className="text-xl">+</span> {t('addProduct')}
                    </button>
                    <NotificationCenter onNavigate={(link) => setActiveTab(link)} />
                    <button
                        onClick={() => setShowMessaging(true)}
                        data-tour-id="messages-button"
                        className="group bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-slate-200 active:scale-95"
                    >
                        <span className="text-xl group-hover:rotate-12 transition-transform">💬</span>
                        <span className="font-bold">{t('messages')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
