/**
 * Application-wide constants
 * Centralized location for all magic strings and constants
 */

export const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const ProductCategories = {
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  GRAINS: 'grains',
  DAIRY: 'dairy',
} as const;

export type ProductCategory = typeof ProductCategories[keyof typeof ProductCategories];

export const DeliverySteps = {
  ASSIGNING: 'assigning',
  PICKING_UP: 'picking_up',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
} as const;

export type DeliveryStep = typeof DeliverySteps[keyof typeof DeliverySteps];

export const NotificationTypes = {
  ORDER_NEW: 'order_new',
  ORDER_STATUS: 'order_status',
  REVIEW_NEW: 'review_new',
  MESSAGE: 'message',
  STOCK_EMPTY: 'stock_empty',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];

export const MessageTypes = {
  TEXT: 'text',
  IMAGE: 'image',
} as const;

export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];

// Validation constants
export const MIN_PRODUCT_PRICE = 0.01;
export const MIN_STOCK_QUANTITY = 0;
export const MAX_STOCK_QUANTITY = 1000000;

// UI Constants
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

