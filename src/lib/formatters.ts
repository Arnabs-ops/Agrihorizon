/**
 * Shared formatting utilities
 * Centralized location for all formatting functions
 */

import { OrderStatus } from './constants';

/**
 * Format a price value as currency
 * @param price - The price to format
 * @param currency - Currency code (default: 'INR')
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(price);
};

/**
 * Format a timestamp as a date string
 * @param timestamp - Unix timestamp in milliseconds
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number, locale: string = 'en-US'): string => {
  return new Date(timestamp).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a timestamp as a full date and time string
 * @param timestamp - Unix timestamp in milliseconds
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date and time string
 */
export const formatDateTime = (timestamp: number, locale: string = 'en-US'): string => {
  return new Date(timestamp).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get CSS classes for order status badge
 * @param status - Order status
 * @returns CSS class string for status badge
 */
const STATUS_COLORS: Record<OrderStatus, string> = {
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
} as const;

export const getStatusColor = (status: OrderStatus | string): string => {
  // Handle legacy string statuses
  if (status in STATUS_COLORS) {
    return STATUS_COLORS[status as OrderStatus];
  }
  return STATUS_COLORS.pending;
};

/**
 * Format a number with commas
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format a percentage value
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

