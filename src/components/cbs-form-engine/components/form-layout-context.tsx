/**
 * @fileoverview Form Layout Direction & Density Context
 * @module form-engine/form-layout-context
 *
 * Core Invariants:
 * - Provides layout direction ("horizontal" standard 2-column or "stacked" single-column).
 */

"use client";

import * as React from "react";
import {
  DEFAULT_FORM_DENSITY,
  DEFAULT_FORM_LAYOUT,
  type FormDensity,
  type FormLayout,
} from "@/lib/data-schemas";

export interface FormLayoutContextValue {
  layout: FormLayout;
  density: FormDensity;
}

export const FORM_DENSITY_CLASSES: Record<
  FormDensity,
  {
    stack: string;
    stackView: string;
    gridGap: string;
    gridGapView: string;
    cardPadding: string;
    cardPaddingView: string;
  }
> = {
  compact: {
    stack: "space-y-1.5",
    stackView: "space-y-1",
    gridGap: "gap-x-3 gap-y-1.5",
    gridGapView: "gap-x-3 gap-y-1",
    cardPadding: "p-2.5",
    cardPaddingView: "px-2.5 py-1.5",
  },
  normal: {
    stack: "space-y-2.5",
    stackView: "space-y-1.5",
    gridGap: "gap-x-4 gap-y-2.5",
    gridGapView: "gap-x-4 gap-y-1.5",
    cardPadding: "p-3",
    cardPaddingView: "px-3 py-2",
  },
  spacious: {
    stack: "space-y-3.5",
    stackView: "space-y-2.5",
    gridGap: "gap-x-5 gap-y-3.5",
    gridGapView: "gap-x-5 gap-y-2.5",
    cardPadding: "p-4",
    cardPaddingView: "p-4",
  },
};

export const FormLayoutContext = React.createContext<FormLayoutContextValue>({
  layout: DEFAULT_FORM_LAYOUT,
  density: DEFAULT_FORM_DENSITY,
});

/**
 * Accesses current form layout context.
 */
export function useFormLayout(): FormLayoutContextValue {
  return React.useContext(FormLayoutContext);
}
