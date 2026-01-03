import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ProfileSetup } from "./ProfileSetup";
import { BuyerDashboard } from "./BuyerDashboard";
import { SellerDashboard } from "./SellerDashboard";
import { createContext, useContext, useState, ReactNode } from "react";
import { translations, Language } from "./translations";

// Language Context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};

export default function App() {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-primary/20">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md h-20 flex justify-between items-center border-b border-slate-200 px-8 modern-shadow">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-110 duration-300">
              <span className="text-white text-xl animate-float">🌾</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agro<span className="text-primary">Horizon</span></h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === 'hi' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
    </LanguageContext.Provider>
  );
}

function Content() {
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
            The Future of Agriculture
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-6 leading-tight">
            Connecting Farmers and <br /><span className="text-primary">Global Markets</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The ultimate marketplace for high-quality agricultural products.
            Empowering farmers with AI-driven market insights and direct buyer connections.
          </p>
          <div className="bg-white p-8 rounded-xl shadow-2xl border border-slate-100 max-w-md mx-auto transform hover:scale-[1.02] transition-transform duration-500 modern-shadow">
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
