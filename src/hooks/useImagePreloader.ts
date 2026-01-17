import { useEffect } from "react";

/**
 * Hook to preload a list of images
 * @param images Array of image URLs or imports
 */
export function useImagePreloader(images: string[]) {
    useEffect(() => {
        const preload = () => {
            images.forEach((src) => {
                if (!src) return;
                const img = new Image();
                img.src = src;
            });
        };
        preload();
    }, [images]);
}
