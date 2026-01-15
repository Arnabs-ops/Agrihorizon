import { Id, Doc } from "../../convex/_generated/dataModel";
import { UserProfileData, AuthUser } from "./user";
import { OrderStatus, DeliveryStep } from "../lib/constants";
import { Product } from "./product";

export interface Order {
    _id: Id<"orders">;
    buyerId: Id<"users">;
    sellerId: Id<"users">;
    productId: Id<"products">;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    status: OrderStatus | string;
    orderDate: number;
    deliveryAddress?: string;
    notes?: string;
    isPaid?: boolean;
    paymentDate?: number;
    driverName?: string;
    driverPhone?: string;
    deliveryStep?: DeliveryStep | string;
}

export interface OrderWithDetails extends Order {
    product: Product | null;
    seller: {
        user: AuthUser;
        profile: UserProfileData | null;
    };
    buyer: {
        user: AuthUser;
        profile: UserProfileData | null;
    };
}

// Base order document from Convex
export type OrderDoc = Doc<"orders">;

