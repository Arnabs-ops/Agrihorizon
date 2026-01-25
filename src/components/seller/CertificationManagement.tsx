import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import { format } from "date-fns";

export function CertificationManagement() {
    const { t } = useLanguage();
    const certifications = useQuery(api.certifications.getMyCertifications, {}) || [];
    const applyForCertification = useMutation(api.certifications.applyForCertification);
    const updateCertification = useMutation(api.certifications.updateCertification);
    const deleteCertification = useMutation(api.certifications.deleteCertification);
    const renewCertification = useMutation(api.certifications.renewCertification);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [showForm, setShowForm] = useState(false);
    const [editingCert, setEditingCert] = useState<Id<"qualityCertifications"> | null>(null);
    const [formData, setFormData] = useState({
        certificationType: "organic" as const,
        certificationName: "",
        issuerName: "",
        certificateNumber: "",
        issueDate: Date.now(),
        expiryDate: undefined as number | undefined,
        notes: "",
    });
    const [uploading, setUploading] = useState(false);
    const [documentStorageId, setDocumentStorageId] = useState<Id<"_storage"> | undefined>();

    const certificationTypes = [
        { value: "organic", label: "Organic", icon: "🌱" },
        { value: "fssai", label: "FSSAI", icon: "🍽️" },
        { value: "iso", label: "ISO", icon: "⭐" },
        { value: "gmp", label: "GMP", icon: "✅" },
        { value: "halal", label: "Halal", icon: "🕌" },
        { value: "custom", label: "Custom", icon: "📜" },
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.match(/^(image\/(jpeg|jpg|png)|application\/pdf)$/)) {
            toast.error("Please upload a PDF, JPG, or PNG file");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json() as { storageId: Id<"_storage"> };
            setDocumentStorageId(storageId);
            toast.success("Document uploaded successfully!");
        } catch (error) {
            toast.error("Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.certificationName.trim() || !formData.issuerName.trim() || !formData.certificateNumber.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!documentStorageId) {
            toast.error("Please upload a certificate document");
            return;
        }

        try {
            if (editingCert) {
                await updateCertification({
                    certificationId: editingCert,
                    ...formData,
                    documentStorageId,
                });
                toast.success("Certification updated successfully!");
            } else {
                await applyForCertification({
                    ...formData,
                    documentStorageId,
                });
                toast.success("Certification application submitted! It will be reviewed by our team.");
            }
            setShowForm(false);
            setEditingCert(null);
            resetForm();
        } catch (error: any) {
            toast.error(error.message || "Failed to submit certification");
        }
    };

    const resetForm = () => {
        setFormData({
            certificationType: "organic",
            certificationName: "",
            issuerName: "",
            certificateNumber: "",
            issueDate: Date.now(),
            expiryDate: undefined,
            notes: "",
        });
        setDocumentStorageId(undefined);
    };

    const handleEdit = (cert: any) => {
        if (cert.status !== "pending") {
            toast.error("Only pending certifications can be edited");
            return;
        }
        setEditingCert(cert._id);
        setFormData({
            certificationType: cert.certificationType,
            certificationName: cert.certificationName,
            issuerName: cert.issuerName,
            certificateNumber: cert.certificateNumber,
            issueDate: cert.issueDate,
            expiryDate: cert.expiryDate,
            notes: cert.notes || "",
        });
        setDocumentStorageId(cert.documentStorageId);
        setShowForm(true);
    };

    const handleDelete = async (certId: Id<"qualityCertifications">) => {
        if (!confirm("Are you sure you want to delete this certification?")) return;

        try {
            await deleteCertification({ certificationId: certId });
            toast.success("Certification deleted");
        } catch (error: any) {
            toast.error(error.message || "Failed to delete certification");
        }
    };

    const handleRenew = async (certId: Id<"qualityCertifications">) => {
        try {
            await renewCertification({ certificationId: certId });
            toast.success("Renewal application created! Please complete the form.");
            setShowForm(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to renew certification");
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
            approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
            rejected: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
            expired: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
            revoked: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
        };
        return colors[status] || colors.pending;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {t('qualityCertifications')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        {t('certificationsDesc')}
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingCert(null);
                        setShowForm(!showForm);
                    }}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 active:scale-95 flex items-center gap-2"
                >
                    <span>+</span>
                    {showForm ? t('cancel') : t('applyForCertification')}
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-6">
                        {editingCert ? (t('editCertification') || "Edit Certification") : (t('newCertification') || "New Certification Application")}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('certificationType') || "Certification Type"} *
                                </label>
                                <div className="relative group">
                                    <select
                                        value={formData.certificationType}
                                        onChange={(e) => setFormData({ ...formData, certificationType: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-12 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all"
                                        required
                                    >
                                        {certificationTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-primary transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('certificationName') || "Certification Name"} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.certificationName}
                                    onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                                    placeholder="e.g., Organic Farming Certificate"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('issuerName') || "Issuing Organization"} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.issuerName}
                                    onChange={(e) => setFormData({ ...formData, issuerName: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                                    placeholder="e.g., FSSAI, Organic Certification Body"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('certificateNumber') || "Certificate Number"} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.certificateNumber}
                                    onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none font-mono"
                                    placeholder="e.g., FSSAI123456789"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('issueDate') || "Issue Date"} *
                                </label>
                                <input
                                    type="date"
                                    value={format(new Date(formData.issueDate), "yyyy-MM-dd")}
                                    onChange={(e) => setFormData({ ...formData, issueDate: new Date(e.target.value).getTime() })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('expiryDate') || "Expiry Date"} (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.expiryDate ? format(new Date(formData.expiryDate), "yyyy-MM-dd") : ""}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {t('certificateDocument') || "Certificate Document"} * (PDF, JPG, or PNG, max 5MB)
                            </label>
                            <label className="block cursor-pointer">
                                <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary transition-colors">
                                    {uploading ? (
                                        <div className="text-slate-500">Uploading...</div>
                                    ) : documentStorageId ? (
                                        <div className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Document uploaded</div>
                                    ) : (
                                        <div>
                                            <div className="text-4xl mb-2">📄</div>
                                            <div className="text-slate-600 dark:text-slate-400 font-bold">
                                                {t('clickToUpload') || "Click to upload certificate document"}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {t('notes')} (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 outline-none h-24"
                                placeholder="Any additional information about this certification..."
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 active:scale-95"
                            >
                                {editingCert ? (t('update') || "Update") : (t('submit') || "Submit Application")}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingCert(null);
                                    resetForm();
                                }}
                                className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-8 py-3 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                            >
                                {t('cancel') || "Cancel"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Certifications List */}
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
                    const statusColor = getStatusColor(cert.status);

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
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">
                                        {cert.issuerName}
                                    </p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                                        {cert.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs mb-4">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="font-bold">Cert #:</span>
                                    <span className="font-mono">{cert.certificateNumber}</span>
                                </div>
                                {cert.expiryDate && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <span className="font-bold">Expires:</span>
                                        <span>{format(new Date(cert.expiryDate), "MMM dd, yyyy")}</span>
                                    </div>
                                )}
                                {cert.rejectionReason && (
                                    <div className="text-red-600 dark:text-red-400 text-xs">
                                        <span className="font-bold">Rejection Reason:</span> {cert.rejectionReason}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {cert.status === "pending" && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(cert)}
                                            className="flex-1 bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
                                        >
                                            {t('edit')}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cert._id)}
                                            className="flex-1 bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                                        >
                                            {t('delete')}
                                        </button>
                                    </>
                                )}
                                {cert.status === "expired" && (
                                    <button
                                        onClick={() => handleRenew(cert._id)}
                                        className="w-full bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/90 transition-all"
                                    >
                                        {t('renew')}
                                    </button>
                                )}
                                {cert.documentUrl && (
                                    <a
                                        href={cert.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-center"
                                    >
                                        {t('view')}
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {certifications.length === 0 && !showForm && (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <div className="text-6xl mb-4">🏆</div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-4">
                        {t('noCertifications') || "No certifications yet"}
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all"
                    >
                        {t('applyForCertification') || "Apply for Your First Certification"}
                    </button>
                </div>
            )}
        </div>
    );
}
