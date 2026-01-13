import { useState, useEffect, useRef } from "react";
import { useTutorial } from "./TutorialProvider";
import { useLanguage } from "./useLanguage.tsx";

interface TourStep {
    id: string;
    target: string; // CSS selector or data-tour-id
    title: string;
    description: string;
    position?: "top" | "bottom" | "left" | "right";
    order?: number;
}

interface GuidedTourProps {
    steps: TourStep[];
    onComplete: () => void;
    onSkip: () => void;
}

export function GuidedTour({ steps, onComplete, onSkip }: GuidedTourProps) {
    const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));
    const [currentStep, setCurrentStep] = useState(0);
    const [targetPosition, setTargetPosition] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { markTourCompleted, markStepCompleted } = useTutorial();
    const { t } = useLanguage();

    const currentTourStep = sortedSteps[currentStep];

    useEffect(() => {
        if (!currentTourStep) return;

        // Find target element
        const targetElement = document.querySelector(
            `[data-tour-id="${currentTourStep.target}"]`
        ) || document.querySelector(currentTourStep.target);

        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            setTargetPosition(rect);

            // Scroll element into view
            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });
        }

        // Mark step as completed when viewed
        markStepCompleted(currentTourStep.id);
    }, [currentStep, currentTourStep, markStepCompleted]);

    const handleNext = () => {
        if (currentStep < sortedSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            markTourCompleted();
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        markTourCompleted();
        onSkip();
    };

    if (!targetPosition || !currentTourStep) return null;

    // Calculate tooltip position
    const getTooltipStyle = () => {
        const padding = 16;
        let top = 0;
        let left = 0;

        const position = currentTourStep.position || "bottom";

        switch (position) {
            case "top":
                top = targetPosition.top - padding;
                left = targetPosition.left + targetPosition.width / 2;
                break;
            case "bottom":
                top = targetPosition.bottom + padding;
                left = targetPosition.left + targetPosition.width / 2;
                break;
            case "left":
                top = targetPosition.top + targetPosition.height / 2;
                left = targetPosition.left - padding;
                break;
            case "right":
                top = targetPosition.top + targetPosition.height / 2;
                left = targetPosition.right + padding;
                break;
        }

        return { top: `${top}px`, left: `${left}px` };
    };

    const tooltipStyle = getTooltipStyle();
    const position = currentTourStep.position || "bottom";

    return (
        <>
            {/* Overlay with spotlight effect */}
            <div className="fixed inset-0 z-[90] pointer-events-none">
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                {/* Spotlight cutout */}
                <div
                    className="absolute border-4 border-primary rounded-2xl shadow-2xl shadow-primary/50 pointer-events-none animate-pulse-slow"
                    style={{
                        top: `${targetPosition.top - 8}px`,
                        left: `${targetPosition.left - 8}px`,
                        width: `${targetPosition.width + 16}px`,
                        height: `${targetPosition.height + 16}px`,
                        boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
                    }}
                />
            </div>

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="fixed z-[100] animate-scale-up"
                style={{
                    ...tooltipStyle,
                    transform:
                        position === "top" || position === "bottom"
                            ? "translateX(-50%)"
                            : position === "left"
                                ? "translate(-100%, -50%)"
                                : "translateY(-50%)",
                }}
            >
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm">
                    {/* Arrow pointer */}
                    <div
                        className={`absolute w-0 h-0 border-solid ${position === "top"
                            ? "bottom-[-12px] left-1/2 -translate-x-1/2 border-t-white border-l-transparent border-r-transparent border-b-transparent border-t-[12px] border-l-[12px] border-r-[12px]"
                            : position === "bottom"
                                ? "top-[-12px] left-1/2 -translate-x-1/2 border-b-white border-l-transparent border-r-transparent border-t-transparent border-b-[12px] border-l-[12px] border-r-[12px]"
                                : position === "left"
                                    ? "right-[-12px] top-1/2 -translate-y-1/2 border-l-white border-t-transparent border-b-transparent border-r-transparent border-l-[12px] border-t-[12px] border-b-[12px]"
                                    : "left-[-12px] top-1/2 -translate-y-1/2 border-r-white border-t-transparent border-b-transparent border-l-transparent border-r-[12px] border-t-[12px] border-b-[12px]"
                            }`}
                    />

                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Step {currentStep + 1} of {sortedSteps.length}
                        </span>
                        <button
                            onClick={handleSkip}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
                        >
                            Skip Tour
                        </button>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                        {currentTourStep.title}
                    </h3>
                    <p className="text-slate-600 font-medium leading-relaxed mb-6">
                        {currentTourStep.description}
                    </p>

                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrevious}
                                className="flex-1 bg-slate-100 text-slate-700 py-3 px-4 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                            >
                                ← Previous
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            {currentStep === sortedSteps.length - 1 ? "Finish 🎉" : "Next →"}
                        </button>
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-1.5 mt-4">
                        {sortedSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all ${index === currentStep
                                    ? "w-6 bg-primary"
                                    : index < currentStep
                                        ? "w-1.5 bg-primary/40"
                                        : "w-1.5 bg-slate-200"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
