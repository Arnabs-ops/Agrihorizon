import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { FarmPortfolio } from "../seller/FarmPortfolio";

interface SellerPortfolioModalProps {
    sellerId: Id<"users"> | null;
    onClose: () => void;
}

export function SellerPortfolioModal({ sellerId, onClose }: SellerPortfolioModalProps) {
    // Fetch the seller's public profile
    const sellerProfile = useQuery(api.users.getPublicProfile, sellerId ? { userId: sellerId } : "skip");

    if (!sellerId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-full relative z-10 overflow-hidden border border-white/10 flex flex-col modern-shadow scale-95 animate-scale-up">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition-all z-[110] group"
                >
                    <span className="text-2xl group-hover:rotate-90 transition-transform">✕</span>
                </button>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {sellerProfile ? (
                        <FarmPortfolio userProfile={sellerProfile as any} isReadOnly={true} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
