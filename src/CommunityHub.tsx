import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { useLanguage } from "./useLanguage.tsx";
import { VoiceInput } from "./components/common/VoiceInput";

export function CommunityHub() {
    const [content, setContent] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [commentContent, setCommentContent] = useState<{ [key: string]: string }>({});

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();

    // Preload images for faster rendering
    useEffect(() => {
        const preloadImages = () => {
            const images = [
                "/src/assets/buyer_bg.png",
                "/src/assets/seller_bg.png",
                "/src/assets/payment-qr.jpg"
            ];
            images.forEach((src) => {
                const img = new Image();
                img.src = src;
            });
        };
        preloadImages();
    }, []);

    const posts = useQuery(api.community.getPosts) || [];
    const userProfile = useQuery(api.users.getCurrentUserProfile);
    const generateUploadUrl = useMutation(api.community.generateUploadUrl);
    const createPost = useMutation(api.community.createPost);
    const addComment = useMutation(api.community.addComment);
    const toggleLike = useMutation(api.community.toggleLike);
    const deletePost = useMutation(api.community.deletePost);

    const currentUser = userProfile?.user;

    const handleDeletePost = async (postId: any) => {
        if (!window.confirm(t('confirmDeletePost'))) return;

        try {
            await deletePost({ postId });
            toast.success(t('postDeleted'));
        } catch (error) {
            toast.error("Failed to delete post");
            console.error(error);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !image) return;

        setIsUploading(true);
        try {
            let imageStorageId = undefined;

            if (image) {
                // Step 1: Get upload URL
                const uploadUrl = await generateUploadUrl();

                // Step 2: Upload file
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": image.type },
                    body: image,
                });

                const { storageId } = await result.json();
                imageStorageId = storageId;
            }

            // Step 3: Create post
            await createPost({ content, imageStorageId });

            setContent("");
            setImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            toast.success(t('post'));
        } catch (error) {
            toast.error("Failed to share post");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddComment = async (postId: any) => {
        const text = commentContent[postId];
        if (!text?.trim()) return;

        try {
            await addComment({ postId, content: text });
            setCommentContent({ ...commentContent, [postId]: "" });
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-entry pb-20">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                    <span className="text-4xl text-primary">🌱</span>
                    {t('communityHub')}
                </h2>
            </div>

            {/* Post Creator */}
            <div className="glass-morphism rounded-[2.5rem] shadow-2xl p-8 modern-shadow overflow-hidden relative border border-white/40">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <form onSubmit={handleCreatePost} className="space-y-6">
                    <VoiceInput
                        type="textarea"
                        placeholder={t('whatsOnYourMind')}
                        value={content}
                        onChange={setContent}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold transition-all resize-none h-32"
                    />

                    {image && (
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                            <img
                                src={URL.createObjectURL(image)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => setImage(null)}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95 text-sm"
                        >
                            <span>🖼️</span> {t('addPhoto')}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setImage(e.target.files?.[0] || null)}
                        />

                        <button
                            type="submit"
                            disabled={isUploading || (!content.trim() && !image)}
                            className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-3"
                        >
                            {isUploading ? t('uploading') : (
                                <>
                                    <span>{t('post')}</span>
                                    <span>🚀</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Feed */}
            <div className="space-y-8">
                {posts.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <span className="text-6xl mb-4 block">🌾</span>
                        <p className="text-slate-400 font-bold">{t('noPostsYet')}</p>
                    </div>
                )}

                {posts.map((post: any, index: number) => (
                    <div
                        key={post._id}
                        className="bg-white rounded-[2rem] shadow-xl border border-slate-100 modern-shadow overflow-hidden animate-entry"
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-black text-primary">
                                    {post.authorProfile?.fullName?.[0]}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900">{post.authorProfile?.fullName}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(post.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {currentUser?._id === post.authorId && (
                                <button
                                    onClick={() => handleDeletePost(post._id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                    title="Delete Post"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            {post.imageUrl && (
                                <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                    <img src={post.imageUrl} alt="Post" className="w-full max-h-[500px] object-cover" loading="lazy" />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 flex items-center gap-6 border-t border-slate-50">
                            <button
                                onClick={() => toggleLike({ postId: post._id, increment: true })}
                                className="flex items-center gap-2 text-slate-500 font-black hover:text-red-500 transition-colors group"
                            >
                                <span className="text-xl group-active:scale-125 transition-transform">❤️</span>
                                <span>{post.likes}</span>
                            </button>
                            <div className="flex items-center gap-2 text-slate-500 font-black">
                                <span className="text-xl">💬</span>
                                <span>{post.comments?.length || 0}</span>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="px-8 pb-8 pt-4 bg-slate-50/80 backdrop-blur-sm space-y-6">
                            {post.comments?.length > 0 && (
                                <div className="space-y-4">
                                    {post.comments.map((comment: any, idx: number) => (
                                        <div key={idx} className="flex gap-4 group/comment animate-entry" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sm font-black text-primary border border-slate-100 flex-shrink-0 group-hover/comment:scale-110 transition-transform">
                                                {comment.authorProfile?.fullName?.[0]}
                                            </div>
                                            <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 group-hover/comment:border-primary/20 transition-all">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{comment.authorProfile?.fullName}</p>
                                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2 relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                                    <span>💬</span>
                                </div>
                                <VoiceInput
                                    value={commentContent[post._id] || ""}
                                    onChange={(val) => setCommentContent({ ...commentContent, [post._id]: val })}
                                    placeholder={t('writeComment')}
                                    className="flex-1 pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold transition-all placeholder:text-slate-300"
                                />
                                <button
                                    onClick={() => handleAddComment(post._id)}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 active:scale-95 transition-all font-black text-xs uppercase tracking-widest"
                                >
                                    {t('post')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
