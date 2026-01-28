import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { Language } from "../../translations/translations";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface SettingsPanelProps {
    onClose: () => void;
    userRole?: string;
}

export function SettingsPanel({ onClose, userRole }: SettingsPanelProps) {
    const { language, setLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const { handleError, handleSuccess } = useErrorHandler();

    // Payment settings state
    const currentProfile = useQuery(api.users.getCurrentUserProfile);
    const updatePayment = useMutation(api.payments.updatePaymentDetails);

    const [upiId, setUpiId] = useState("");
    const [upiName, setUpiName] = useState("");
    const [bankName, setBankName] = useState("");
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const isSeller = userRole === "seller";

    // Load existing payment details when profile loads
    useEffect(() => {
        if (currentProfile?.profile) {
            setUpiId(currentProfile.profile.upiId || "");
            setUpiName(currentProfile.profile.upiName || "");
            setBankName(currentProfile.profile.bankName || "");
        }
    }, [currentProfile]);

    // Auto-hide success message
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const validateUpiId = (id: string): boolean => {
        const upiRegex = /^[\w.-]+@[\w.-]+$/;

        if (!id.trim()) {
            setValidationError(t('upiIdRequired') || "UPI ID is required");
            return false;
        }

        if (!upiRegex.test(id)) {
            setValidationError(t('invalidUpiFormat') || "Invalid UPI ID format. Should be like: username@bank");
            return false;
        }

        const parts = id.split("@");
        if (parts[0].length < 3) {
            setValidationError(t('upiUsernameTooShort') || "Username part is too short");
            return false;
        }

        if (parts[1].length < 3) {
            setValidationError(t('upiBankTooShort') || "Bank identifier is too short");
            return false;
        }

        setValidationError(null);
        return true;
    };

    const handleSavePayment = async () => {
        if (!validateUpiId(upiId)) {
            return;
        }

        if (!upiName.trim()) {
            setValidationError(t('upiNameRequired') || "Account name is required");
            return;
        }

        setSaving(true);
        try {
            await updatePayment({
                upiId: upiId.trim(),
                upiName: upiName.trim(),
                bankName: bankName.trim() || undefined,
            });
            setShowSuccess(true);
            handleSuccess(t('paymentDetailsUpdated') || "Payment details updated successfully!");
        } catch (error: any) {
            handleError(error, t('paymentUpdateFailed') || "Failed to update payment details");
        } finally {
            setSaving(false);
        }
    };

    const hasExistingDetails = !!(currentProfile?.profile?.upiId && currentProfile?.profile?.upiName);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto modern-shadow animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 rounded-t-3xl backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="text-3xl">⚙️</span>
                            {t('settings') || 'Settings'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Success Overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in rounded-3xl">
                        <div className="bg-slate-900/90 text-white px-8 py-5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4 animate-scale-up">
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-xl shrink-0">
                                ✓
                            </div>
                            <h4 className="text-lg font-bold tracking-tight">
                                {t('paymentDetailsUpdated') || "Payment Details Updated"}
                            </h4>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Language Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">🌐</span>
                            {t('language') || 'Language'}
                        </h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex-1 py-4 px-6 rounded-xl font-bold text-sm transition-all border-2 ${language === 'en'
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'
                                    }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('hi')}
                                className={`flex-1 py-4 px-6 rounded-xl font-bold text-sm transition-all border-2 ${language === 'hi'
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary'
                                    }`}
                            >
                                हिन्दी
                            </button>
                        </div>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="text-2xl">{theme === 'light' ? '🌙' : '☀️'}</span>
                            {t('appearance') || 'Appearance'}
                        </h3>
                        <button
                            onClick={toggleTheme}
                            className="w-full py-4 px-6 rounded-xl font-bold text-sm transition-all border-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary flex items-center justify-between"
                        >
                            <span>{theme === 'light' ? t('switchToDarkMode') || 'Switch to Dark Mode' : t('switchToLightMode') || 'Switch to Light Mode'}</span>
                            <span className="text-2xl">{theme === 'light' ? '🌙' : '☀️'}</span>
                        </button>
                    </div>

                    {/* Payment Settings - Only for Sellers */}
                    {isSeller && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="text-2xl">💳</span>
                                {t('paymentSettings') || 'Payment Settings'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {t('paymentSettingsDesc') || 'Configure your UPI details to receive payments from buyers'}
                            </p>

                            {hasExistingDetails && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">✓</span>
                                        <div>
                                            <h4 className="font-black text-emerald-900 dark:text-emerald-200 mb-1">
                                                {t('paymentConfigured') || 'Payment Details Configured'}
                                            </h4>
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                                {t('buyersCanPay') || 'Buyers can now pay you directly using UPI QR codes'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                                        {t('upiId') || 'UPI ID'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => {
                                            setUpiId(e.target.value);
                                            setValidationError(null);
                                        }}
                                        onBlur={() => upiId && validateUpiId(upiId)}
                                        placeholder="farmer@paytm"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-mono dark:text-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 font-medium">
                                        {t('upiIdExample') || 'Example: yourname@paytm, mobile@oksbi, user@ybl'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                                        {t('accountName') || 'Account Name'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={upiName}
                                        onChange={(e) => {
                                            setUpiName(e.target.value);
                                            setValidationError(null);
                                        }}
                                        placeholder={t('enterAccountName') || 'Enter name as per UPI account'}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold dark:text-white"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 font-medium">
                                        {t('accountNameNote') || 'This name will be shown to buyers during payment'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
                                        {t('bankName') || 'Bank Name'} <span className="text-slate-400 text-xs">({t('optional') || 'Optional'})</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        placeholder="Paytm Payments Bank"
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold dark:text-white"
                                    />
                                </div>

                                {validationError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500 font-black">⚠</span>
                                            <p className="text-sm text-red-700 dark:text-red-300 font-bold">
                                                {validationError}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">ℹ️</span>
                                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium space-y-1">
                                            <p className="font-bold">{t('securityNote') || 'Security & Privacy'}:</p>
                                            <ul className="list-disc list-inside space-y-0.5 ml-1">
                                                <li>{t('upiSecureNote') || 'Your UPI ID is securely stored and encrypted'}</li>
                                                <li>{t('onlyBuyersNote') || 'Only visible to buyers during checkout'}</li>
                                                <li>{t('canUpdateNote') || 'You can update these details anytime'}</li>
                                                <li>{t('noBankAccessNote') || 'We never access your bank account or payment history'}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePayment}
                                    disabled={saving || !upiId.trim() || !upiName.trim()}
                                    className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>{t('saving') || 'Saving...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>💾</span>
                                            <span>{t('savePaymentDetails') || 'Save Payment Details'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
