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
}

export const FormLayoutContext = React.createContext<FormLayoutContextValue>({
  layout: "horizontal",
});

/**
 * Accesses current form layout context.
 */
export function useFormLayout(): FormLayoutContextValue {
  return React.useContext(FormLayoutContext);
}
