import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { useLanguage } from "./useLanguage";
import { VoiceInput } from "./components/common/VoiceInput";

export function ProfileSetup() {
  const { t } = useLanguage();
  const [role, setRole] = useState<"seller" | "buyer" | "">("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [cropTypes, setCropTypes] = useState<string[]>([]);
  const [preferredProducts, setPreferredProducts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProfile = useMutation(api.users.createUserProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !fullName) {
      toast.error(t('fillRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile({
        role: role as "seller" | "buyer",
        fullName,
        phoneNumber: phoneNumber || undefined,
        location: location || undefined,
        businessName: role === "seller" ? businessName || undefined : undefined,
        farmSize: role === "seller" ? farmSize || undefined : undefined,
        cropTypes: role === "seller" && cropTypes.length > 0 ? cropTypes : undefined,
        preferredProducts: role === "buyer" && preferredProducts.length > 0 ? preferredProducts : undefined,
      });
      toast.success(t('profileCreated'));
    } catch (error) {
      toast.error(t('profileFailed'));
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCropTypesChange = (value: string) => {
    const crops = value.split(",").map(crop => crop.trim()).filter(crop => crop);
    setCropTypes(crops);
  };

  const handlePreferredProductsChange = (value: string) => {
    const products = value.split(",").map(product => product.trim()).filter(product => product);
    setPreferredProducts(products);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-green-800 mb-2">{t('completeProfile')}</h2>
        <p className="text-green-600">{t('profileSubtext')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('iAmA')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`p-4 border-2 rounded-lg text-center transition-all ${role === "seller"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-green-300"
                }`}
            >
              <div className="text-2xl mb-2">🚜</div>
              <div className="font-semibold">{t('sellerFarmer')}</div>
              <div className="text-sm text-gray-600">{t('sellerDescription')}</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`p-4 border-2 rounded-lg text-center transition-all ${role === "buyer"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 hover:border-green-300"
                }`}
            >
              <div className="text-2xl mb-2">🛒</div>
              <div className="font-semibold">{t('buyerLabel')}</div>
              <div className="text-sm text-gray-600">{t('buyerDescription')}</div>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('fullNameLabel')} <span className="text-red-500">*</span>
            </label>
            <VoiceInput
              value={fullName}
              onChange={setFullName}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
              placeholder={t('fullNameLabel')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('phoneNumberLabel')}
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t('phoneNumberLabel')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('locationLabel')}
          </label>
          <VoiceInput
            value={location}
            onChange={setLocation}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
            placeholder={t('locationPlaceholder')}
          />
        </div>

        {/* Seller-specific fields */}
        {role === "seller" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('businessFarmName')}
                </label>
                <VoiceInput
                  value={businessName}
                  onChange={setBusinessName}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium"
                  placeholder={t('businessPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('farmSize')}
                </label>
                <select
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">{t('selectFarmSize')}</option>
                  <option value="small">{t('smallFarm')}</option>
                  <option value="medium">{t('mediumFarm')}</option>
                  <option value="large">{t('largeFarm')}</option>
                  <option value="commercial">{t('commercialFarm')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('cropTypes')}
              </label>
              <input
                type="text"
                onChange={(e) => handleCropTypesChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={t('cropTypesPlaceholder')}
              />
            </div>
          </>
        )}

        {/* Buyer-specific fields */}
        {role === "buyer" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('preferredProducts')}
            </label>
            <input
              type="text"
              onChange={(e) => handlePreferredProductsChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={t('preferredProductsPlaceholder')}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !role || !fullName}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('creatingProfile') : t('completeSetup')}
        </button>
      </form>
    </div>
  );
}
