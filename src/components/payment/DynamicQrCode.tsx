import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface DynamicQrCodeProps {
    orderId: Id<"orders">;
    amount: number;
    onPaymentConfirm: (nonce?: string, signature?: string) => void;
    onClose: () => void;
}

export function DynamicQrCode({ orderId, amount, onPaymentConfirm, onClose }: DynamicQrCodeProps) {
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<{
        qrCodeDataUrl: string;
        upiString: string;
        sellerName: string;
        sellerUpiId: string;
        amount: number;
        hasPaymentDetails: boolean;
        nonce?: string;
        paymentSignature?: string;
        expiry?: number;
    } | null>(null);

    const { t } = useLanguage();
    const { handleError } = useErrorHandler();
    const initiate = useMutation(api.payments.initiatePayment);
    const generateQr = useAction(api.payments.generateUpiQrCode);

    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        async function loadQrCode() {
            try {
                setLoading(true);
                // Phase 1: Initiate and lock
                await initiate({ orderId });
                // Phase 2: Generate signed QR
                const data = await generateQr({ orderId });
                setQrData(data);

                if (data.expiry) {
                    const remaining = Math.max(0, Math.floor((data.expiry - Date.now()) / 1000));
                    setTimeLeft(remaining);
                }
            } catch (error) {
                handleError(error, "qrGenerationFailed");
            } finally {
                setLoading(false);
            }
        }
        loadQrCode();
    }, [orderId, generateQr, initiate, handleError]);

    // Timer effect
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-slate-400 font-bold">{t('generatingQrCode') || 'Generating QR Code...'}</p>
            </div>
        );
    }

    // Fallback to static QR if seller hasn't configured UPI
    if (!qrData?.hasPaymentDetails) {
        return (
            <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h4 className="font-black text-yellow-900 dark:text-yellow-200 mb-2">
                                {t('sellerPaymentNotConfigured') || 'Seller Payment Not Configured'}
                            </h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                                {t('contactSellerForPayment') || 'Please contact the seller for payment details or use the fallback QR code below.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 font-bold mb-4 uppercase tracking-widest text-xs text-center">
                        {t('fallbackPaymentQr') || 'Fallback Payment QR'}
                    </p>
                    <img
                        src="/src/assets/payment-qr.jpg"
                        alt="Payment QR"
                        className="mx-auto rounded-xl w-48 h-48 border-4 border-white shadow-lg dark:border-slate-800"
                    />
                    <p className="mt-6 text-2xl font-black text-slate-900 dark:text-white text-center">
                        ₹{amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 text-center mt-2 font-medium">
                        {t('manualPaymentNote') || 'After payment, click confirm below'}
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => onPaymentConfirm()}
                        className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                    >
                        {t('confirmPayment') || 'I Have Paid - Confirm'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                        {t('cancel') || 'Cancel'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-2xl p-6 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {t('payingTo') || 'Paying To'}
                        </p>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg">
                            {qrData.sellerName}
                        </h4>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {t('amount') || 'Amount'}
                        </p>
                        <p className="text-2xl font-black text-primary">
                            ₹{qrData.amount.toFixed(2)}
                        </p>
                    </div>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        UPI ID
                    </p>
                    <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                        {qrData.sellerUpiId}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
                        {t('scanWithUpiApp') || 'Scan with any UPI App'}
                    </p>
                    {timeLeft !== null && (
                        <div className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-2 ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse' : 'bg-primary/10 text-primary'}`}>
                            <span>⏱</span> {formatTime(timeLeft)}
                        </div>
                    )}
                </div>

                <div className="relative group mx-auto w-fit">
                    {/* QR Watermark Overlay for security */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-4xl font-black rotate-[-45deg] select-none">AGROHORIZON</span>
                    </div>

                    <div className={`bg-white p-4 rounded-2xl shadow-lg transition-all ${timeLeft === 0 ? 'grayscale scale-95 opacity-50' : ''}`}>
                        <img
                            src={qrData.qrCodeDataUrl}
                            alt="UPI QR Code"
                            className="w-64 h-64"
                        />
                        {timeLeft === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center flex-col bg-slate-900/40 backdrop-blur-[2px] rounded-2xl">
                                <span className="text-3xl mb-2">🛑</span>
                                <p className="text-white font-black text-sm uppercase">{t('expired') || 'Expired'}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {t('compatibleApps') || 'Works with'}:
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                            Google Pay
                        </span>
                        <span className="text-sm font-bold bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                            PhonePe
                        </span>
                        <span className="text-sm font-bold bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                            Paytm
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                    <span className="text-xl">ℹ️</span>
                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium space-y-1">
                        <p className="font-bold">{t('paymentInstructions') || 'Payment Instructions'}:</p>
                        <ul className="list-disc list-inside space-y-0.5 ml-1">
                            <li>{t('scanQrInstruction') || 'Scan the QR code with your UPI app'}</li>
                            <li>{t('verifyAmountInstruction') || 'Verify the amount and seller name'}</li>
                            <li>{t('completePaymentInstruction') || 'Complete the payment in your app'}</li>
                            <li>{t('clickConfirmInstruction') || 'Click "Confirm Payment" below after successful payment'}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => {
                        if (qrData?.nonce) {
                            onPaymentConfirm(qrData.nonce, qrData.paymentSignature);
                        }
                    }}
                    disabled={timeLeft === 0}
                    className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                >
                    <span>✓</span>
                    <span>{t('confirmPayment') || 'I Have Paid - Confirm'}</span>
                </button>
                <button
                    onClick={onClose}
                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    {t('cancel') || 'Cancel'}
                </button>
            </div>
        </div>
    );
}
