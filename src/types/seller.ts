import { Id } from "../../convex/_generated/dataModel";

export interface UserProfile {
    user: any;
    profile: {
        role: "seller" | "buyer";
        fullName: string;
        phoneNumber?: string;
        location?: string;
        businessName?: string;
        farmSize?: string;
        cropTypes?: string[];
        preferredProducts?: string[];
        farmBio?: string;
        farmImages?: Id<"_storage">[];
        isVerified?: boolean;
    } | null;
}

export interface SellerDashboardProps {
    userProfile: UserProfile;
}

export interface Product {
    _id: Id<"products">;
    name: string;
    description?: string;
    price: number;
    unit: string;
    category: string;
    stockQuantity: number;
    imageEmoji: string;
    imageStorageId?: Id<"_storage">;
    imageUrl?: string | null;
    isActive: boolean;
    priceTiers?: Array<{ minQuantity: number; price: number }>;
}

export interface Order {
    _id: Id<"orders">;
    status: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    orderDate: number;
    deliveryAddress?: string;
    product: {
        name: string;
        unit: string;
        imageEmoji: string;
        [key: string]: any;
    } | null;
    buyer: {
        user: any;
        profile: {
            fullName: string;
            businessName?: string;
            [key: string]: any;
        } | null;
    };
    seller: {
        user: any;
        profile: {
            fullName: string;
            businessName?: string;
            location?: string;
            [key: string]: any;
        } | null;
    };
}

export interface AnalyticsData {
    totalProducts: number;
    pendingOrders: number;
    monthlyRevenue: number;
    completedOrders: number;
    topProducts?: Array<{
        name: string;
        sales: number;
        percentage: number;
    }>;
}
