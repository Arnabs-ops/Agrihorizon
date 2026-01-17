import React from "react";
import { useLanguage } from "../../useLanguage";
import { VoiceInput } from "../common/VoiceInput";
import type { ProductWithSeller } from "../../types";
import { ProductReviews } from "./ProductReviews";

interface MarketplaceViewProps {
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    selectedCategory: string;
    setSelectedCategory: (c: string) => void;
    categories: string[];
    filteredProducts: ProductWithSeller[];
    orderQuantities: Record<string, number>;
    setOrderQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    handleCreateOrder: (productId: any, sellerId: any) => Promise<void>;
    setViewingSellerId: (id: any) => void;
    formatPrice: (p: number) => string;
}

export function MarketplaceView({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    orderQuantities,
    setOrderQuantities,
    handleCreateOrder,
    setViewingSellerId,
    formatPrice
}: MarketplaceViewProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('marketplace')}</h2>
                <div className="flex gap-4">
                    <VoiceInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder={t('searchProducts')}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium bg-white dark:bg-slate-800"
                    />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                        <option value="all">{t('allCategories')}</option>
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product._id} className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 hover:shadow-xl transition-all group modern-shadow transition-colors duration-500">
                        <div className="relative h-40 mb-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden flex items-center justify-center group/img-container">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <span className="text-4xl group-hover:scale-110 transition-transform duration-500">{product.imageEmoji}</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img-container:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => setViewingSellerId(product.sellerId)}
                                    className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm transform translate-y-4 group-hover/img-container:translate-y-0 transition-all"
                                >
                                    🚜 {t('viewFarm')}
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white capitalize">{product.name}</h3>
                                <p className="text-xs font-bold text-primary">{product.seller.profile?.businessName}</p>
                            </div>
                            <span className="text-lg font-black text-slate-900 dark:text-white">{formatPrice(product.price)}/{product.unit}</span>
                        </div>

                        <div className="space-y-3">
                            {product.priceTiers && product.priceTiers.length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('bulkPricing')}</p>
                                    <div className="flex gap-2">
                                        {product.priceTiers.map((tier, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-700 px-2 py-1 rounded border border-slate-100 dark:border-slate-600">
                                                <p className="text-[10px] font-black text-slate-900 dark:text-white opacity-80">{tier.minQuantity}+</p>
                                                <p className="text-[10px] font-black text-primary">{formatPrice(tier.price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                    <button
                                        onClick={() => setOrderQuantities(prev => ({ ...prev, [product._id]: Math.max(1, (prev[product._id] || 1) - 1) }))}
                                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                    >-</button>
                                    <input
                                        type="number"
                                        value={orderQuantities[product._id] || 1}
                                        onChange={(e) => setOrderQuantities(prev => ({ ...prev, [product._id]: parseInt(e.target.value) || 1 }))}
                                        className="w-12 text-center font-bold text-sm dark:bg-slate-800 dark:text-white"
                                    />
                                    <button
                                        onClick={() => setOrderQuantities(prev => ({ ...prev, [product._id]: (prev[product._id] || 1) + 1 }))}
                                        className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                    >+</button>
                                </div>
                                <button
                                    onClick={() => handleCreateOrder(product._id, product.sellerId)}
                                    className="flex-1 bg-primary text-white py-2 rounded-lg font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                >
                                    {t('buyNow')}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <ProductReviews productId={product._id} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
