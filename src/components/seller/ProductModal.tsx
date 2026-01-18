import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { VoiceInput } from "../common/VoiceInput";

interface ProductModalProps {
    product?: any;
    onClose: () => void;
    onSave: (data: any) => void;
}

export function ProductModal({ product, onClose, onSave }: ProductModalProps) {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: product?.name || "",
        description: product?.description || "",
        price: product?.price || 0,
        unit: product?.unit || "kg",
        category: product?.category || "vegetables",
        stockQuantity: product?.stockQuantity || 0,
        imageEmoji: product?.imageEmoji || "🥬",
        imageStorageId: product?.imageStorageId || undefined,
        priceTiers: product?.priceTiers || [],
    });

    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(product?.imageUrl || null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();

            setFormData(prev => ({ ...prev, imageStorageId: storageId }));
            setPreviewUrl(URL.createObjectURL(file));
            toast.success("Image uploaded!");
        } catch (error) {
            toast.error("Upload failed");
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const addTier = () => {
        setFormData(prev => ({
            ...prev,
            priceTiers: [...prev.priceTiers, { minQuantity: 0, price: 0 }]
        }));
    };

    const removeTier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            priceTiers: prev.priceTiers.filter((_: any, i: number) => i !== index)
        }));
    };

    const updateTier = (index: number, field: string, value: number) => {
        setFormData(prev => ({
            ...prev,
            priceTiers: prev.priceTiers.map((tier: any, i: number) =>
                i === index ? { ...tier, [field]: value } : tier
            )
        }));
    };

    const categories = ["vegetables", "fruits", "grains", "dairy", "herbs", "nuts"];
    const units = ["lb", "kg", "dozen", "head", "bunch", "bag", "box"];
    const emojis = ["🍅", "🥬", "🥕", "🌽", "🍎", "🍊", "🥚", "🥛", "🌾", "🥜"];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <span className="text-3xl">📦</span>
                    {product ? t('editProduct') : t('addProduct')}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                {t('productName')}
                            </label>
                            <VoiceInput
                                value={formData.name}
                                onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                                placeholder={t('productName')}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                {t('basePrice')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                {t('unit')}
                            </label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-slate-700"
                            >
                                {units.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                {t('description')}
                            </label>
                            <VoiceInput
                                type="textarea"
                                value={formData.description}
                                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                                placeholder={t('description')}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium resize-none"
                            />
                        </div>

                        {/* Pricing Tiers Section */}
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                    {t('tieredPricing')}
                                </label>
                                <button
                                    type="button"
                                    onClick={addTier}
                                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                    + {t('addTier')}
                                </button>
                            </div>

                            {formData.priceTiers.map((tier: any, index: number) => (
                                <div key={index} className="flex gap-4 mb-3 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">Min Qty</label>
                                        <input
                                            type="number"
                                            value={tier.minQuantity}
                                            onChange={(e) => updateTier(index, 'minQuantity', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">Price</label>
                                        <input
                                            type="number"
                                            value={tier.price}
                                            onChange={(e) => updateTier(index, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeTier(index)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {formData.priceTiers.length === 0 && (
                                <p className="text-xs text-slate-400 text-center italic py-2">{t('noTiersConfigured') || "No bulk pricing configured"}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                {t('category')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${formData.category === cat
                                                ? "bg-slate-900 text-white shadow-lg"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                {t('stock')}: {formData.stockQuantity}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                step="1"
                                value={formData.stockQuantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) }))}
                                className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                {t('image')}
                            </label>

                            <div className="flex items-start gap-6">
                                <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-4xl overflow-hidden border-2 border-dashed border-slate-300 relative group">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{formData.imageEmoji}</span>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase">{t('selectEmoji')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {emojis.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, imageEmoji: emoji }));
                                                        setPreviewUrl(null);
                                                    }}
                                                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.imageEmoji === emoji && !previewUrl
                                                            ? "bg-white shadow-md border-2 border-primary transform scale-110"
                                                            : "bg-slate-50 hover:bg-white hover:shadow-sm"
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase">{t('orUploadImage')}</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-bold
                        file:bg-primary/10 file:text-primary
                        hover:file:bg-primary/20
                        transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-primary text-white py-4 rounded-xl font-bold shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            {t('saveProduct')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
