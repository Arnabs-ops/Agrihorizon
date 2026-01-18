import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./components/auth/SignInForm";
import { SignOutButton } from "./components/layout/SignOutButton";
import { Toaster } from "sonner";
import { ProfileSetup } from "./components/auth/ProfileSetup";
import { BuyerDashboard } from "./pages/BuyerDashboard";
import { SellerDashboard } from "./pages/SellerDashboard";
import { createContext, useContext, useState, ReactNode } from "react";
import { translations, Language } from "./translations/translations";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { TutorialProvider } from "./components/onboarding/TutorialProvider";
import { useTheme } from "./context/ThemeContext";
import logo from "./assets/logo.png";

export default function App() {
  return (
    <LanguageProvider>
      <TutorialProvider>
        <AppContent />
      </TutorialProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] selection:bg-primary/20 transition-colors duration-500">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md h-20 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 px-8 modern-shadow">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-primary/10 transition-transform group-hover:scale-110 duration-300 overflow-hidden border border-slate-100 dark:border-slate-700">
            <img src={logo} alt="AgriHorizon Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Agri<span className="text-primary">Horizon</span></h2>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xl hover:scale-105 transition-all active:scale-95"
            title={theme === 'light' ? t('switchToDarkMode') : t('switchToLightMode')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'hi' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              हिन्दी
            </button>
          </div>
          <Authenticated>
            <div className="animate-fade-in">
              <SignOutButton />
            </div>
          </Authenticated>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="w-full max-w-6xl mx-auto animate-slide-up">
          <Content />
        </div>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}

function Content() {
  const { t } = useLanguage();
  const userProfile = useQuery(api.users.getCurrentUserProfile);

  if (userProfile === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Unauthenticated>
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-primary uppercase bg-primary/10 rounded-full animate-fade-in">
            {t('futureOfAgriculture')}
          </div>
          <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
            {t('connectingFarmers')} <br /><span className="text-primary">{t('globalMarkets')}</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landingPageDesc1')}
            <br />
            {t('landingPageDesc2')}
          </p>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500 modern-shadow">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {userProfile && !userProfile.profile ? (
          <ProfileSetup />
        ) : userProfile?.profile?.role === "buyer" ? (
          <BuyerDashboard userProfile={userProfile as any} />
        ) : userProfile?.profile?.role === "seller" ? (
          <SellerDashboard userProfile={userProfile as any} />
        ) : (
          <div className="text-center">
            <p className="text-red-600">Error: Invalid user role</p>
          </div>
        )}
      </Authenticated>
    </div>
  );
}
