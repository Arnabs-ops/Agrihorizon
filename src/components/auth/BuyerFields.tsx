import { useLanguage } from "../../context/LanguageContext";

interface BuyerFieldsProps {
    setPreferredProducts: (products: string[]) => void;
}

export function BuyerFields({ setPreferredProducts }: BuyerFieldsProps) {
    const { t } = useLanguage();

    const handlePreferredProductsChange = (value: string) => {
        const products = value.split(",").map(product => product.trim()).filter(product => product);
        setPreferredProducts(products);
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('preferredProducts')}
            </label>
            <input
                type="text"
                onChange={(e) => handlePreferredProductsChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                placeholder={t('preferredProductsPlaceholder')}
            />
            <p className="mt-2 text-xs text-slate-400 font-medium italic">
                {t('commaSeparatedHint') || "Separate products with commas (e.g. Wheat, Rice, Corn)"}
            </p>
        </div>
    );
}
