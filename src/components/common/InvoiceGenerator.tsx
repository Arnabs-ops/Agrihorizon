import { useRef } from 'react';
import { useLanguage } from '../../useLanguage';
import { Order } from '../../types/seller';

interface InvoiceGeneratorProps {
    order: Order;
    formatPrice: (price: number) => string;
    formatDate: (timestamp: number) => string;
    onClose: () => void;
}

export function InvoiceGenerator({ order, formatPrice, formatDate, onClose }: InvoiceGeneratorProps) {
    const { t } = useLanguage();
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current;
        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = 'Print' + uniqueName;
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        if (printWindow && printContent) {
            printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order._id}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { padding: 0; margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="bg-white p-8">
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="text-2xl">📄</span> {t('invoice') || "Digital Invoice"}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            <span>🖨️</span> {t('print') || "Print"}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2"
                        >
                            <span className="text-2xl">✕</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12" ref={printRef}>
                    {/* Invoice Branded Header */}
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 mb-2">AgriHorizon</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Premium Agricultural Marketplace</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-black text-primary mb-1 uppercase tracking-tight">{t('invoice')}</h2>
                            <p className="text-slate-400 font-bold text-sm">#{order._id.toString().slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12 border-y border-slate-100 py-12">
                        <div>
                            <h3 className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-4">{t('billTo')}</h3>
                            <p className="font-black text-slate-900 text-lg leading-tight mb-1">{order.buyer?.profile?.fullName}</p>
                            <p className="text-slate-600 font-medium text-sm leading-relaxed max-w-[200px]">{order.deliveryAddress || "No address provided"}</p>
                            <p className="text-slate-600 font-medium text-sm mt-1">{order.buyer?.profile?.phoneNumber}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-4">{t('shipTo')}</h3>
                            <p className="font-black text-slate-900 text-lg leading-tight mb-1">{order.seller?.profile?.businessName || order.seller?.profile?.fullName}</p>
                            <p className="text-slate-600 font-medium text-sm leading-relaxed ml-auto max-w-[200px]">{order.seller?.profile?.location}</p>
                            <div className="mt-4 flex flex-col items-end gap-1">
                                <p className="text-slate-400 font-bold text-[10px] uppercase">{t('orderDate')}</p>
                                <p className="font-black text-slate-900 text-sm">{formatDate(order.orderDate)}</p>
                            </div>
                        </div>
                    </div>

                    <table className="w-full mb-12">
                        <thead>
                            <tr className="border-b border-slate-900">
                                <th className="text-left py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('description')}</th>
                                <th className="text-center py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('quantity')}</th>
                                <th className="text-right py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('unitPrice')}</th>
                                <th className="text-right py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('totalAmount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-6">
                                    <p className="font-black text-slate-900 text-lg">{order.product?.name}</p>
                                    <p className="text-slate-500 text-sm font-medium">{order.product?.category}</p>
                                </td>
                                <td className="py-6 text-center font-black text-slate-700">{order.quantity} {order.product?.unit}</td>
                                <td className="py-6 text-right font-black text-slate-700">{formatPrice(order.unitPrice)}</td>
                                <td className="py-6 text-right font-black text-primary text-xl">{formatPrice(order.totalAmount)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-end pt-8">
                        <div className="w-full max-w-[240px] space-y-4">
                            <div className="flex justify-between items-center text-slate-500 font-bold">
                                <span>{t('subtotal')}</span>
                                <span>{formatPrice(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500 font-bold">
                                <span>{t('tax') || "Tax (0%)"}</span>
                                <span>{formatPrice(0)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-900 text-slate-900">
                                <span className="font-black uppercase tracking-widest text-xs">{t('totalAmount')}</span>
                                <span className="text-3xl font-black text-primary">{formatPrice(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 pt-12 border-t border-slate-100 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-2">{t('thankYou') || "Thank you for your business!"}</p>
                        <p className="text-slate-500 text-sm font-bold italic">Generated by AgriHorizon AI-Powered Agriculture Platform</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
