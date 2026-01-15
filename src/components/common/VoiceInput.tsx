import React, { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../useLanguage';

interface VoiceInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    type?: 'text' | 'textarea';
}

export function VoiceInput({ value, onChange, placeholder, className, type = 'text' }: VoiceInputProps) {
    const { t, language } = useLanguage();
    const [isListening, setIsListening] = useState(false);

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Voice input not supported in this browser");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            toast.info(t('listening') || "Listening...");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onChange(value ? `${value} ${transcript}` : transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            toast.error(t('voiceSearchError') || "Could not understand audio");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    if (type === 'textarea') {
        return (
            <div className="relative group w-full">
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={className}
                />
                <button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`absolute right-3 top-3 p-2 rounded-xl transition-all active:scale-95 border ${isListening
                        ? 'bg-red-500 text-white animate-pulse border-red-400'
                        : 'bg-white text-slate-400 hover:text-primary hover:border-primary shadow-sm border-slate-200'
                        }`}
                    title="Voice Input"
                >
                    🎤
                </button>
            </div>
        );
    }

    return (
        <div className="relative group w-full">
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={className}
            />
            <button
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all active:scale-95 border ${isListening
                    ? 'bg-red-500 text-white animate-pulse border-red-400'
                    : 'bg-white text-slate-400 hover:text-primary hover:border-primary shadow-sm border-slate-200'
                    }`}
                title="Voice Input"
            >
                🎤
            </button>
        </div>
    );
}
