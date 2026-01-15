/**
 * Custom hook for formatting utilities
 * Provides localized formatting functions based on current language
 */

import { useCallback } from 'react';
import { useLanguage } from '../useLanguage';
import {
  formatPrice as formatPriceUtil,
  formatDate as formatDateUtil,
  formatDateTime as formatDateTimeUtil,
  getStatusColor,
  formatNumber,
  formatPercentage,
} from '../lib/formatters';

/**
 * Custom hook that provides formatting functions with locale support
 */
export function useFormatters() {
  const { language } = useLanguage();
  
  const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-US';
  
  const formatPrice = useCallback(
    (price: number, currency: string = 'INR') => {
      return formatPriceUtil(price, currency, locale);
    },
    [locale]
  );
  
  const formatDate = useCallback(
    (timestamp: number) => {
      return formatDateUtil(timestamp, dateLocale);
    },
    [dateLocale]
  );
  
  const formatDateTime = useCallback(
    (timestamp: number) => {
      return formatDateTimeUtil(timestamp, dateLocale);
    },
    [dateLocale]
  );
  
  const getStatusColorClass = useCallback(
    (status: string) => {
      return getStatusColor(status);
    },
    []
  );
  
  return {
    formatPrice,
    formatDate,
    formatDateTime,
    getStatusColor: getStatusColorClass,
    formatNumber,
    formatPercentage,
  };
}

