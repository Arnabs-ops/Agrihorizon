import React from 'react';
import { useLanguage } from '../../useLanguage';
import { useFormatters } from '../../hooks/useFormatters';
import { OrderStatus } from '../../lib/constants';
import type { OrderWithDetails } from '../../types';
import { Id } from '../../../convex/_generated/dataModel';
import { InvoiceGenerator } from '../common/InvoiceGenerator';

interface SellerOrdersProps {
    sellerOrders: OrderWithDetails[];
    onProcessOrder: (orderId: Id<"orders">) => void;
    onCompleteOrder: (orderId: Id<"orders">) => void;
}

export function SellerOrders({
    sellerOrders,
    onProcessOrder,
    onCompleteOrder,
}: SellerOrdersProps) {
    const { t } = useLanguage();
    const { formatPrice, formatDate, getStatusColor } = useFormatters();
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = React.useState<OrderWithDetails | null>(null);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white transition-colors duration-500">{t('myOrders')}</h2>
            <div className="space-y-4">
                {sellerOrders.map((order) => (
                    <div key={order._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-primary/30 transition-all duration-500 modern-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="text-4xl w-16 h-16 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-xl">{order.product?.imageEmoji}</div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-xl mb-1">
                                        {order.product?.name}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-50 dark:text-slate-400 flex items-center gap-2">
                                        👤 {order.buyer.profile?.fullName}
                                    </p>
                                    <p className="text-sm font-bold text-slate-500 mt-1">
                                        📦 {order.quantity} {order.product?.unit}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-xs font-bold text-slate-400">
                                            📅 {formatDate(order.orderDate)}
                                        </p>
                                        {order.deliveryAddress && (
                                            <p className="text-xs font-bold text-primary">
                                                📍 {order.deliveryAddress}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-900 dark:text-white text-2xl mb-2">
                                    {formatPrice(order.totalAmount)}
                                </p>
                                <div className="flex flex-col items-end gap-3">
                                    <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status as OrderStatus)} shadow-sm`}>
                                        {t(order.status as any) || order.status}
                                    </span>

                                    <div className="flex gap-2">
                                        {order.status === OrderStatus.PENDING && (
                                            <button
                                                onClick={() => onProcessOrder(order._id)}
                                                className="bg-amber-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg active:scale-95"
                                            >
                                                {t('processOrder')}
                                            </button>
                                        )}
                                        {order.status === OrderStatus.PROCESSING && (
                                            <button
                                                onClick={() => onCompleteOrder(order._id)}
                                                className="bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                                            >
                                                {t('markDelivered')}
                                            </button>
                                        )}
                                        {order.status === OrderStatus.DELIVERED && (
                                            <button
                                                onClick={() => setSelectedOrderForInvoice(order)}
                                                className="bg-slate-900 dark:bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-primary/90 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                            >
                                                <span>📄</span> {t('downloadInvoice')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {sellerOrders?.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-slate-400 dark:text-slate-500 text-xl font-bold">{t('noOrdersYet') || "No orders yet"}</p>
                    </div>
                )}
            </div>

            {selectedOrderForInvoice && (
                <InvoiceGenerator
                    order={selectedOrderForInvoice}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                    onClose={() => setSelectedOrderForInvoice(null)}
                />
            )}
        </div>
    );
}
