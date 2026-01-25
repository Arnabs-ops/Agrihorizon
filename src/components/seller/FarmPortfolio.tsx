import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { UserProfile } from "../../types/seller";
import { format } from "date-fns";
import { CertificationManagement } from "./CertificationManagement";

interface FarmPortfolioProps {
    userProfile: UserProfile;
    isReadOnly?: boolean;
}

export function FarmPortfolio({ userProfile, isReadOnly = false }: FarmPortfolioProps) {
    const { t } = useLanguage();
    const { profile } = userProfile;
    const updateProfile = useMutation(api.users.updateUserProfile);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    if (!profile) return null;

    const imageUrls = useQuery(api.files.getImageUrls, {
        storageIds: profile.farmImages || []
    }) || [];

    // Automatically fetch and display certifications for this seller
    const certifications = useQuery(
        api.certifications.fetchSellerCertifications,
        { sellerId: profile.userId }
    ) || [];

    const [bio, setBio] = useState(profile.farmBio || "");
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSaveBio = async () => {
        try {
            await updateProfile({ farmBio: bio });
            toast.success(t('bioUpdated'));
            setIsEditing(false);
        } catch (error) {
            toast.error(t('updateFailed'));
        }
    };

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
            const { storageId } = await result.json() as { storageId: Id<"_storage"> };

            const currentImages = profile.farmImages || [];
            await updateProfile({ farmImages: [...currentImages, storageId] });
            toast.success(t('imageUploaded'));
        } catch (error) {
            toast.error(t('uploadFailed'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 animate-entry">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 dark:border-slate-800 modern-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{t('digitalFarmPortfolio')}</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('showcaseYourFarm')}</p>
                        </div>
                        {profile.isVerified && (
                            <span className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-2">
                                <span className="animate-pulse">✓</span> {t('verifiedSellers')}
                            </span>
                        )}
                    </div>

                    {/* Farm Bio Section */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="text-2xl">📖</span> {t('farmHistory')}
                            </h3>
                            {!isReadOnly && (
                                <button
                                    onClick={() => isEditing ? handleSaveBio() : setIsEditing(true)}
                                    className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
                                >
                                    {isEditing ? t('save') : t('edit')}
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                                placeholder={t('writeAboutFarm')}
                            />
                        ) : (
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">
                                {bio || t('noBioYet')}
                            </p>
                        )}
                    </div>

                    {/* Quality Certifications Section - Automatically displayed */}
                    {certifications.length > 0 && (
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-3xl p-6 md:p-8 border border-emerald-200 dark:border-emerald-800/50">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
                                <span className="text-2xl">🏆</span> {t('qualityCertifications')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {certifications.map((cert: any) => {
                                    const certTypeColors: Record<string, string> = {
                                        organic: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
                                        fssai: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                                        iso: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
                                        gmp: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
                                        halal: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
                                        custom: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
                                    };
                                    const colorClass = certTypeColors[cert.certificationType] || certTypeColors.custom;
                                    const isExpiringSoon = cert.expiryDate && cert.expiryDate <= Date.now() + 30 * 24 * 60 * 60 * 1000;

                                    return (
                                        <div
                                            key={cert._id}
                                            className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 ${colorClass} transition-all hover:scale-[1.02] shadow-lg`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-black text-lg text-slate-900 dark:text-white mb-1">
                                                        {cert.certificationName}
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                        {cert.issuerName}
                                                    </p>
                                                </div>
                                                {cert.documentUrl && (
                                                    <a
                                                        href={cert.documentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline text-xs font-bold"
                                                        title="View Certificate"
                                                    >
                                                        📄
                                                    </a>
                                                )}
                                            </div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <span className="font-bold">Cert #:</span>
                                                    <span className="font-mono">{cert.certificateNumber}</span>
                                                </div>
                                                {cert.expiryDate && (
                                                    <div className={`flex items-center gap-2 ${isExpiringSoon ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                                        <span className="font-bold">Expires:</span>
                                                        <span>{format(new Date(cert.expiryDate), "MMM dd, yyyy")}</span>
                                                        {isExpiringSoon && <span className="text-xs">⚠️</span>}
                                                    </div>
                                                )}
                                                {!cert.expiryDate && (
                                                    <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                                        ✓ No Expiry
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Farm Gallery Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="text-2xl">📸</span> {t('farmGallery') || "Farm Gallery"}
                            </h3>
                            {!isReadOnly && (
                                <label className="cursor-pointer bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 active:scale-95 flex items-center gap-2">
                                    {uploading ? "..." : "+ " + (t('uploadPhoto') || "Upload Photo")}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imageUrls.map((url, index) => (
                                <div key={index} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden group relative">
                                    {url ? (
                                        <img
                                            src={url}
                                            alt={`Farm ${index + 1} `}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                            <span className="text-4xl text-white">🚜</span>
                                        </div>
                                    )}
                                    {!isReadOnly && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => {
                                                    const newImages = [...(profile.farmImages || [])];
                                                    newImages.splice(index, 1);
                                                    updateProfile({ farmImages: newImages });
                                                }}
                                                className="text-white font-bold text-xs hover:underline bg-red-500/80 px-3 py-1.5 rounded-lg backdrop-blur-sm"
                                            >
                                                {t('remove')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!profile.farmImages || profile.farmImages.length === 0) && (
                                <div className="col-span-full py-12 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <p className="text-slate-400 dark:text-slate-500 font-bold">{t('noImagesYet')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Certification Management Section - Only for sellers viewing their own portfolio */}
                    {!isReadOnly && (
                        <div className="mt-8">
                            <CertificationManagement />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
