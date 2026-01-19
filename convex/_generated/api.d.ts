/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as advisor from "../advisor.js";
import type * as auth from "../auth.js";
import type * as community from "../community.js";
import type * as files from "../files.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as paymentActions from "../paymentActions.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as reviews from "../reviews.js";
import type * as router from "../router.js";
import type * as users from "../users.js";
import type * as vegPrices from "../vegPrices.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  advisor: typeof advisor;
  auth: typeof auth;
  community: typeof community;
  files: typeof files;
  helpers: typeof helpers;
  http: typeof http;
  messages: typeof messages;
  notifications: typeof notifications;
  orders: typeof orders;
  paymentActions: typeof paymentActions;
  payments: typeof payments;
  products: typeof products;
  reviews: typeof reviews;
  router: typeof router;
  users: typeof users;
  vegPrices: typeof vegPrices;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
