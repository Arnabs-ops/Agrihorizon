// Re-export types from centralized locations
export type { UserProfile } from "./user";
export type { Product, ProductWithSeller } from "./product";
export type { Order, OrderWithDetails } from "./order";

import { UserProfile } from "./user";

export interface SellerDashboardProps {
    userProfile: UserProfile;
}

export interface AnalyticsData {
    totalProducts: number;
    activeProducts: number;
    pendingOrders: number;
    monthlyRevenue: number;
    completedOrders: number;
    topProducts?: Array<{
        name: string;
        sales: number;
        percentage: number;
    }>;
}
