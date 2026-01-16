import React, { memo } from 'react';
import { useLanguage } from '../../useLanguage';
import { Product } from '../../types/seller';
import { Id } from '../../../convex/_generated/dataModel';

interface SellerInventoryProps {
    sellerProducts: Product[];
    onAddProduct: () => void;
    onEditProduct: (product: Product) => void;
    onDeleteProduct: (productId: Id<"products">) => void;
    formatPrice: (price: number) => string;
}

export const SellerInventory = memo(function SellerInventory({
    sellerProducts,
    onAddProduct,
    onEditProduct,
    onDeleteProduct,
    formatPrice,
}: SellerInventoryProps) {
    const { t } = useLanguage();

    const getProductStatus = (product: Product) => {
        if (!product.isActive) return { text: t('cancelled'), color: "bg-red-100 text-red-800" };
        if (product.stockQuantity === 0) return { text: t('outOfStock'), color: "bg-red-100 text-red-800" };
        if (product.stockQuantity < 10) return { text: "lowStock", color: "bg-yellow-100 text-yellow-800" };
        return { text: "active", color: "bg-green-100 text-green-800" };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900">{t('inventory')}</h2>
                <button
                    onClick={onAddProduct}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-95"
                >
                    + {t('addProduct')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerProducts.map((product) => {
                    const status = getProductStatus(product);
                    return (
                        <div key={product._id} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl transition-all group modern-shadow">
                            <div className="relative h-48 mb-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden group-hover:shadow-lg transition-all duration-500 flex items-center justify-center">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <span className="text-5xl group-hover:scale-120 transition-transform duration-500">{product.imageEmoji}</span>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status.color} shadow-sm backdrop-blur-md bg-white/80 dark:bg-slate-900/80`}>
                                        {t(status.text.toLowerCase() as any) || status.text}
                                    </span>
                                </div>
                            </div>
                            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1">{product.name}</h3>

                            <div className="space-y-1 mb-3">
                                <p className="text-primary dark:text-primary font-black text-xl">
                                    {formatPrice(product.price)}<span className="text-sm font-bold text-slate-400 dark:text-slate-500">/{product.unit}</span>
                                </p>
                                {product.priceTiers && product.priceTiers.length > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                        <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-500 mb-1">{t('tieredPricing')}</p>
                                        {product.priceTiers.map((tier, idx) => (
                                            <p key={idx} className="text-xs text-amber-800 dark:text-amber-400 font-bold">
                                                {tier.minQuantity}+ {product.unit}: <span className="text-amber-600 dark:text-amber-500">{formatPrice(tier.price)}</span>
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('stock')}: <span className="text-slate-900 dark:text-slate-200">{product.stockQuantity} {product.unit}</span></p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onEditProduct(product)}
                                    className="flex-1 bg-slate-900 text-white py-3 px-4 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm active:scale-95"
                                >
                                    {t('update')}
                                </button>
                                <button
                                    onClick={() => onDeleteProduct(product._id)}
                                    className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                                    title={t('deleteProduct')}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sellerProducts?.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 text-xl font-bold mb-6">{t('noProductsYet') || "No products yet"}</p>
                    <button
                        onClick={onAddProduct}
                        className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        {t('addProduct')}
                    </button>
                </div>
            )}
        </div>
    );
});
