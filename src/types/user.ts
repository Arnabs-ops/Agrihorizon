import { Id, Doc } from "../../convex/_generated/dataModel";

export interface TutorialProgress {
    hasSeenWelcome: boolean;
    hasCompletedTour: boolean;
    completedSteps: string[];
    dismissedChecklist: boolean;
    lastTutorialDate: number;
}

export interface UserProfileData {
    _id: Id<"userProfiles">;
    _creationTime: number;
    userId: Id<"users">;
    role: "seller" | "buyer";
    fullName: string;
    phoneNumber?: string;
    location?: string;
    businessName?: string;
    farmSize?: string;
    cropTypes?: string[];
    preferredProducts?: string[];
    tutorialProgress?: TutorialProgress;
    farmBio?: string; // For sellers
    farmImages?: Id<"_storage">[]; // For sellers
    isVerified?: boolean; // For sellers
}

// Properly type the auth user from Convex
export type AuthUser = Doc<"users">;

export interface UserProfile {
    user: AuthUser;
    profile: UserProfileData | null;
}
