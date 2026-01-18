/**
 * Custom hook for error handling
 * Provides consistent error handling with translations
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from "../context/LanguageContext";
import { getErrorMessage, isAppError } from '../lib/errors';

/**
 * Custom hook for handling errors consistently
 */
export function useErrorHandler() {
  const { t } = useLanguage();

  const handleError = useCallback(
    (error: unknown, fallbackMessage?: string) => {
      let message: string;

      if (isAppError(error)) {
        // Use translation key if available, otherwise use error message
        message = error.translationKey
          ? t(error.translationKey as any) || error.message
          : error.message;
      } else {
        message = getErrorMessage(error);
      }

      // Use fallback message if provided and no specific message found
      if (!message && fallbackMessage) {
        message = fallbackMessage;
      }

      toast.error(message || t('genericError' as any) || 'An error occurred');
    },
    [t]
  );

  const handleSuccess = useCallback(
    (message: string, translationKey?: string) => {
      const displayMessage = translationKey ? t(translationKey as any) || message : message;
      toast.success(displayMessage);
    },
    [t]
  );

  return {
    handleError,
    handleSuccess,
  };
}

