import { Id, Doc } from "../../convex/_generated/dataModel";
import { UserProfileData, AuthUser } from "./user";
import { ProductCategory } from "../lib/constants";

export interface PriceTier {
    minQuantity: number;
    price: number;
}

export interface Product {
    _id: Id<"products">;
    sellerId: Id<"users">;
    name: string;
    description?: string;
    price: number;
    unit: string;
    category: ProductCategory | string;
    stockQuantity: number;
    isActive: boolean;
    imageEmoji: string;
    imageStorageId?: Id<"_storage">;
    imageUrl?: string | null;
    priceTiers?: PriceTier[];
}

export interface ProductWithSeller extends Product {
    seller: {
        user: AuthUser;
        profile: UserProfileData | null;
    };
}

// Base product document from Convex
export type ProductDoc = Doc<"products">;

