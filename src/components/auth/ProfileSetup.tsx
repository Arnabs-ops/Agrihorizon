import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useLanguage } from "../../context/LanguageContext";
import { VoiceInput } from "../common/VoiceInput";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { BuyerFields } from "./BuyerFields";
import { SellerFields } from "./SellerFields";

export function ProfileSetup() {
  const { t } = useLanguage();
  const { handleError, handleSuccess } = useErrorHandler();
  const [role, setRole] = useState<"seller" | "buyer" | "admin" | "">("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [cropTypes, setCropTypes] = useState<string[]>([]);
  const [preferredProducts, setPreferredProducts] = useState<string[]>([]);
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [bankName, setBankName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProfile = useMutation(api.users.createUserProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !fullName) {
      handleError(new Error("Missing required fields"), "fillRequired");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile({
        role: role as "seller" | "buyer" | "admin",
        fullName,
        phoneNumber: phoneNumber || undefined,
        location: location || undefined,
        businessName: role === "seller" ? businessName || undefined : undefined,
        farmSize: role === "seller" ? farmSize || undefined : undefined,
        cropTypes: role === "seller" && cropTypes.length > 0 ? cropTypes : undefined,
        preferredProducts: role === "buyer" && preferredProducts.length > 0 ? preferredProducts : undefined,
        upiId: role === "seller" && upiId ? upiId : undefined,
        upiName: role === "seller" && upiName ? upiName : undefined,
        bankName: role === "seller" && bankName ? bankName : undefined,
      });
      handleSuccess(t('profileCreated') || "Profile created successfully!");
    } catch (error) {
      handleError(error, "profileFailed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800 animate-entry">
      <div className="text-center mb-10">
        <div className="inline-block p-4 bg-primary/10 rounded-3xl mb-4 animate-float">
          <span className="text-4xl">🌱</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{t('completeProfile')}</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{t('profileSubtext')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest">
            {t('iAmA')} <span className="text-primary">*</span>
          </label>
          <div className="grid grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`p-6 border-2 rounded-[2rem] text-center transition-all duration-300 group ${role === "seller"
                ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-slate-100 dark:border-slate-800 hover:border-primary/30 text-slate-500 dark:text-slate-500"
                }`}
            >
              <div className={`text-4xl mb-3 transition-transform duration-500 ${role === "seller" ? "scale-110" : "group-hover:scale-110"}`}>🚜</div>
              <div className="font-black text-lg mb-1">{t('sellerFarmer')}</div>
              <div className="text-xs font-bold opacity-70 leading-relaxed px-2">{t('sellerDescription')}</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`p-6 border-2 rounded-[2rem] text-center transition-all duration-300 group ${role === "buyer"
                ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-slate-100 dark:border-slate-800 hover:border-primary/30 text-slate-500 dark:text-slate-500"
                }`}
            >
              <div className={`text-4xl mb-3 transition-transform duration-500 ${role === "buyer" ? "scale-110" : "group-hover:scale-110"}`}>🛒</div>
              <div className="font-black text-lg mb-1">{t('buyerLabel')}</div>
              <div className="text-xs font-bold opacity-70 leading-relaxed px-2">{t('buyerDescription')}</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`p-6 border-2 rounded-[2rem] text-center transition-all duration-300 group ${role === "admin"
                ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10 scale-[1.02]"
                : "border-slate-100 dark:border-slate-800 hover:border-primary/30 text-slate-500 dark:text-slate-500"
                }`}
            >
              <div className={`text-4xl mb-3 transition-transform duration-500 ${role === "admin" ? "scale-110" : "group-hover:scale-110"}`}>👮</div>
              <div className="font-black text-lg mb-1">{t('adminLabel') || 'Administrator'}</div>
              <div className="text-xs font-bold opacity-70 leading-relaxed px-2">{t('adminDescription') || 'Review certificates and moderate platform.'}</div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                {t('fullNameLabel')} <span className="text-primary">*</span>
              </label>
              <VoiceInput
                value={fullName}
                onChange={setFullName}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent font-bold transition-all outline-none bg-slate-50/50 dark:bg-slate-800/50"
                placeholder={t('fullNameLabel')}
              />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                {t('phoneNumberLabel')}
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent font-bold transition-all outline-none bg-slate-50/50 dark:bg-slate-800/50"
                placeholder={t('phoneNumberLabel')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
              {t('locationLabel')}
            </label>
            <VoiceInput
              value={location}
              onChange={setLocation}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent font-bold transition-all outline-none bg-slate-50/50 dark:bg-slate-800/50"
              placeholder={t('locationPlaceholder')}
            />
          </div>
        </div>

        {/* Role-specific Fields */}
        {role === "seller" && (
          <SellerFields
            businessName={businessName}
            setBusinessName={setBusinessName}
            farmSize={farmSize}
            setFarmSize={setFarmSize}
            setCropTypes={setCropTypes}
            upiId={upiId}
            setUpiId={setUpiId}
            upiName={upiName}
            setUpiName={setUpiName}
            bankName={bankName}
            setBankName={setBankName}
          />
        )}

        {role === "buyer" && (
          <BuyerFields setPreferredProducts={setPreferredProducts} />
        )}

        <button
          type="submit"
          disabled={isSubmitting || !role || !fullName}
          className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-black text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] mt-4"
        >
          {isSubmitting ? t('creatingProfile') : t('completeSetup')}
        </button>
      </form>
    </div>
  );
}
