import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "../context/LanguageContext";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { useState } from "react";
import { format } from "date-fns";

export function AdminDashboard({ userProfile }: { userProfile: any }) {
    const { t } = useLanguage();
    const { handleError, handleSuccess } = useErrorHandler();
    const pendingCerts = useQuery(api.certifications.getPendingCertifications, {});
    const approveCert = useMutation(api.certifications.approveCertification);
    const rejectCert = useMutation(api.certifications.rejectCertification);

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

    const handleApprove = async (id: any) => {
        setProcessingId(id);
        try {
            await approveCert({ certificationId: id });
            handleSuccess("Certification approved successfully");
        } catch (error) {
            handleError(error, "approveFailed");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!showRejectModal || !rejectionReason.trim()) return;
        setProcessingId(showRejectModal);
        try {
            await rejectCert({
                certificationId: showRejectModal as any,
                rejectionReason: rejectionReason.trim()
            });
            handleSuccess("Certification rejected");
            setShowRejectModal(null);
            setRejectionReason("");
        } catch (error) {
            handleError(error, "rejectFailed");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white modern-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-2">Admin Dashboard</h1>
                    <p className="text-slate-400 font-medium tracking-wide uppercase text-xs">Quality assurance & Moderation</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 modern-shadow">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                    <span className="text-3xl">📄</span> Pending Certifications
                </h2>

                {pendingCerts === undefined ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : pendingCerts.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="text-6xl mb-4">✅</div>
                        <p className="text-slate-500 font-black">All caught up! No pending certifications.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {pendingCerts.map((cert: any) => (
                            <div key={cert._id} className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                                                {cert.certificationType}
                                            </span>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                                {cert.certificationName}
                                            </h3>
                                        </div>
                                        {cert.documentUrl && (
                                            <a
                                                href={cert.documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-white dark:bg-slate-700 p-3 rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-600 group"
                                            >
                                                <span className="text-2xl group-hover:scale-110 block transition-transform">📄</span>
                                            </a>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Seller</p>
                                            <p className="font-black text-slate-700 dark:text-slate-200">{cert.seller?.fullName || "Unknown"}</p>
                                            <p className="text-xs text-slate-500">{cert.seller?.businessName}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Cert Number</p>
                                            <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{cert.certificateNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Issuer</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-200">{cert.issuerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">Dates</p>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                                                Issued: {format(new Date(cert.issueDate), "MMM dd, yyyy")}
                                                {cert.expiryDate && <br />}
                                                {cert.expiryDate && `Expires: ${format(new Date(cert.expiryDate), "MMM dd, yyyy")}`}
                                            </p>
                                        </div>
                                    </div>

                                    {cert.notes && (
                                        <div className="bg-white dark:bg-slate-700/50 p-4 rounded-2xl text-sm italic text-slate-500 dark:text-slate-400">
                                            "{cert.notes}"
                                        </div>
                                    )}
                                </div>

                                <div className="flex md:flex-col justify-end gap-3 min-w-[150px]">
                                    <button
                                        onClick={() => handleApprove(cert._id)}
                                        disabled={!!processingId}
                                        className="flex-1 bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        {processingId === cert._id ? "..." : "Approve"}
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(cert._id)}
                                        disabled={!!processingId}
                                        className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-500 font-black py-4 px-6 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-sm flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-scale-up border border-slate-100 dark:border-slate-800">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Reject Certification</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Please provide a reason for rejection. This will be sent to the seller.</p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g. Expired document, details mismatch, blurry photo..."
                            className="w-full h-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-6 outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowRejectModal(null); setRejectionReason(""); }}
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || !!processingId}
                                className="flex-2 bg-red-500 text-white font-black py-4 px-8 rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
