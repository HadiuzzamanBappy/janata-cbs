/**
 * Core Banking Configuration
 *
 * Provides isomorphic client-safe configuration for UI components by default,
 * while isolating server secrets behind explicit server modules.
 */

export * from "./client";
export { clientConfig as appConfig } from "./client";
