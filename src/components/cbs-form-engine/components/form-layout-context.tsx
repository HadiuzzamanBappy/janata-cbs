/**
 * @fileoverview Form Layout Direction & Density Context
 * @module form-engine/form-layout-context
 *
 * Core Invariants:
 * - Provides layout direction ("horizontal" standard 2-column or "stacked" single-column).
 */

"use client";

import * as React from "react";

export interface FormLayoutContextValue {
  layout: "horizontal" | "stacked";
  density: "compact" | "normal" | "spacious";
}

export const FormLayoutContext = React.createContext<FormLayoutContextValue>({
  layout: "horizontal",
  density: "compact",
});

/**
 * Accesses current form layout context.
 */
export function useFormLayout(): FormLayoutContextValue {
  return React.useContext(FormLayoutContext);
}
