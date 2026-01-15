import { Id } from "../../convex/_generated/dataModel";

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
}

export interface UserProfile {
    user: any; // Keeping 'any' for the auth user object as it comes from a different system, or we can define it if known.
    profile: UserProfileData | null;
}
