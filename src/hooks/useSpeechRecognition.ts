import { useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useErrorHandler } from "./useErrorHandler";

interface UseSpeechRecognitionProps {
    onResult: (transcript: string) => void;
}

export function useSpeechRecognition({ onResult }: UseSpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const { language, t } = useLanguage();
    const { handleError, handleSuccess } = useErrorHandler();

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            handleError(new Error("Voice search not supported in this browser"), "voiceNotSupported");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            // toast.info(t('voiceSearchStart')); -> Will be replaced by handleInfo if needed, or just standard toast
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            handleError(event.error, "voiceSearchError");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    }, [language, onResult, handleError]);

    return {
        isListening,
        startListening
    };
}
