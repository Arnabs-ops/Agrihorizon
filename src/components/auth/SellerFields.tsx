import { useLanguage } from "../../context/LanguageContext";
import { VoiceInput } from "../common/VoiceInput";

interface SellerFieldsProps {
    businessName: string;
    setBusinessName: (name: string) => void;
    farmSize: string;
    setFarmSize: (size: string) => void;
    setCropTypes: (crops: string[]) => void;
}

export function SellerFields({
    businessName,
    setBusinessName,
    farmSize,
    setFarmSize,
    setCropTypes
}: SellerFieldsProps) {
    const { t } = useLanguage();

    const handleCropTypesChange = (value: string) => {
        const crops = value.split(",").map(crop => crop.trim()).filter(crop => crop);
        setCropTypes(crops);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('businessFarmName')}
                    </label>
                    <VoiceInput
                        value={businessName}
                        onChange={setBusinessName}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-medium transition-all outline-none"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                    placeholder={t('cropTypesPlaceholder')}
                />
                <p className="mt-2 text-xs text-slate-400 font-medium italic">
                    {t('commaSeparatedHint') || "Separate crops with commas (e.g. Wheat, Rice, Corn)"}
                </p>
            </div>
        </div>
    );
}
