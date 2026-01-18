import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "../../context/LanguageContext";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface ProductReviewsProps {
    productId: Id<"products">;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [showForm, setShowForm] = useState(false);

    const { t } = useLanguage();
    const { handleError, handleSuccess } = useErrorHandler();

    const reviews = (useQuery(api.reviews.getProductReviews, { productId }) || []) as any[];
    const postReview = useMutation(api.reviews.postReview);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await postReview({
                productId,
                rating,
                comment
            });
            setComment("");
            setShowForm(false);
            handleSuccess(t('reviewPosted') || "Review posted!", "reviewPosted");
        } catch (error) {
            handleError(error, t('reviewFailed') || "Failed to post review");
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">⭐️</span>
                    <span className="text-sm font-black text-slate-700 dark:text-white">{avgRating || t('noReviews') || "No reviews"}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">({reviews.length})</span>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                >
                    {showForm ? t('cancel') : t('writeReview') || "Write Review"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-4 animate-scale-up">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setRating(num)}
                                className={`text-2xl transition-transform active:scale-90 ${rating >= num ? 'opacity-100' : 'opacity-30'}`}
                            >
                                ⭐️
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t('shareExperience') || "Share your experience..."}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none font-bold transition-all dark:text-white"
                        rows={3}
                    />
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                        {t('postReview') || "Post Review"}
                    </button>
                </form>
            )}

            <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {reviews.map((review: any) => (
                    <div key={review._id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-black text-slate-900 dark:text-white capitalize tracking-wide">{review.buyerName}</p>
                            <div className="flex text-[10px]">
                                {"⭐️".repeat(review.rating)}
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">"{review.comment}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
