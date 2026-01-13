import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface TutorialProgress {
    hasSeenWelcome: boolean;
    hasCompletedTour: boolean;
    completedSteps: string[];
    dismissedChecklist: boolean;
    lastTutorialDate: number;
}

interface TutorialContextValue {
    tutorialProgress: TutorialProgress | null;
    markWelcomeSeen: () => void;
    markTourCompleted: () => void;
    markStepCompleted: (stepId: string) => void;
    dismissChecklist: () => void;
    resetTutorial: () => void;
    isLoading: boolean;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
    const userProfile = useQuery(api.users.getCurrentUserProfile);
    const updateProgress = useMutation(api.users.updateTutorialProgress);
    const resetTutorialMutation = useMutation(api.users.resetTutorial);
    const [isLoading, setIsLoading] = useState(false);

    const tutorialProgress = userProfile?.profile?.tutorialProgress || null;

    const markWelcomeSeen = async () => {
        setIsLoading(true);
        try {
            await updateProgress({ hasSeenWelcome: true });
        } catch (error) {
            console.error("Failed to mark welcome as seen:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markTourCompleted = async () => {
        setIsLoading(true);
        try {
            await updateProgress({ hasCompletedTour: true });
        } catch (error) {
            console.error("Failed to mark tour as completed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markStepCompleted = async (stepId: string) => {
        const currentSteps = tutorialProgress?.completedSteps || [];
        if (!currentSteps.includes(stepId)) {
            setIsLoading(true);
            try {
                await updateProgress({
                    completedSteps: [...currentSteps, stepId],
                });
            } catch (error) {
                console.error("Failed to mark step as completed:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const dismissChecklist = async () => {
        setIsLoading(true);
        try {
            await updateProgress({ dismissedChecklist: true });
        } catch (error) {
            console.error("Failed to dismiss checklist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetTutorial = async () => {
        setIsLoading(true);
        try {
            await resetTutorialMutation();
        } catch (error) {
            console.error("Failed to reset tutorial:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TutorialContext.Provider
            value={{
                tutorialProgress,
                markWelcomeSeen,
                markTourCompleted,
                markStepCompleted,
                dismissChecklist,
                resetTutorial,
                isLoading,
            }}
        >
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error("useTutorial must be used within a TutorialProvider");
    }
    return context;
}
