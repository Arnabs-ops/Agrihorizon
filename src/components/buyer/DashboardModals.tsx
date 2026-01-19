import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useLanguage } from "../../context/LanguageContext";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import type { OrderWithDetails } from "../../types";
import { MessagingSystem } from "../layout/MessagingSystem";
import { DynamicQrCode } from "../payment/DynamicQrCode";

interface DashboardModalsProps {
    showCart: boolean;
    setShowCart: (show: boolean) => void;
    showPayment: boolean;
    setShowPayment: (show: boolean) => void;
    showAddressModal: boolean;
    setShowAddressModal: (show: boolean) => void;
    showMessaging: boolean;
    setShowMessaging: (show: boolean) => void;
    cartItems: OrderWithDetails[];
    cartTotal: number;
    newAddress: string;
    setNewAddress: (a: string) => void;
    handleRemoveFromCart: (id: any) => Promise<void>;
    handleUpdateAddress: () => Promise<void>;
    formatPrice: (p: number) => string;
}

export function DashboardModals({
    showCart,
    setShowCart,
    showPayment,
    setShowPayment,
    showAddressModal,
    setShowAddressModal,
    showMessaging,
    setShowMessaging,
    cartItems,
    cartTotal,
    newAddress,
    setNewAddress,
    handleRemoveFromCart,
    handleUpdateAddress,
    formatPrice
}: DashboardModalsProps) {
    const { t } = useLanguage();
    const { handleError, handleSuccess } = useErrorHandler();

    // Multi-seller payment state
    const [currentSellerIndex, setCurrentSellerIndex] = useState(0);

    // Mutations for payment processing
    const markOrdersAsPaid = useMutation(api.orders.markOrdersAsPaid);

    return (
        <>
            {/* Cart Modal */}
            {showCart && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCart(false)}></div>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="text-3xl">🛒</span> {t('yourCart')}
                                </h2>
                                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{cartItems.length} {t('itemsInCart')}</p>
                            </div>
                            <button onClick={() => setShowCart(false)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-lg hover:bg-slate-50 transition-all font-black">✕</button>
                        </div>

                        <div className="p-8 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                            {cartItems.map((item) => (
                                <div key={item._id} className="group p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                            {item.product?.imageEmoji}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-slate-900 dark:text-white text-lg">{item.product?.name}</h4>
                                            <p className="text-sm font-bold text-slate-400">{t('quantity')}: {item.quantity} {item.product?.unit}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="text-lg font-black text-primary">{formatPrice(item.totalAmount)}</span>
                                            <button
                                                onClick={() => handleRemoveFromCart(item._id)}
                                                className="text-xs font-black text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest"
                                            >
                                                {t('remove')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {cartItems.length === 0 && (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <span className="text-6xl mb-4">🛒</span>
                                    <p className="text-slate-400 font-black text-xl">{t('cartEmpty')}</p>
                                    <button onClick={() => setShowCart(false)} className="mt-6 text-primary font-black hover:underline px-6 py-3 bg-primary/5 rounded-xl">{t('startShopping')} →</button>
                                </div>
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{t('totalAmount')}</span>
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">{formatPrice(cartTotal)}</span>
                                </div>
                                <button
                                    onClick={() => setShowPayment(true)}
                                    className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span>{t('proceedToCheckout')}</span>
                                    <span className="text-2xl">⚡</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowPayment(false)}></div>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 modern-shadow relative z-10 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black mb-6 flex items-center justify-center gap-3">
                            <span className="text-3xl">💳</span> {t('secureCheckout')}
                        </h2>

                        {/* Dynamic QR code for current seller */}
                        {cartItems.length > 0 && cartItems[currentSellerIndex] && (
                            <DynamicQrCode
                                orderId={cartItems[currentSellerIndex]._id}
                                amount={cartItems[currentSellerIndex].totalAmount}
                                onPaymentConfirm={async (nonce, signature) => {
                                    try {
                                        // Mark current order as paid with security tokens
                                        await markOrdersAsPaid({
                                            orderIds: [cartItems[currentSellerIndex]._id],
                                            nonce,
                                            signature
                                        });

                                        // If more sellers remain, move to next
                                        if (currentSellerIndex < cartItems.length - 1) {
                                            setCurrentSellerIndex(currentSellerIndex + 1);
                                            handleSuccess('Payment confirmed! Please pay the next seller.');
                                        } else {
                                            // All payments done
                                            handleSuccess('All payments completed successfully!');
                                            setShowPayment(false);
                                            setShowCart(false);
                                            setCurrentSellerIndex(0);
                                        }
                                    } catch (error) {
                                        handleError(error, 'Failed to confirm payment');
                                    }
                                }}
                                onClose={() => {
                                    setShowPayment(false);
                                    setCurrentSellerIndex(0);
                                }}
                            />
                        )}

                        {/* Progress indicator for multi-seller carts */}
                        {cartItems.length > 1 && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-center text-sm font-bold text-slate-500 mb-3">
                                    Payment Progress: {currentSellerIndex + 1} / {cartItems.length}
                                </p>
                                <div className="flex gap-2 justify-center">
                                    {cartItems.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-2 rounded-full transition-all ${idx < currentSellerIndex
                                                ? 'w-8 bg-emerald-500'
                                                : idx === currentSellerIndex
                                                    ? 'w-12 bg-primary'
                                                    : 'w-8 bg-slate-200 dark:bg-slate-700'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAddressModal(false)}></div>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 modern-shadow relative z-10 w-full max-w-md border border-white/10">
                        <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <span className="text-3xl">📍</span> {t('addDeliveryAddress')}
                        </h3>
                        <p className="text-slate-500 font-medium mb-6">{t('addressPrompt')}</p>
                        <textarea
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            placeholder={t('enterFullAddress')}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl h-32 focus:ring-2 focus:ring-primary outline-none transition-all font-bold dark:text-white"
                        />
                        <div className="mt-8 flex gap-4">
                            <button onClick={() => setShowAddressModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-xl font-black">{t('cancel')}</button>
                            <button onClick={handleUpdateAddress} className="flex-1 bg-primary text-white py-4 rounded-xl font-black shadow-lg shadow-primary/20">{t('saveAddress')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Messaging System */}
            {showMessaging && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowMessaging(false)}></div>
                    <div className="w-[90%] h-[90%] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col modern-shadow border border-white/10">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                                    <span className="text-4xl text-primary animate-float">💬</span> {t('messages')}
                                </h3>
                                <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">{t('terminalInterface')}</p>
                            </div>
                            <button onClick={() => setShowMessaging(false)} className="w-14 h-14 flex items-center justify-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-black text-xl hover:rotate-90">✕</button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <MessagingSystem onClose={() => setShowMessaging(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
